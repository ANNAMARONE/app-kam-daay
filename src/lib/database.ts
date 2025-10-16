/**
 * Base de Données SQLite - Kame Daay React Native
 * Compatible Expo SQLite - Version 2 (API ASYNCHRONE Corrigée)
 * 🚨 CORRECTION: Remplacement de this.db.transaction() par runAsync/getAllAsync/execAsync.
 */

import { openDatabaseAsync, type WebSQLDatabase, type SQLiteRunResult } from 'expo-sqlite';

// --- Interfaces (Laissées inchangées) ---
export interface Client {
  id?: number;
  nom: string;
  prenom: string;
  telephone: string;
  adresse?: string;
  type?: 'Fidèle' | 'Nouveau' | 'Potentiel';
  notes?: string;
  derniereVisite?: number;
  createdAt: number;
}

export interface Vente {
  id?: number;
  clientId: number;
  articles: Article[];
  total: number;
  montantPaye: number;
  statut: 'Payé' | 'Crédit' | 'Partiel';
  date: number;
}

export interface Article {
  nom: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Interaction {
  id?: number;
  clientId: number;
  type: 'WhatsApp' | 'Note' | 'Satisfaction';
  message?: string;
  date: number;
}

export interface Template {
  id?: number;
  nom: string;
  message: string;
}

export interface Produit {
  id?: number;
  nom: string;
  prixUnitaire: number;
  description?: string;
  stock?: number;
  categorie?: string;
  createdAt: number;
}

export interface Paiement {
  id?: number;
  venteId: number;
  montant: number;
  date: number;
  methode: 'Espèces' | 'Mobile Money' | 'Virement' | 'Autre';
}

export interface Objectif {
  id?: number;
  mois: string;
  montantCible: number;
  description?: string;
}

export interface Depense {
  id?: number;
  categorie: string;
  montant: number;
  description: string;
  date: number;
  recu?: string;
}

export interface Rappel {
  id?: number;
  clientId: number;
  venteId: number;
  message: string;
  dateLimite: number;
  resolu: boolean;
  dateCreation: number;
}

export class KameDaayDatabase {
  private db: WebSQLDatabase; 

  private constructor(db: WebSQLDatabase) {
    this.db = db;
  }
  
  /**
   * Initialise la base de données de manière asynchrone et crée les tables.
   */
  static async initialize(): Promise<KameDaayDatabase> {
    const db = await openDatabaseAsync('kame_daay.db');
    const instance = new KameDaayDatabase(db);
    await instance.initDatabase(); // Attendre l'initialisation des tables
    return instance;
  }
  
  /**
   * Crée toutes les tables en utilisant execAsync (méthode V2).
   */
  private async initDatabase() {
    // Utiliser execAsync pour exécuter plusieurs instructions SQL efficacement.
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prenom TEXT NOT NULL,
        telephone TEXT NOT NULL,
        adresse TEXT,
        type TEXT,
        notes TEXT,
        derniereVisite INTEGER,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ventes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        articles TEXT NOT NULL,
        total REAL NOT NULL,
        montantPaye REAL NOT NULL,
        statut TEXT NOT NULL,
        date INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT,
        date INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        message TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS produits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prixUnitaire REAL NOT NULL,
        description TEXT,
        stock INTEGER,
        categorie TEXT,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS paiements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venteId INTEGER NOT NULL,
        montant REAL NOT NULL,
        date INTEGER NOT NULL,
        methode TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS objectifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mois TEXT NOT NULL UNIQUE,
        montantCible REAL NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS depenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categorie TEXT NOT NULL,
        montant REAL NOT NULL,
        description TEXT NOT NULL,
        date INTEGER NOT NULL,
        recu TEXT
      );

