/**
 * Store Zustand - Kame Daay React Native
 * Gestion d'état globale compatible React Native - Version 2
 */

import { create } from 'zustand';
import {
  KameDaayDatabase,
  Client,
  Vente,
  Template,
  Produit,
  Paiement,
  Objectif,
  Interaction,
  Depense,
  Rappel,
} from './database';
import { syncService } from './sync';

// 🚨 VARIABLE GLOBALE: L'instance de la DB est stockée ici.
let databaseInstance: KameDaayDatabase | null = null;

// Fonction utilisée par App.tsx pour injecter l'instance
export const setDatabaseInstance = (db: KameDaayDatabase) => {
  databaseInstance = db;
};

// 🚨 NOUVEAU: Getter pour récupérer l'instance (utilisé par ParametresPage et autres)
export const getDatabaseInstance = (): KameDaayDatabase | null => {
    return databaseInstance;
};

// Fonction utilitaire pour obtenir l'instance de DB de manière sécurisée
const getDb = (): KameDaayDatabase => {
    if (!databaseInstance) {
        // Dans un environnement de production/final, cela doit être géré par l'écran de chargement dans App.tsx
        throw new Error("Database not initialized. Call setDatabaseInstance first.");
    }
    return databaseInstance;
};

// Timer pour la synchronisation automatique
let autoSyncTimer: NodeJS.Timeout | null = null;

// Déclencher la synchronisation automatique après 2 secondes
const triggerAutoSync = () => {
  // Annuler le timer précédent s'il existe
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
  }
  
  // Planifier une nouvelle sync dans 2 secondes
  autoSyncTimer = setTimeout(async () => {
    console.log('🔄 Déclenchement de la synchronisation automatique...');
    await syncService.syncToServer();
  }, 2000);
};


interface AppState {
  // Data
  clients: Client[];
  ventes: Vente[];
  templates: Template[];
  produits: Produit[];
  paiements: Paiement[];
  objectifs: Objectif[];
  depenses: Depense[];
  rappels: Rappel[];
  isLoading: boolean;
  isDbReady: boolean;

  // Actions
  loadData: () => Promise<void>;
  
  // Clients
  addClient: (client: Omit<Client, 'id'>) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;

  // Ventes
  addVente: (vente: Omit<Vente, 'id'>) => Promise<void>;
  updateVente: (id: number, vente: Partial<Vente>) => Promise<void>;

  // Templates
  addTemplate: (template: Omit<Template, 'id'>) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;

  // Interactions
  addInteraction: (interaction: Omit<Interaction, 'id'>) => Promise<void>;

  // Produits
  addProduit: (produit: Omit<Produit, 'id'>) => Promise<void>;
  updateProduit: (id: number, produit: Partial<Produit>) => Promise<void>;
  deleteProduit: (id: number) => Promise<void>;

  // Paiements
  addPaiement: (paiement: Omit<Paiement, 'id'>) => Promise<void>;

  // Objectifs
  addObjectif: (objectif: Omit<Objectif, 'id'>) => Promise<void>;
  updateObjectif: (id: number, objectif: Partial<Objectif>) => Promise<void>;
  deleteObjectif: (id: number) => Promise<void>; // Ajout de deleteObjectif

  // Depenses
  addDepense: (depense: Omit<Depense, 'id'>) => Promise<void>;
  deleteDepense: (id: number) => Promise<void>;

  // Rappels
  addRappel: (rappel: Omit<Rappel, 'id'>) => Promise<void>;
  updateRappel: (id: number, rappel: Partial<Rappel>) => Promise<void>;
  deleteRappel: (id: number) => Promise<void>;

  // Backup & Restore
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
}


