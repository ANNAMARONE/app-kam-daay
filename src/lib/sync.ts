/**
 * Service de Synchronisation - Kame Daay Mobile
 * Synchronise les données entre SQLite (mobile) et MySQL (serveur)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getDatabaseInstance } from './store';
import { getApiUrl, getAuthHeaders } from './api-config';
import { mapAllDataToServer, mapAllDataFromServer } from './sync-mapper';

export interface SyncState {
  lastSyncTime: number;
  isSyncing: boolean;
  pendingChanges: number;
}

class SyncService {
  private syncState: SyncState = {
    lastSyncTime: 0,
    isSyncing: false,
    pendingChanges: 0
  };

  private accessToken: string | null = null;
  private syncListeners: Array<(state: SyncState) => void> = [];
  private autoSyncInterval: NodeJS.Timeout | null = null;

  // ============================================================================
  // GESTION DE L'AUTHENTIFICATION
  // ============================================================================

  async setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('kame_daay_token', token);
      console.log('✅ Token d\'authentification enregistré');
    } else {
      await AsyncStorage.removeItem('kame_daay_token');
      console.log('🗑️ Token d\'authentification supprimé');
    }
  }

  async getStoredToken(): Promise<string | null> {
    if (this.accessToken) return this.accessToken;
    
    try {
      const stored = await AsyncStorage.getItem('kame_daay_token');
      if (stored) {
        this.accessToken = stored;
        console.log('✅ Token récupéré depuis AsyncStorage');
      }
      return this.accessToken;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  }

  // ============================================================================
  // GESTION DE L'ÉTAT DE SYNCHRONISATION
  // ============================================================================

  onSyncStateChange(listener: (state: SyncState) => void) {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notifySyncStateChange() {
    this.syncListeners.forEach(listener => listener(this.syncState));
  }

  private updateSyncState(updates: Partial<SyncState>) {
    this.syncState = { ...this.syncState, ...updates };
    this.notifySyncStateChange();
  }

  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  markPendingChanges() {
    this.updateSyncState({
      pendingChanges: this.syncState.pendingChanges + 1
    });
  }

  // ============================================================================
  // VÉRIFICATION DE LA CONNECTIVITÉ
  // ============================================================================

  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        console.log('📴 Pas de connexion Internet');
        return false;
      }

      // Vérifier si le serveur est accessible
      const apiUrl = getApiUrl();
      console.log('🔍 Vérification du serveur:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Serveur accessible');
        return true;
      } else {
        console.log('⚠️ Serveur répond avec erreur:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Serveur inaccessible:', error);
      return false;
    }
  }

  // ============================================================================
  // SYNCHRONISATION VERS LE SERVEUR
  // ============================================================================

  async syncToServer(): Promise<{ success: boolean; error?: string }> {
    console.log('\n📤 ========== DÉBUT SYNC VERS SERVEUR ==========');
    
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      console.log('❌ Non authentifié');
      return { success: false, error: "Non authentifié" };
    }

    if (!(await this.isOnline())) {
      console.log('❌ Hors ligne');
      return { success: false, error: "Hors ligne" };
    }

    this.updateSyncState({ isSyncing: true });

    try {
      const token = await this.getStoredToken();
      const db = getDatabaseInstance();
      
      if (!db) {
        throw new Error('Base de données non initialisée');
      }
      
      console.log('📊 Récupération des données locales...');
      
      // Récupérer toutes les données locales
      const localData = {
        clients: await db.getAllClients(),
        ventes: await db.getAllVentes(),
        paiements: await db.getAllPaiements(),
        produits: await db.getAllProduits(),
        templates: await db.getAllTemplates(),
        objectifs: await db.getAllObjectifs(),
        depenses: await db.getAllDepenses(),
        rappels: await db.getAllRappels()
      };

      console.log('📊 Données locales récupérées:', {
        clients: localData.clients.length,
        ventes: localData.ventes.length,
        paiements: localData.paiements.length,
        produits: localData.produits.length,
        templates: localData.templates.length,
        objectifs: localData.objectifs.length,
        depenses: localData.depenses.length,
        rappels: localData.rappels.length
      });

      // Convertir au format serveur
      console.log('🔄 Conversion au format serveur...');
      const serverData = mapAllDataToServer(localData);

      console.log('📤 Données converties pour envoi:', {
        clients: serverData.clients.length,
        ventes: serverData.ventes.length,
        paiements: serverData.paiements.length,
        produits: serverData.produits.length,
        templates: serverData.templates.length,
        objectifs: serverData.objectifs.length,
        depenses: serverData.depenses.length,
        rappels: serverData.rappels.length
      });

      // Log d'un exemple de client pour vérification
      if (serverData.clients.length > 0) {
        console.log('📋 Exemple de client converti:', serverData.clients[0]);
      }

      // Envoyer au serveur
      const apiUrl = getApiUrl();
      const endpoint = `${apiUrl}/sync/all`;
      
      console.log('🌐 Envoi vers:', endpoint);
      console.log('🔑 Token:', token ? 'Présent' : 'Absent');
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(token!),
        body: JSON.stringify(serverData)
      });

      console.log('📡 Réponse serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur serveur:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Erreur de synchronisation' };
        }
        
        throw new Error(error.error || 'Erreur de synchronisation');
      }

      const result = await response.json();
      
      console.log('✅ Synchronisation réussie:', result);
      
      this.updateSyncState({
        isSyncing: false,
        lastSyncTime: Date.now(),
        pendingChanges: 0
      });

      console.log('========== FIN SYNC VERS SERVEUR ==========\n');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      this.updateSyncState({ isSyncing: false });
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.log('========== FIN SYNC AVEC ERREUR ==========\n');
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // ============================================================================
  // SYNCHRONISATION DEPUIS LE SERVEUR
  // ============================================================================

  async syncFromServer(): Promise<{ success: boolean; error?: string }> {
    console.log('\n📥 ========== DÉBUT SYNC DEPUIS SERVEUR ==========');
    
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      console.log('❌ Non authentifié');
      return { success: false, error: "Non authentifié" };
    }

    if (!(await this.isOnline())) {
      console.log('❌ Hors ligne');
      return { success: false, error: "Hors ligne" };
    }

    this.updateSyncState({ isSyncing: true });

    try {
      const token = await this.getStoredToken();
      const apiUrl = getApiUrl();
      const endpoint = `${apiUrl}/sync/all`;
      
      console.log('🌐 Récupération depuis:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getAuthHeaders(token!)
      });

      console.log('📡 Réponse serveur:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur serveur:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || 'Erreur de récupération' };
        }
        
        throw new Error(error.error || 'Erreur de récupération');
      }

      const serverData = await response.json();
      
      console.log('📥 Données reçues du serveur:', {
        clients: serverData.clients?.length || 0,
        ventes: serverData.ventes?.length || 0,
        paiements: serverData.paiements?.length || 0,
        produits: serverData.produits?.length || 0,
        templates: serverData.templates?.length || 0,
        objectifs: serverData.objectifs?.length || 0,
        depenses: serverData.depenses?.length || 0,
        rappels: serverData.rappels?.length || 0
      });

      // Convertir du format serveur au format mobile
      console.log('🔄 Conversion au format mobile...');
      const localData = mapAllDataFromServer(serverData);

      console.log('✅ Données converties:', {
        clients: localData.clients.length,
        ventes: localData.ventes.length,
        paiements: localData.paiements.length,
        produits: localData.produits.length,
        templates: localData.templates.length,
        objectifs: localData.objectifs.length,
        depenses: localData.depenses.length,
        rappels: localData.rappels.length
      });

      // Récupérer l'instance de la base de données
      const db = getDatabaseInstance();
      if (!db) {
        throw new Error('Base de données non initialisée');
      }

      // Merge des données dans SQLite
      console.log('💾 Insertion des données dans SQLite...');
      
      // IMPORTANT: On utilise une stratégie "serveur prioritaire"
      // Les données du serveur écrasent les données locales en cas de conflit
      
      let insertedCount = 0;
      let updatedCount = 0;
      
      // Clients
      for (const client of localData.clients) {
        try {
          // Vérifier si le client existe déjà localement
          const existing = await db.getClientByPhone(client.telephone);
          if (existing) {
            await db.updateClient(existing.id, client);
            updatedCount++;
            console.log(`  🔄 Client mis à jour: ${client.nom} ${client.prenom}`);
          } else {
            await db.addClient(client);
            insertedCount++;
            console.log(`  ✅ Nouveau client ajouté: ${client.nom} ${client.prenom}`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur client ${client.nom}:`, error);
        }
      }
      
      // Templates
      for (const template of localData.templates) {
        try {
          await db.addTemplate(template);
          insertedCount++;
          console.log(`  ✅ Template ajouté: ${template.nom}`);
        } catch (error) {
          console.error(`  ❌ Erreur template ${template.nom}:`, error);
        }
      }
      
      // Produits
      for (const produit of localData.produits) {
        try {
          await db.addProduit(produit);
          insertedCount++;
          console.log(`  ✅ Produit ajouté: ${produit.nom}`);
        } catch (error) {
          console.error(`  ❌ Erreur produit ${produit.nom}:`, error);
        }
      }
      
      // Ventes
      for (const vente of localData.ventes) {
        try {
          await db.addVente(vente);
          insertedCount++;
          console.log(`  ✅ Vente ajoutée: ${vente.total} CFA`);
        } catch (error) {
          console.error(`  ❌ Erreur vente:`, error);
        }
      }
      
      // Paiements
      for (const paiement of localData.paiements) {
        try {
          await db.addPaiement(paiement);
          insertedCount++;
          console.log(`  ✅ Paiement ajouté: ${paiement.montant} CFA`);
        } catch (error) {
          console.error(`  ❌ Erreur paiement:`, error);
        }
      }
      
      // Objectifs
      for (const objectif of localData.objectifs) {
        try {
          await db.addObjectif(objectif);
          insertedCount++;
          console.log(`  ✅ Objectif ajouté: ${objectif.montantCible} CFA`);
        } catch (error) {
          console.error(`  ❌ Erreur objectif:`, error);
        }
      }
      
      // Dépenses
      for (const depense of localData.depenses) {
        try {
          await db.addDepense(depense);
          insertedCount++;
          console.log(`  ✅ Dépense ajoutée: ${depense.montant} CFA`);
        } catch (error) {
          console.error(`  ❌ Erreur dépense:`, error);
        }
      }
      
      // Rappels
      for (const rappel of localData.rappels) {
        try {
          await db.addRappel(rappel);
          insertedCount++;
          console.log(`  ✅ Rappel ajouté`);
        } catch (error) {
          console.error(`  ❌ Erreur rappel:`, error);
        }
      }
      
      console.log(`✅ Merge terminé: ${insertedCount} nouveaux, ${updatedCount} mis à jour`);
      
      this.updateSyncState({
        isSyncing: false,
        lastSyncTime: Date.now()
      });

      console.log('========== FIN SYNC DEPUIS SERVEUR ==========\n');
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération:', error);
      this.updateSyncState({ isSyncing: false });
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.log('========== FIN SYNC AVEC ERREUR ==========\n');
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // ============================================================================
  // SYNCHRONISATION BIDIRECTIONNELLE
  // ============================================================================

  async fullSync(): Promise<{ success: boolean; error?: string }> {
    console.log('\n🔄 ========== SYNC BIDIRECTIONNELLE ==========');
    
    // D'abord télécharger du serveur
    const downloadResult = await this.syncFromServer();
    if (!downloadResult.success) {
      return downloadResult;
    }

    // Puis uploader vers le serveur
    const uploadResult = await this.syncToServer();
    return uploadResult;
  }

  // ============================================================================
  // SYNCHRONISATION AUTOMATIQUE
  // ============================================================================

  startAutoSync(intervalMinutes: number = 5) {
    console.log(`🔄 Démarrage de la synchronisation automatique (toutes les ${intervalMinutes} minutes)`);
    
    // Arrêter l'interval existant s'il y en a un
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    // Note: Ne pas synchroniser immédiatement ici car la DB peut ne pas être prête
    // La synchronisation initiale est gérée dans App.tsx après init DB

    // Synchroniser toutes les X minutes
    this.autoSyncInterval = setInterval(async () => {
      const isAuth = await this.isAuthenticated();
      if (isAuth && !this.syncState.isSyncing) {
        console.log('⏰ Synchronisation automatique périodique...');
        this.syncToServer();
      }
    }, intervalMinutes * 60 * 1000);

    // Écouter les changements de connexion
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('📶 Connexion rétablie, synchronisation...');
        this.syncToServer();
      }
    });
  }

  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('⏸️ Synchronisation automatique arrêtée');
    }
  }
}

export const syncService = new SyncService();