      CREATE TABLE IF NOT EXISTS rappels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        venteId INTEGER NOT NULL,
        message TEXT NOT NULL,
        dateLimite INTEGER NOT NULL,
        resolu INTEGER NOT NULL DEFAULT 0,
        dateCreation INTEGER NOT NULL
      );
    `);
  }

  // ------------------------------------
  // === CLIENTS ===
  // ------------------------------------
  async addClient(client: Client): Promise<number> {
    // 🚨 CORRECTION: Utilisation de runAsync pour l'insertion
    const result = await this.db.runAsync(
      'INSERT INTO clients (nom, prenom, telephone, adresse, type, notes, derniereVisite, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client.nom, client.prenom, client.telephone, client.adresse || null, client.type || null, client.notes || null, client.derniereVisite || null, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllClients(): Promise<Client[]> {
    // 🚨 CORRECTION: Utilisation de getAllAsync pour la lecture
    return this.db.getAllAsync<Client>(
      'SELECT * FROM clients ORDER BY createdAt DESC'
    );
  }

  async updateClient(id: number, client: Partial<Client>): Promise<void> {
    const fields = Object.keys(client).filter(k => k !== 'id');
    const values = fields.map(k => (client as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    // 🚨 CORRECTION: Utilisation de runAsync pour la mise à jour
    await this.db.runAsync(
      `UPDATE clients SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteClient(id: number): Promise<void> {
    // 🚨 CORRECTION: Utilisation de runAsync pour la suppression
    await this.db.runAsync(
      'DELETE FROM clients WHERE id = ?',
      [id]
    );
  }