export const useStore = create<AppState>((set, get) => ({
  clients: [],
  ventes: [],
  templates: [],
  produits: [],
  paiements: [],
  objectifs: [],
  depenses: [],
  rappels: [],
  isLoading: true,
  isDbReady: false,

  loadData: async () => {
    if (!databaseInstance) {
        console.warn("Attempted to load data before database was ready.");
        set({ isLoading: false });
        return;
    }
    const db = getDb();

    set({ isLoading: true });
    try {
      const clients = await db.getAllClients();
      const ventes = await db.getAllVentes();
      let templates = await db.getAllTemplates();
      
      // 🚨 CORRECTION: Maintenant ces méthodes existent dans KameDaayDatabase
      const produits = await db.getAllProduits(); 
      const objectifs = await db.getAllObjectifs();
      
      const paiements = await db.getAllPaiements();
      const depenses = await db.getAllDepenses();
      const rappels = await db.getAllRappels();

      // Ajouter des templates par défaut si aucun
      if (templates.length === 0) {
        await db.addTemplate({
          nom: 'Bienvenue',
          message: 'Bonjour {{prenom_client}} {{nom_client}}, bienvenue chez nous! Merci de votre confiance.'
        });
        await db.addTemplate({
          nom: 'Rappel Paiement',
          message: 'Bonjour {{prenom_client}}, nous vous rappelons votre dette de {{montant_du}} sur la vente du {{date_vente}}. Merci!'
        });
        templates = await db.getAllTemplates(); // Recharger après l'ajout
      }

      set({
        clients,
        ventes,
        templates,
        produits,
        paiements,
        objectifs,
        depenses,
        rappels,
        isLoading: false,
        isDbReady: true
      });
      
    } catch (error) {
      console.error('Erreur de chargement:', error);
      set({ isLoading: false, isDbReady: false });
    }
  },

  // --- Clients ---
  addClient: async (client) => {
    const db = getDb();
    await db.addClient(client as Client);
    const clients = await db.getAllClients();
    set({ clients });
    // Déclencher la synchronisation automatique
    triggerAutoSync();
  },

  updateClient: async (id, client) => {
    const db = getDb();
    await db.updateClient(id, client);
    const clients = await db.getAllClients();
    set({ clients });
    // Déclencher la synchronisation automatique
    triggerAutoSync();
  },

  deleteClient: async (id) => {
    const db = getDb();
    await db.deleteClient(id);
    const clients = await db.getAllClients();
    set({ clients });
  },

  // --- Ventes ---
  addVente: async (vente) => {
    const db = getDb();
    // Le cast est nécessaire ici pour satisfaire l'interface de db.addVente
    await db.addVente(vente as Vente); 
    const ventes = await db.getAllVentes();

    // Mettre à jour la dernière visite du client
    await db.updateClient(vente.clientId, { derniereVisite: Date.now() });
    const clients = await db.getAllClients();

    set({ ventes, clients });
    // Déclencher la synchronisation automatique
    triggerAutoSync();
  },

  updateVente: async (id, vente) => {
    const db = getDb();
    await db.updateVente(id, vente);
    const ventes = await db.getAllVentes();
    set({ ventes });
    triggerAutoSync();
  },

  // --- Templates ---
  addTemplate: async (template) => {
    const db = getDb();
    await db.addTemplate(template as Template);
    const templates = await db.getAllTemplates();
    set({ templates });
    triggerAutoSync();
  },

  deleteTemplate: async (id) => {
    const db = getDb();
    await db.deleteTemplate(id);
    const templates = await db.getAllTemplates();
    set({ templates });
    triggerAutoSync();
  },

  // ------------------------------------
  // 🚨 CORRECTION: Interactions (Utilise la DB)
  // ------------------------------------
  addInteraction: async (interaction) => {
    const db = getDb();
    await db.addInteraction(interaction as Interaction);
    // Pas de mise à jour du store pour les interactions ici, car elles ne sont pas chargées.
    // Si elles étaient chargées, il faudrait appeler db.getAllInteractions().
  },

  // ------------------------------------
  // 🚨 CORRECTION: Produits (Utilise la DB)
  // ------------------------------------
  addProduit: async (produit) => {
    const db = getDb();
    await db.addProduit(produit as Produit);
    const produits = await db.getAllProduits();
    set({ produits });
    triggerAutoSync();
  },

  updateProduit: async (id, produit) => {
    const db = getDb();
    await db.updateProduit(id, produit);
    const produits = await db.getAllProduits();
    set({ produits });
    triggerAutoSync();
  },

  deleteProduit: async (id) => {
    const db = getDb();
    await db.deleteProduit(id);
    const produits = await db.getAllProduits();
    set({ produits });
    triggerAutoSync();
  },

  // --- Paiements ---
  addPaiement: async (paiement) => {
    const db = getDb();
    await db.addPaiement(paiement as Paiement);
    const paiements = await db.getAllPaiements();
    set({ paiements });
    triggerAutoSync();
  },

  // ------------------------------------
  // 🚨 CORRECTION: Objectifs (Utilise la DB)
  // ------------------------------------
  addObjectif: async (objectif) => {
    const db = getDb();
    await db.addObjectif(objectif as Objectif);
    const objectifs = await db.getAllObjectifs();
    set({ objectifs });
    triggerAutoSync();
  },

  updateObjectif: async (id, objectif) => {
    const db = getDb();
    await db.updateObjectif(id, objectif);
    const objectifs = await db.getAllObjectifs();
    set({ objectifs });
    triggerAutoSync();
  },
  
  deleteObjectif: async (id) => {
    const db = getDb();
    await db.deleteObjectif(id);
    const objectifs = await db.getAllObjectifs();
    set({ objectifs });
    triggerAutoSync();
  },

  // --- Depenses ---
  addDepense: async (depense) => {
    const db = getDb();
    await db.addDepense(depense as Depense);
    const depenses = await db.getAllDepenses();
    set({ depenses });
    triggerAutoSync();
  },

  deleteDepense: async (id) => {
    const db = getDb();
    await db.deleteDepense(id);
    const depenses = await db.getAllDepenses();
    set({ depenses });
    triggerAutoSync();
  },

  // --- Rappels ---
  addRappel: async (rappel) => {
    const db = getDb();
    await db.addRappel(rappel as Rappel);
    const rappels = await db.getAllRappels();
    set({ rappels });
    triggerAutoSync();
  },

  updateRappel: async (id, rappel) => {
    const db = getDb();
    await db.updateRappel(id, rappel);
    const rappels = await db.getAllRappels();
    set({ rappels });
    triggerAutoSync();
  },

  deleteRappel: async (id) => {
    const db = getDb();
    await db.deleteRappel(id);
    const rappels = await db.getAllRappels();
    set({ rappels });
    triggerAutoSync();
  },

  // --- Backup & Restore ---
  exportData: async () => {
    const db = getDb();
    return await db.exportAllData();
  },

  importData: async (jsonData) => {
    const db = getDb();
    await db.importAllData(jsonData);
    
    // Recharger toutes les données après l'import pour mettre à jour l'état
    const clients = await db.getAllClients();
    const ventes = await db.getAllVentes();
    const templates = await db.getAllTemplates();
    const produits = await db.getAllProduits();
    const objectifs = await db.getAllObjectifs();
    const paiements = await db.getAllPaiements();
    const depenses = await db.getAllDepenses();
    const rappels = await db.getAllRappels();

    set({ clients, ventes, templates, produits, paiements, objectifs, depenses, rappels });
  },
}));
