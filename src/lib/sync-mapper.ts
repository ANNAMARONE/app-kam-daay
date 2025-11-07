/**
 * Mapper de Synchronisation - Kame Daay
 * Convertit les données entre le format SQLite (mobile) et MySQL (serveur)
 */

import { Client, Vente, Paiement, Produit, Template, Objectif, Depense, Rappel } from './database';
import { getDatabaseInstance } from './store';

// ============================================================================
// GÉNÉRATION D'UUID À PARTIR D'IDS NUMÉRIQUES
// ============================================================================

/**
 * Génère un UUID v4 déterministe à partir d'un ID numérique et d'un type
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * 
 * IMPORTANT: Cette fonction génère toujours le même UUID pour un couple (id, type) donné
 * Cela garantit la cohérence entre les synchronisations
 */
const generateUuidFromId = (id: number | undefined, type: string): string => {
  // Vérifier que l'ID est un nombre valide
  if (id === undefined || id === null || typeof id !== 'number' || isNaN(id) || id === 0) {
    console.error(`❌ ID invalide pour ${type}:`, {
      id,
      typeofId: typeof id,
      isNull: id === null,
      isUndefined: id === undefined,
      isNaN: isNaN(id as any)
    });
    throw new Error(`ID invalide pour ${type}: ${id} (type: ${typeof id})`);
  }
  
  // Créer une chaîne unique basée sur le type et l'ID
  const input = `${type}-${id}`;
  
  // Créer un hash plus robuste avec plusieurs passes
  let hash1 = 0;
  let hash2 = 0;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 = hash1 & hash1; // Convert to 32bit integer
    hash2 = ((hash2 << 7) - hash2) + char * 31;
    hash2 = hash2 & hash2;
  }
  
  // Convertir les hash en hexadécimal et les combiner
  const hex1 = Math.abs(hash1).toString(16).padStart(16, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(16, '0');
  const combined = (hex1 + hex2).padStart(32, '0');
  
  // Assurer que l'ID est un nombre valide pour le modulo
  const validId = Math.abs(Math.floor(id));
  const variantIndex = validId % 4;
  const variant = ['8', '9', 'a', 'b'][variantIndex];
  
  if (variant === undefined) {
    console.error(`❌ Variant undefined pour ${type}:`, {
      id,
      validId,
      variantIndex,
      modulo: validId % 4
    });
    throw new Error(`Variant undefined pour ${type}: id=${id}`);
  }
  
  // Formater en UUID v4 valide
  // Version 4 UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // Le 4 indique la version, et y doit être 8, 9, a ou b
  const uuid = `${combined.substring(0, 8)}-${combined.substring(8, 12)}-4${combined.substring(13, 16)}-${variant}${combined.substring(17, 20)}-${combined.substring(20, 32)}`;
  
  // Vérifier que l'UUID ne contient pas "undefined"
  if (uuid.includes('undefined')) {
    console.error(`❌ UUID contient "undefined":`, {
      uuid,
      id,
      type,
      variant,
      combined: combined.substring(0, 50)
    });
    throw new Error(`UUID invalide généré pour ${type}: ${uuid}`);
  }
  
  return uuid;
};

// ============================================================================
// MAPPING MOBILE → SERVEUR
// ============================================================================

export const mapClientToServer = (client: Client) => {
  if (!client.id) {
    console.error('❌ Client sans ID:', client);
    throw new Error(`Client sans ID: ${client.nom} ${client.prenom}`);
  }
  
  return {
    id: generateUuidFromId(client.id, 'client'),
    nom: client.nom,
    prenom: client.prenom,
    telephone: client.telephone,
    email: null, // Pas dans SQLite
    adresse: client.adresse || null,
    notes: client.notes || null
  };
};