  // ------------------------------------
  // === VENTES ===
  // ------------------------------------
  async addVente(vente: Vente): Promise<number> {
    // 🚨 CORRECTION: Utilisation de runAsync pour l'insertion
    const result = await this.db.runAsync(
      'INSERT INTO ventes (clientId, articles, total, montantPaye, statut, date) VALUES (?, ?, ?, ?, ?, ?)',
      [vente.clientId, JSON.stringify(vente.articles), vente.total, vente.montantPaye, vente.statut, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllVentes(): Promise<Vente[]> {
    // 🚨 CORRECTION: Utilisation de getAllAsync pour la lecture
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM ventes ORDER BY date DESC'
    );
    // Mapping pour parser le JSON 'articles'
    return rows.map(row => ({
      ...row,
      articles: JSON.parse(row.articles)
    }));
  }

  async updateVente(id: number, vente: Partial<Vente>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (vente.statut) {
      fields.push('statut = ?');
      values.push(vente.statut);
    }
    if (vente.montantPaye !== undefined) {
      fields.push('montantPaye = ?');
      values.push(vente.montantPaye);
    }
    
    if (fields.length > 0) {
      // 🚨 CORRECTION: Utilisation de runAsync pour la mise à jour
      await this.db.runAsync(
        `UPDATE ventes SET ${fields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
    }
  }

  // ------------------------------------
  // === PAIEMENTS ===
  // ------------------------------------
  async addPaiement(paiement: Paiement): Promise<number> {
    // 🚨 CORRECTION: Utilisation de runAsync pour l'insertion
    const result = await this.db.runAsync(
      'INSERT INTO paiements (venteId, montant, date, methode) VALUES (?, ?, ?, ?)',
      [paiement.venteId, paiement.montant, Date.now(), paiement.methode]
    );
    return result.lastInsertRowId;
  }

  async getAllPaiements(): Promise<Paiement[]> {
    // 🚨 CORRECTION: Utilisation de getAllAsync pour la lecture
    return this.db.getAllAsync<Paiement>(
      'SELECT * FROM paiements ORDER BY date DESC'
    );
  }

  // ------------------------------------
  // === TEMPLATES ===
  // ------------------------------------
  async addTemplate(template: Template): Promise<number> {
    // 🚨 CORRECTION: Utilisation de runAsync pour l'insertion
    const result = await this.db.runAsync(
      'INSERT INTO templates (nom, message) VALUES (?, ?)',
      [template.nom, template.message]
    );
    return result.lastInsertRowId;
  }

  async getAllTemplates(): Promise<Template[]> {
    // 🚨 CORRECTION: Utilisation de getAllAsync pour la lecture
    return this.db.getAllAsync<Template>(
      'SELECT * FROM templates'
    );
  }

  async deleteTemplate(id: number): Promise<void> {
    // 🚨 CORRECTION: Utilisation de runAsync pour la suppression
    await this.db.runAsync(
      'DELETE FROM templates WHERE id = ?',
      [id]
    );
  }

  // ------------------------------------
  // === DEPENSES ===
  // ------------------------------------
  async addDepense(depense: Depense): Promise<number> {
    // 🚨 CORRECTION: Utilisation de runAsync pour l'insertion
    const result = await this.db.runAsync(
      'INSERT INTO depenses (categorie, montant, description, date, recu) VALUES (?, ?, ?, ?, ?)',
      [depense.categorie, depense.montant, depense.description, depense.date || Date.now(), depense.recu || null]
    );
    return result.lastInsertRowId;
  }

  async getAllDepenses(): Promise<Depense[]> {
    // 🚨 CORRECTION: Utilisation de getAllAsync pour la lecture
    return this.db.getAllAsync<Depense>(
      'SELECT * FROM depenses ORDER BY date DESC'
    );
  }

  async deleteDepense(id: number): Promise<void> {
    // 🚨 CORRECTION: Utilisation de runAsync pour la suppression
    await this.db.runAsync(
      'DELETE FROM depenses WHERE id = ?',
      [id]
    );
  }

  // ------------------------------------
  // === RAPPELS ===
  // ------------------------------------
  async addRappel(rappel: Rappel): Promise<number> {
    // 🚨 CORRECTION: Utilisation de runAsync pour l'insertion
    const result = await this.db.runAsync(
      'INSERT INTO rappels (clientId, venteId, message, dateLimite, resolu, dateCreation) VALUES (?, ?, ?, ?, ?, ?)',
      [rappel.clientId, rappel.venteId, rappel.message, rappel.dateLimite, rappel.resolu ? 1 : 0, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllRappels(): Promise<Rappel[]> {
    // 🚨 CORRECTION: Utilisation de getAllAsync pour la lecture
    const rows = await this.db.getAllAsync<any>(
      'SELECT * FROM rappels ORDER BY dateLimite ASC'
    );
    // Mapping pour convertir l'entier 'resolu' en boolean
    return rows.map(row => ({
      ...row,
      resolu: row.resolu === 1
    }));
  }

  async updateRappel(id: number, rappel: Partial<Rappel>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (rappel.resolu !== undefined) {
      fields.push('resolu = ?');
      values.push(rappel.resolu ? 1 : 0);
    }
    
    if (fields.length > 0) {
      // 🚨 CORRECTION: Utilisation de runAsync pour la mise à jour
      await this.db.runAsync(
        `UPDATE rappels SET ${fields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
    }
  }

  async deleteRappel(id: number): Promise<void> {
    // 🚨 CORRECTION: Utilisation de runAsync pour la suppression
    await this.db.runAsync(
      'DELETE FROM rappels WHERE id = ?',
      [id]
    );
  }

  // ------------------------------------
  // === BACKUP & RESTORE ===
  // ------------------------------------
  async exportAllData(): Promise<string> {
    // Utilise les nouvelles méthodes getAll* corrigées
    const clients = await this.getAllClients();
    const ventes = await this.getAllVentes();
    const paiements = await this.getAllPaiements();
    const templates = await this.getAllTemplates();
    const depenses = await this.getAllDepenses();
    const rappels = await this.getAllRappels();

    const data = {
      clients,
      ventes,
      paiements,
      templates,
      depenses,
      rappels,
      exportDate: Date.now(),
      version: '2.0'
    };

    return JSON.stringify(data, null, 2);
  }

  async importAllData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Les boucles d'importation utilisent les méthodes add* corrigées (runAsync)
    for (const client of data.clients || []) {
      await this.addClient(client);
    }

    for (const vente of data.ventes || []) {
      await this.addVente(vente);
    }

    for (const paiement of data.paiements || []) {
      await this.addPaiement(paiement);
    }

    for (const template of data.templates || []) {
      await this.addTemplate(template);
    }

    for (const depense of data.depenses || []) {
      await this.addDepense(depense);
    }

    for (const rappel of data.rappels || []) {
      await this.addRappel(rappel);
    }
  }
  
  // ------------------------------------
  // === PRODUITS, OBJECTIFS, INTERACTIONS (Placeholders V2) ===
  // Les méthodes GET/ADD/UPDATE/DELETE pour ces tables
  // doivent être implémentées ici en utilisant runAsync/getAllAsync
  // si vous souhaitez les utiliser dans votre store.
  // ------------------------------------
  
  async addInteraction(interaction: Interaction): Promise<number> {
    const result = await this.db.runAsync(
        'INSERT INTO interactions (clientId, type, message, date) VALUES (?, ?, ?, ?)',
        [interaction.clientId, interaction.type, interaction.message || null, Date.now()]
    );
    return result.lastInsertRowId;
  }
  // Ajoutez d'autres méthodes (Produits, Objectifs) selon le même modèle si nécessaire.
}

// 🚨 RETRAIT DU NEW SYCHRONE: Il ne faut plus exporter une instance créée ici.
// L'instance doit être créée par KameDaayDatabase.initialize() dans App.js et injectée dans le store.
// export const database = new KameDaayDatabase(); // C'est ce qui causait le problème.