/**
 * Store Zustand - Kame Daay React Native
 * Gestion d'état globale compatible React Native - Version 2
 */

import { create, StateCreator } from 'zustand';
import {
  // 🚨 MODIFICATION 1: Importer la CLASSE, pas l'instance synchrone 'database'
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

// 🚨 NOUVEAU: Le store ne peut plus utiliser 'database' directement.
// Nous aurons besoin d'une instance de la DB.
let databaseInstance: KameDaayDatabase | null = null;

// Vous devrez appeler cette fonction dans votre App.tsx (ou équivalent)
export const setDatabaseInstance = (db: KameDaayDatabase) => {
  databaseInstance = db;
};


// Cette interface est inchangée
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
  isDbReady: boolean; // Ajout d'un indicateur pour l'état de la DB

  // Actions
  loadData: () => Promise<void>;
  // ... (toutes les autres actions)
  // Clients
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: number, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;

  // Ventes
  addVente: (vente: Omit<Vente, 'id'>) => Promise<void>;
  updateVente: (id: number, vente: Partial<Vente>) => Promise<void>;

  // Templates
  addTemplate: (template: Omit<Template, 'id'>) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;

  // Interactions (Implémentation ajoutée)
  addInteraction: (interaction: Omit<Interaction, 'id'>) => Promise<void>;

  // Produits (Implémentation ajoutée)
  addProduit: (produit: Omit<Produit, 'id'>) => Promise<void>;
  updateProduit: (id: number, produit: Partial<Produit>) => Promise<void>;
  deleteProduit: (id: number) => Promise<void>;

  // Paiements
  addPaiement: (paiement: Omit<Paiement, 'id'>) => Promise<void>;

  // Objectifs (Implémentation ajoutée)
  addObjectif: (objectif: Omit<Objectif, 'id'>) => Promise<void>;
  updateObjectif: (id: number, objectif: Partial<Objectif>) => Promise<void>;

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

// Fonction utilitaire pour obtenir l'instance de DB de manière sécurisée
const getDb = (): KameDaayDatabase => {
    if (!databaseInstance) {
        throw new Error("Database not initialized. Call setDatabaseInstance first.");
    }
    return databaseInstance;
};


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
  isDbReady: false, // 🚨 NOUVEAU: Initialisation de l'état de la DB

  loadData: async () => {
    // 🚨 Vérification avant l'accès à la DB
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
      const templates = await db.getAllTemplates();
      // NOTE: Produits et Objectifs ne sont pas implémentés dans getAll* dans database.ts. 
      // Nous allons les laisser vides ici si les méthodes n'existent pas.
      const produits: Produit[] = []; // Assumer vide ou appeler db.getAllProduits() si implémenté
      const objectifs: Objectif[] = []; // Assumer vide ou appeler db.getAllObjectifs() si implémenté
      
      const paiements = await db.getAllPaiements();
      const depenses = await db.getAllDepenses();
      const rappels = await db.getAllRappels();

      // Ajouter des templates par défaut si aucun
      if (templates.length === 0) {
        await db.addTemplate({
          nom: 'Bienvenue',
          message: 'Bonjour {{nom_client}}, bienvenue chez nous! Merci de votre confiance.'
        });
        await db.addTemplate({
          nom: 'Rappel',
          message: 'Bonjour {{nom_client}}, nous vous rappelons votre commande. Merci!'
        });
        const updatedTemplates = await db.getAllTemplates();
        set({
          clients,
          ventes,
          templates: updatedTemplates,
          produits,
          paiements,
          objectifs,
          depenses,
          rappels,
          isLoading: false,
          isDbReady: true // DB prête après le chargement
        });
      } else {
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
          isDbReady: true // DB prête après le chargement
        });
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      set({ isLoading: false, isDbReady: false });
    }
  },

  // --- Clients ---
  addClient: async (client) => {
    const db = getDb();
    await db.addClient(client);
    const clients = await db.getAllClients();
    set({ clients });
  },

  updateClient: async (id, client) => {
    const db = getDb();
    await db.updateClient(id, client);
    const clients = await db.getAllClients();
    set({ clients });
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
    // Le Omit est ignoré car addVente s'attend à Vente, mais sans 'id'. Le cast est correct.
    await db.addVente(vente as Vente); 
    const ventes = await db.getAllVentes();

    // Mettre à jour la dernière visite du client
    await db.updateClient(vente.clientId, { derniereVisite: Date.now() });
    const clients = await db.getAllClients();

    set({ ventes, clients });
  },

  updateVente: async (id, vente) => {
    const db = getDb();
    await db.updateVente(id, vente);
    const ventes = await db.getAllVentes();
    set({ ventes });
  },

  // --- Templates ---
  addTemplate: async (template) => {
    const db = getDb();
    await db.addTemplate(template as Template);
    const templates = await db.getAllTemplates();
    set({ templates });
  },

  deleteTemplate: async (id) => {
    const db = getDb();
    await db.deleteTemplate(id);
    const templates = await db.getAllTemplates();
    set({ templates });
  },

  // --- Interactions (Méthode addInteraction non implémentée, ici un placeholder) ---
  addInteraction: async (interaction) => {
    // 🚨 CORRECTION: Assurez-vous d'implémenter db.addInteraction dans database.ts si vous souhaitez sauvegarder les données.
    console.warn('Action addInteraction non implémentée dans la base de données.');
    // Si vous aviez implémenté db.addInteraction :
    // const db = getDb();
    // await db.addInteraction(interaction as Interaction);
    // ... code de mise à jour du store si nécessaire
  },

  // --- Produits (Méthodes non implémentées, ici des placeholders) ---
  addProduit: async (produit) => {
    // 🚨 CORRECTION: Assurez-vous d'implémenter db.addProduit, db.getAllProduits, etc.
    console.warn('Action addProduit non implémentée dans la base de données.');
  },

  updateProduit: async (id, produit) => {
    console.warn('Action updateProduit non implémentée dans la base de données.');
  },

  deleteProduit: async (id) => {
    console.warn('Action deleteProduit non implémentée dans la base de données.');
  },

  // --- Paiements ---
  addPaiement: async (paiement) => {
    const db = getDb();
    await db.addPaiement(paiement as Paiement);
    const paiements = await db.getAllPaiements();
    set({ paiements });
  },

  // --- Objectifs (Méthodes non implémentées, ici des placeholders) ---
  addObjectif: async (objectif) => {
    // 🚨 CORRECTION: Assurez-vous d'implémenter db.addObjectif et db.getAllObjectifs.
    console.warn('Action addObjectif non implémentée dans la base de données.');
  },

  updateObjectif: async (id, objectif) => {
    console.warn('Action updateObjectif non implémentée dans la base de données.');
  },

  // --- Depenses ---
  addDepense: async (depense) => {
    const db = getDb();
    await db.addDepense(depense as Depense);
    const depenses = await db.getAllDepenses();
    set({ depenses });
  },

  deleteDepense: async (id) => {
    const db = getDb();
    await db.deleteDepense(id);
    const depenses = await db.getAllDepenses();
    set({ depenses });
  },

  // --- Rappels ---
  addRappel: async (rappel) => {
    const db = getDb();
    await db.addRappel(rappel as Rappel);
    const rappels = await db.getAllRappels();
    set({ rappels });
  },

  updateRappel: async (id, rappel) => {
    const db = getDb();
    await db.updateRappel(id, rappel);
    const rappels = await db.getAllRappels();
    set({ rappels });
  },

  deleteRappel: async (id) => {
    const db = getDb();
    await db.deleteRappel(id);
    const rappels = await db.getAllRappels();
    set({ rappels });
  },

  // --- Backup & Restore ---
  exportData: async () => {
    const db = getDb();
    return await db.exportAllData();
  },

  importData: async (jsonData) => {
    const db = getDb();
    await db.importAllData(jsonData);
    
    // Recharger toutes les données après l'import
    const clients = await db.getAllClients();
    const ventes = await db.getAllVentes();
    const templates = await db.getAllTemplates();
    // NOTE: produits et objectifs restent vides si non implémentés
    const produits: Produit[] = []; 
    const objectifs: Objectif[] = []; 
    
    const paiements = await db.getAllPaiements();
    const depenses = await db.getAllDepenses();
    const rappels = await db.getAllRappels();

    set({ clients, ventes, templates, produits, paiements, objectifs, depenses, rappels });
  },
}));