/**
 * Base de Données SQLite - Kame Daay React Native
 * Compatible Expo SQLite 15+ (SDK 52) - Nouvelle API Async
 */

import * as SQLite from 'expo-sqlite';

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
  public db: SQLite.SQLiteDatabase; // Changé de private à public
  private static instance: KameDaayDatabase | null = null;

  private constructor(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  // Méthode statique pour initialiser et retourner l'instance
  static async initialize(): Promise<KameDaayDatabase> {
    if (!KameDaayDatabase.instance) {
      const db = await SQLite.openDatabaseAsync('kame_daay.db');
      KameDaayDatabase.instance = new KameDaayDatabase(db);
      await KameDaayDatabase.instance.initDatabase();
    }
    return KameDaayDatabase.instance;
  }

  private async initDatabase() {
    console.log('📚 Initialisation de la base de données SQLite...');
    
    // Table Clients
    await this.db.execAsync(`
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
    `);

    // Table Ventes
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS ventes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        articles TEXT NOT NULL,
        total REAL NOT NULL,
        montantPaye REAL NOT NULL,
        statut TEXT NOT NULL,
        date INTEGER NOT NULL
      );
    `);

    // Table Interactions
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT,
        date INTEGER NOT NULL
      );
    `);

    // Table Templates
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        message TEXT NOT NULL
      );
    `);

    // Table Produits
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS produits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        prixUnitaire REAL NOT NULL,
        description TEXT,
        stock INTEGER,
        categorie TEXT,
        createdAt INTEGER NOT NULL
      );
    `);

    // Table Paiements
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS paiements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venteId INTEGER NOT NULL,
        montant REAL NOT NULL,
        date INTEGER NOT NULL,
        methode TEXT NOT NULL
      );
    `);

    // Table Objectifs
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS objectifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mois TEXT NOT NULL,
        montantCible REAL NOT NULL,
        description TEXT
      );
    `);

    // Table Depenses
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS depenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categorie TEXT NOT NULL,
        montant REAL NOT NULL,
        description TEXT NOT NULL,
        date INTEGER NOT NULL,
        recu TEXT
      );
    `);

    // Table Rappels
    await this.db.execAsync(`
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

    // Table de mapping UUID ↔ ID local (pour la synchronisation)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS uuid_mappings (
        uuid TEXT PRIMARY KEY,
        localId INTEGER NOT NULL,
        entityType TEXT NOT NULL,
        UNIQUE(localId, entityType)
      );
    `);
    
    console.log('✅ Base de données SQLite initialisée');
  }

  // === CLIENTS ===
  async addClient(client: Client): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO clients (nom, prenom, telephone, adresse, type, notes, derniereVisite, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client.nom, client.prenom, client.telephone, client.adresse || null, client.type || null, client.notes || null, client.derniereVisite || null, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllClients(): Promise<Client[]> {
    const result = await this.db.getAllAsync<Client>('SELECT * FROM clients ORDER BY createdAt DESC');
    return result;
  }

  async updateClient(id: number, client: Partial<Client>): Promise<void> {
    const fields = Object.keys(client).filter(k => k !== 'id');
    const values = fields.map(k => (client as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.runAsync(
      `UPDATE clients SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteClient(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
  }

  async getClientByPhone(telephone: string): Promise<Client | null> {
    const result = await this.db.getAllAsync<Client>(
      'SELECT * FROM clients WHERE telephone = ? LIMIT 1',
      [telephone]
    );
    return result.length > 0 ? result[0] : null;
  }

  async getClientById(id: number): Promise<Client | null> {
    const result = await this.db.getAllAsync<Client>(
      'SELECT * FROM clients WHERE id = ? LIMIT 1',
      [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  // === UUID MAPPINGS ===
  async saveUuidMapping(uuid: string, localId: number, entityType: 'client' | 'vente' | 'paiement' | 'produit' | 'template' | 'objectif' | 'depense' | 'rappel'): Promise<void> {
    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO uuid_mappings (uuid, localId, entityType) VALUES (?, ?, ?)',
        [uuid, localId, entityType]
      );
    } catch (error) {
      console.error('❌ Erreur saveUuidMapping:', error);
      throw error;
    }
  }

  async getUuidMapping(localId: number, entityType: string): Promise<string | null> {
    try {
      const result = await this.db.getAllAsync<{ uuid: string }>(
        'SELECT uuid FROM uuid_mappings WHERE localId = ? AND entityType = ? LIMIT 1',
        [localId, entityType]
      );
      return result.length > 0 ? result[0].uuid : null;
    } catch (error) {
      console.error('❌ Erreur getUuidMapping:', error);
      return null;
    }
  }

  async getLocalIdFromUuid(uuid: string, entityType: string): Promise<number | null> {
    try {
      const result = await this.db.getAllAsync<{ localId: number }>(
        'SELECT localId FROM uuid_mappings WHERE uuid = ? AND entityType = ? LIMIT 1',
        [uuid, entityType]
      );
      return result.length > 0 ? result[0].localId : null;
    } catch (error) {
      console.error('❌ Erreur getLocalIdFromUuid:', error);
      return null;
    }
  }

  async getUuidFromLocalId(localId: number, entityType: string): Promise<string | null> {
    try {
      const result = await this.db.getAllAsync<{uuid: string}>(
        'SELECT uuid FROM uuid_mappings WHERE localId = ? AND entityType = ? LIMIT 1',
        [localId, entityType]
      );
      return result.length > 0 ? result[0].uuid : null;
    } catch (error) {
      console.error('❌ Erreur getUuidFromLocalId:', error);
      return null;
    }
  }

  async clearUuidMappings(): Promise<void> {
    try {
      await this.db.runAsync('DELETE FROM uuid_mappings');
      console.log('✅ Tous les mappings UUID supprimés');
    } catch (error) {
      console.error('❌ Erreur clearUuidMappings:', error);
      throw error;
    }
  }

  // === MIGRATION & CLEANUP ===
  async cleanupCorruptedVentes(): Promise<void> {
    console.log('🧹 Nettoyage des ventes corrompues...');
    
    // Supprimer toutes les ventes dont le clientId n'est pas un nombre
    const allVentes = await this.db.getAllAsync<any>('SELECT * FROM ventes');
    
    let cleaned = 0;
    for (const vente of allVentes) {
      if (typeof vente.clientId !== 'number') {
        console.log(`  ❌ Suppression vente ${vente.id} avec clientId invalide: ${vente.clientId}`);
        await this.db.runAsync('DELETE FROM ventes WHERE id = ?', [vente.id]);
        cleaned++;
      }
    }
    
    console.log(`✅ ${cleaned} ventes corrompues supprimées`);
  }

  // === VENTES ===
  async addVente(vente: Vente): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO ventes (clientId, articles, total, montantPaye, statut, date) VALUES (?, ?, ?, ?, ?, ?)',
      [vente.clientId, JSON.stringify(vente.articles), vente.total, vente.montantPaye, vente.statut, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllVentes(): Promise<Vente[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM ventes ORDER BY date DESC');
    
    // Log pour déboguer les ventes
    if (rows.length > 0) {
      console.log('🔍 Première vente brute de SQLite:', {
        id: rows[0].id,
        clientId: rows[0].clientId,
        typeId: typeof rows[0].id,
        typeClientId: typeof rows[0].clientId,
        allKeys: Object.keys(rows[0])
      });
    }
    
    return rows.map((row, index) => {
      // Vérifier si clientId est valide
      if (!row.clientId || typeof row.clientId !== 'number') {
        console.error(`❌ Vente ${index} (id=${row.id}) a un clientId invalide:`, {
          clientId: row.clientId,
          typeClientId: typeof row.clientId,
          row
        });
      }
      
      return {
        ...row,
        articles: JSON.parse(row.articles)
      };
    });
  }

  async updateVente(id: number, vente: Partial<Vente>): Promise<void> {
    const updates: any = { ...vente };
    if (updates.articles) {
      updates.articles = JSON.stringify(updates.articles);
    }
    
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => updates[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.runAsync(
      `UPDATE ventes SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  // === INTERACTIONS ===
  async addInteraction(interaction: Interaction): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO interactions (clientId, type, message, date) VALUES (?, ?, ?, ?)',
      [interaction.clientId, interaction.type, interaction.message || null, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllInteractions(): Promise<Interaction[]> {
    return await this.db.getAllAsync<Interaction>('SELECT * FROM interactions ORDER BY date DESC');
  }

  async getClientInteractions(clientId: number): Promise<Interaction[]> {
    return await this.db.getAllAsync<Interaction>(
      'SELECT * FROM interactions WHERE clientId = ? ORDER BY date DESC',
      [clientId]
    );
  }

  // === PAIEMENTS ===
  async addPaiement(paiement: Paiement): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO paiements (venteId, montant, date, methode) VALUES (?, ?, ?, ?)',
      [paiement.venteId, paiement.montant, Date.now(), paiement.methode]
    );
    return result.lastInsertRowId;
  }

  async getAllPaiements(): Promise<Paiement[]> {
    return await this.db.getAllAsync<Paiement>('SELECT * FROM paiements ORDER BY date DESC');
  }

  // === TEMPLATES ===
  async addTemplate(template: Template): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO templates (nom, message) VALUES (?, ?)',
      [template.nom, template.message]
    );
    return result.lastInsertRowId;
  }

  async getAllTemplates(): Promise<Template[]> {
    return await this.db.getAllAsync<Template>('SELECT * FROM templates');
  }

  async updateTemplate(id: number, template: Partial<Template>): Promise<void> {
    const fields = Object.keys(template).filter(k => k !== 'id');
    const values = fields.map(k => (template as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    if (fields.length > 0) {
      await this.db.runAsync(
        `UPDATE templates SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    }
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM templates WHERE id = ?', [id]);
  }

  // === PRODUITS ===
  async addProduit(produit: Produit): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO produits (nom, prixUnitaire, description, stock, categorie, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [produit.nom, produit.prixUnitaire, produit.description || null, produit.stock || null, produit.categorie || null, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllProduits(): Promise<Produit[]> {
    return await this.db.getAllAsync<Produit>('SELECT * FROM produits ORDER BY createdAt DESC');
  }

  async updateProduit(id: number, produit: Partial<Produit>): Promise<void> {
    const fields = Object.keys(produit).filter(k => k !== 'id');
    const values = fields.map(k => (produit as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.runAsync(
      `UPDATE produits SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteProduit(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM produits WHERE id = ?', [id]);
  }

  // === OBJECTIFS ===
  async addObjectif(objectif: Objectif): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO objectifs (mois, montantCible, description) VALUES (?, ?, ?)',
      [objectif.mois, objectif.montantCible, objectif.description || null]
    );
    return result.lastInsertRowId;
  }

  async getAllObjectifs(): Promise<Objectif[]> {
    return await this.db.getAllAsync<Objectif>('SELECT * FROM objectifs ORDER BY mois DESC');
  }

  async updateObjectif(id: number, objectif: Partial<Objectif>): Promise<void> {
    const fields = Object.keys(objectif).filter(k => k !== 'id');
    const values = fields.map(k => (objectif as any)[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.runAsync(
      `UPDATE objectifs SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteObjectif(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM objectifs WHERE id = ?', [id]);
  }

  // === DEPENSES ===
  async addDepense(depense: Depense): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO depenses (categorie, montant, description, date, recu) VALUES (?, ?, ?, ?, ?)',
      [depense.categorie, depense.montant, depense.description, depense.date || Date.now(), depense.recu || null]
    );
    return result.lastInsertRowId;
  }

  async getAllDepenses(): Promise<Depense[]> {
    return await this.db.getAllAsync<Depense>('SELECT * FROM depenses ORDER BY date DESC');
  }

  async deleteDepense(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM depenses WHERE id = ?', [id]);
  }

  // === RAPPELS ===
  async addRappel(rappel: Rappel): Promise<number> {
    const result = await this.db.runAsync(
      'INSERT INTO rappels (clientId, venteId, message, dateLimite, resolu, dateCreation) VALUES (?, ?, ?, ?, ?, ?)',
      [rappel.clientId, rappel.venteId, rappel.message, rappel.dateLimite, rappel.resolu ? 1 : 0, Date.now()]
    );
    return result.lastInsertRowId;
  }

  async getAllRappels(): Promise<Rappel[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM rappels ORDER BY dateLimite ASC');
    return rows.map(row => ({
      ...row,
      resolu: row.resolu === 1
    }));
  }

  async updateRappel(id: number, rappel: Partial<Rappel>): Promise<void> {
    const updates: any = { ...rappel };
    if (updates.resolu !== undefined) {
      updates.resolu = updates.resolu ? 1 : 0;
    }

    const fields = Object.keys(updates).filter(k => k !== 'id');
    const values = fields.map(k => updates[k]);
    const setClause = fields.map(f => `${f} = ?`).join(', ');

    await this.db.runAsync(
      `UPDATE rappels SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
  }

  async deleteRappel(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM rappels WHERE id = ?', [id]);
  }

  // === BACKUP & RESTORE ===
  async exportAllData(): Promise<string> {
    const clients = await this.getAllClients();
    const ventes = await this.getAllVentes();
    const templates = await this.getAllTemplates();
    const produits = await this.getAllProduits();
    const paiements = await this.getAllPaiements();
    const objectifs = await this.getAllObjectifs();
    const depenses = await this.getAllDepenses();
    const rappels = await this.getAllRappels();

    return JSON.stringify({
      clients,
      ventes,
      templates,
      produits,
      paiements,
      objectifs,
      depenses,
      rappels,
      exportDate: Date.now()
    });
  }

  async importAllData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Import clients
    for (const client of data.clients || []) {
      await this.addClient(client);
    }

    // Import ventes
    for (const vente of data.ventes || []) {
      await this.addVente(vente);
    }

    // Import templates
    for (const template of data.templates || []) {
      await this.addTemplate(template);
    }

    // Import produits
    for (const produit of data.produits || []) {
      await this.addProduit(produit);
    }

    // Import paiements
    for (const paiement of data.paiements || []) {
      await this.addPaiement(paiement);
    }

    // Import objectifs
    for (const objectif of data.objectifs || []) {
      await this.addObjectif(objectif);
    }

    // Import depenses
    for (const depense of data.depenses || []) {
      await this.addDepense(depense);
    }

    // Import rappels
    for (const rappel of data.rappels || []) {
      await this.addRappel(rappel);
    }
  }
}