export const mapVenteToServer = (vente: Vente) => {
  // Log détaillé de la vente
  console.log('🔍 Mapping vente:', {
    id: vente.id,
    clientId: vente.clientId,
    typeId: typeof vente.id,
    typeClientId: typeof vente.clientId,
    isNaNId: isNaN(vente.id as any),
    isNaNClientId: isNaN(vente.clientId as any)
  });
  
  if (!vente.id || typeof vente.id !== 'number' || isNaN(vente.id)) {
    console.error('❌ Vente avec ID invalide:', vente);
    throw new Error(`Vente avec ID invalide: ${vente.id} (type: ${typeof vente.id})`);
  }
  
  if (!vente.clientId || typeof vente.clientId !== 'number' || isNaN(vente.clientId)) {
    console.error('❌ Vente avec clientId invalide:', vente);
    throw new Error(`Vente avec clientId invalide: ${vente.clientId} (type: ${typeof vente.clientId}, venteId: ${vente.id})`);
  }
  
  const venteUuid = generateUuidFromId(vente.id, 'vente');
  const clientUuid = generateUuidFromId(vente.clientId, 'client');
  
  console.log(`  ✅ UUIDs générés: vente=${venteUuid}, client=${clientUuid}`);
  
  return {
    id: venteUuid,
    clientId: clientUuid,
    montant: vente.total,
    montantPaye: vente.montantPaye,
    typePaiement: vente.statut, // 'Payé', 'Crédit', 'Partiel'
    produits: vente.articles, // Déjà en format JSON
    notes: null,
    dateVente: new Date(vente.date).toISOString().slice(0, 19).replace('T', ' ')
  };
};

export const mapPaiementToServer = (paiement: Paiement) => {
  if (!paiement.id) {
    console.error('❌ Paiement sans ID:', paiement);
    throw new Error(`Paiement sans ID valide`);
  }
  if (!paiement.venteId) {
    console.error('❌ Paiement sans venteId:', paiement);
    throw new Error(`Paiement sans venteId valide (paiementId: ${paiement.id})`);
  }
  
  return {
    id: generateUuidFromId(paiement.id, 'paiement'),
    venteId: generateUuidFromId(paiement.venteId, 'vente'),
    montant: paiement.montant,
    notes: null,
    datePaiement: new Date(paiement.date).toISOString().slice(0, 19).replace('T', ' ')
  };
};

export const mapProduitToServer = (produit: Produit) => {
  if (!produit.id) {
    console.error('❌ Produit sans ID:', produit);
    throw new Error(`Produit sans ID: ${produit.nom}`);
  }
  
  return {
    id: generateUuidFromId(produit.id, 'produit'),
    nom: produit.nom,
    prix: produit.prixUnitaire,
    description: produit.description || null
  };
};

export const mapTemplateToServer = (template: Template) => {
  if (!template.id) {
    console.error('❌ Template sans ID:', template);
    throw new Error(`Template sans ID: ${template.nom}`);
  }
  
  return {
    id: generateUuidFromId(template.id, 'template'),
    nom: template.nom,
    contenu: template.message
  };
};

export const mapObjectifToServer = (objectif: Objectif) => {
  if (!objectif.id) {
    console.error('❌ Objectif sans ID:', objectif);
    throw new Error(`Objectif sans ID`);
  }
  
  return {
    id: generateUuidFromId(objectif.id, 'objectif'),
    montant: objectif.montantCible,
    periode: objectif.mois,
    dateDebut: null,
    dateFin: null
  };
};

export const mapDepenseToServer = (depense: Depense) => {
  if (!depense.id) {
    console.error('❌ Dépense sans ID:', depense);
    throw new Error(`Dépense sans ID`);
  }
  
  return {
    id: generateUuidFromId(depense.id, 'depense'),
    montant: depense.montant,
    categorie: depense.categorie,
    description: depense.description,
    dateDepense: new Date(depense.date).toISOString().slice(0, 19).replace('T', ' ')
  };
};

export const mapRappelToServer = (rappel: Rappel) => {
  if (!rappel.id) {
    console.error('❌ Rappel sans ID:', rappel);
    throw new Error(`Rappel sans ID`);
  }
  
  return {
    id: generateUuidFromId(rappel.id, 'rappel'),
    clientId: rappel.clientId ? generateUuidFromId(rappel.clientId, 'client') : null,
    titre: rappel.message.substring(0, 100), // Prendre les 100 premiers caractères comme titre
    description: rappel.message,
    dateRappel: new Date(rappel.dateLimite).toISOString().slice(0, 19).replace('T', ' '),
    resolu: rappel.resolu ? 1 : 0
  };
};

// ============================================================================
// MAPPING SERVEUR → MOBILE
// ============================================================================

