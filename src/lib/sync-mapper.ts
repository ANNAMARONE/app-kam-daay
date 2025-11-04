/**
 * Mapper de Synchronisation - Kame Daay
 * Convertit les données entre le format SQLite (mobile) et MySQL (serveur)
 */

import { Client, Vente, Paiement, Produit, Template, Objectif, Depense, Rappel } from './database';

// ============================================================================
// GÉNÉRATION D'UUID À PARTIR D'IDS NUMÉRIQUES
// ============================================================================

/**
 * Génère un UUID v4 déterministe à partir d'un ID numérique et d'un type
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
const generateUuidFromId = (id: number, type: string): string => {
  // Créer un hash simple basé sur l'ID et le type
  const hash = `${type}-${id}`.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Convertir en chaîne hexadécimale
  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  
  // Formater en UUID v4
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-4${hex.substr(12, 3)}-${hex.substr(15, 4)}-${hex.substr(19, 12)}`;
};

// ============================================================================
// MAPPING MOBILE → SERVEUR
// ============================================================================

export const mapClientToServer = (client: Client) => ({
  id: generateUuidFromId(client.id, 'client'),
  nom: client.nom,
  prenom: client.prenom,
  telephone: client.telephone,
  email: null, // Pas dans SQLite
  adresse: client.adresse || null,
  notes: client.notes || null
});

export const mapVenteToServer = (vente: Vente) => ({
  id: generateUuidFromId(vente.id, 'vente'),
  clientId: generateUuidFromId(vente.clientId, 'client'),
  montant: vente.total,
  montantPaye: vente.montantPaye,
  typePaiement: vente.statut, // 'Payé', 'Crédit', 'Partiel'
  produits: vente.articles, // Déjà en format JSON
  notes: null,
  dateVente: new Date(vente.date).toISOString().slice(0, 19).replace('T', ' ')
});

export const mapPaiementToServer = (paiement: Paiement) => ({
  id: generateUuidFromId(paiement.id, 'paiement'),
  venteId: generateUuidFromId(paiement.venteId, 'vente'),
  montant: paiement.montant,
  notes: null,
  datePaiement: new Date(paiement.date).toISOString().slice(0, 19).replace('T', ' ')
});

export const mapProduitToServer = (produit: Produit) => ({
  id: generateUuidFromId(produit.id, 'produit'),
  nom: produit.nom,
  prix: produit.prixUnitaire,
  description: produit.description || null
});

export const mapTemplateToServer = (template: Template) => ({
  id: generateUuidFromId(template.id, 'template'),
  nom: template.nom,
  contenu: template.message
});

export const mapObjectifToServer = (objectif: Objectif) => ({
  id: generateUuidFromId(objectif.id, 'objectif'),
  montant: objectif.montantCible,
  periode: objectif.mois,
  dateDebut: null,
  dateFin: null
});

export const mapDepenseToServer = (depense: Depense) => ({
  id: generateUuidFromId(depense.id, 'depense'),
  montant: depense.montant,
  categorie: depense.categorie,
  description: depense.description,
  dateDepense: new Date(depense.date).toISOString().slice(0, 19).replace('T', ' ')
});

export const mapRappelToServer = (rappel: Rappel) => ({
  id: generateUuidFromId(rappel.id, 'rappel'),
  clientId: rappel.clientId ? generateUuidFromId(rappel.clientId, 'client') : null,
  titre: rappel.message.substring(0, 100), // Prendre les 100 premiers caractères comme titre
  description: rappel.message,
  dateRappel: new Date(rappel.dateLimite).toISOString().slice(0, 19).replace('T', ' '),
  resolu: rappel.resolu ? 1 : 0
});

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