export const mapClientFromServer = (serverClient: any): Client => ({
  id: serverClient.id,
  nom: serverClient.nom,
  prenom: serverClient.prenom,
  telephone: serverClient.telephone,
  adresse: serverClient.adresse,
  type: undefined, // Pas dans MySQL
  notes: serverClient.notes,
  derniereVisite: undefined,
  createdAt: new Date(serverClient.created_at || Date.now()).getTime()
});

export const mapVenteFromServer = (serverVente: any): Vente => ({
  id: serverVente.id,
  clientId: serverVente.client_id,
  articles: typeof serverVente.produits === 'string' 
    ? JSON.parse(serverVente.produits) 
    : serverVente.produits || [],
  total: serverVente.montant,
  montantPaye: serverVente.montant_paye,
  statut: serverVente.type_paiement as 'Payé' | 'Crédit' | 'Partiel',
  date: new Date(serverVente.date_vente || Date.now()).getTime()
});

export const mapPaiementFromServer = (serverPaiement: any): Paiement => ({
  id: serverPaiement.id,
  venteId: serverPaiement.vente_id,
  montant: serverPaiement.montant,
  date: new Date(serverPaiement.date_paiement || Date.now()).getTime(),
  methode: 'Espèces' as const // Default
});

export const mapProduitFromServer = (serverProduit: any): Produit => ({
  id: serverProduit.id,
  nom: serverProduit.nom,
  prixUnitaire: serverProduit.prix,
  description: serverProduit.description,
  stock: undefined,
  categorie: undefined,
  createdAt: new Date(serverProduit.created_at || Date.now()).getTime()
});

export const mapTemplateFromServer = (serverTemplate: any): Template => ({
  id: serverTemplate.id,
  nom: serverTemplate.nom,
  message: serverTemplate.contenu
});

export const mapObjectifFromServer = (serverObjectif: any): Objectif => ({
  id: serverObjectif.id,
  mois: serverObjectif.periode,
  montantCible: serverObjectif.montant,
  description: undefined
});

export const mapDepenseFromServer = (serverDepense: any): Depense => ({
  id: serverDepense.id,
  categorie: serverDepense.categorie,
  montant: serverDepense.montant,
  description: serverDepense.description,
  date: new Date(serverDepense.date_depense || Date.now()).getTime(),
  recu: undefined
});

export const mapRappelFromServer = (serverRappel: any): Rappel => ({
  id: serverRappel.id,
  clientId: serverRappel.client_id,
  venteId: 0, // Pas dans MySQL
  message: serverRappel.description || serverRappel.titre,
  dateLimite: new Date(serverRappel.date_rappel || Date.now()).getTime(),
  resolu: serverRappel.resolu === 1,
  dateCreation: new Date(serverRappel.created_at || Date.now()).getTime()
});

// ============================================================================
// FONCTIONS DE MAPPING EN MASSE
// ============================================================================

export const mapAllDataToServer = (data: {
  clients: Client[];
  ventes: Vente[];
  paiements: Paiement[];
  produits: Produit[];
  templates: Template[];
  objectifs: Objectif[];
  depenses: Depense[];
  rappels: Rappel[];
}) => ({
  clients: data.clients.map(mapClientToServer),
  ventes: data.ventes.map(mapVenteToServer),
  paiements: data.paiements.map(mapPaiementToServer),
  produits: data.produits.map(mapProduitToServer),
  templates: data.templates.map(mapTemplateToServer),
  objectifs: data.objectifs.map(mapObjectifToServer),
  depenses: data.depenses.map(mapDepenseToServer),
  rappels: data.rappels.map(mapRappelToServer)
});

export const mapAllDataFromServer = (serverData: any) => ({
  clients: (serverData.clients || []).map(mapClientFromServer),
  ventes: (serverData.ventes || []).map(mapVenteFromServer),
  paiements: (serverData.paiements || []).map(mapPaiementFromServer),
  produits: (serverData.produits || []).map(mapProduitFromServer),
  templates: (serverData.templates || []).map(mapTemplateFromServer),
  objectifs: (serverData.objectifs || []).map(mapObjectifFromServer),
  depenses: (serverData.depenses || []).map(mapDepenseFromServer),
  rappels: (serverData.rappels || []).map(mapRappelFromServer)
});
