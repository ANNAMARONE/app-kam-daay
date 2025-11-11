/**
 * Service de Synchronisation - Kame Daay Mobile
 * Synchronise les données entre SQLite (mobile) et MySQL (serveur)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { getDatabaseInstance } from './store';
import { getApiUrl, getAuthHeaders } from './api-config';
import { mapAllDataToServer, mapAllDataFromServer, mapClientFromServer } from './sync-mapper';

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
    console.log('⏰ Heure:', new Date().toLocaleTimeString());
    
    const isAuth = await this.isAuthenticated();
    console.log('🔐 Authentifié:', isAuth);
    if (!isAuth) {
      console.log('❌ Non authentifié - sync annulée');
      return { success: false, error: "Non authentifié" };
    }

    const isOnlineCheck = await this.isOnline();
    console.log('📡 En ligne:', isOnlineCheck);
    if (!isOnlineCheck) {
      console.log('❌ Hors ligne - sync annulée');
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

      // Log des paiements bruts AVANT conversion
      if (localData.paiements.length > 0) {
        console.log('🔍 Exemple de paiement LOCAL BRUT (SQLite):', localData.paiements[0]);
      } else {
        console.log('⚠️ Aucun paiement trouvé dans SQLite');
      }

      // Log de TOUTES les ventes pour debug duplication
      if (localData.ventes.length > 0) {
        console.log('🔍 TOUTES les ventes locales (SQLite) :', localData.ventes.map(v => ({
          id: v.id,
          clientId: v.clientId,
          total: v.total,
          date: new Date(v.date).toLocaleString()
        })));
      }

      // Convertir au format serveur
      console.log('🔄 Conversion au format serveur...');
      const serverData = await mapAllDataToServer(localData);

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

      // Sauvegarder les mappings UUID ↔ ID local
      console.log('💾 Sauvegarde des mappings UUID...');
      for (let i = 0; i < localData.clients.length; i++) {
        const localClient = localData.clients[i];
        const serverClient = serverData.clients[i];
        if (localClient.id && serverClient.id) {
          await db.saveUuidMapping(serverClient.id, localClient.id, 'client');
        }
      }

      // Sauvegarder les mappings pour les ventes
      for (let i = 0; i < localData.ventes.length; i++) {
        const localVente = localData.ventes[i];
        const serverVente = serverData.ventes[i];
        if (localVente.id && serverVente.id) {
          await db.saveUuidMapping(serverVente.id, localVente.id, 'vente');
        }
      }

      // Sauvegarder les mappings pour les paiements
      for (let i = 0; i < localData.paiements.length; i++) {
        const localPaiement = localData.paiements[i];
        const serverPaiement = serverData.paiements[i];
        if (localPaiement.id && serverPaiement.id) {
          await db.saveUuidMapping(serverPaiement.id, localPaiement.id, 'paiement');
        }
      }

      // Log d'un exemple de client pour vérification
      if (serverData.clients.length > 0) {
        console.log('📋 Exemple de client converti:', serverData.clients[0]);
      }
      
      // Log d'une vente convertie pour vérification
      if (serverData.ventes.length > 0) {
        console.log('📋 Exemple de vente convertie:', {
          id: serverData.ventes[0].id,
          clientId: serverData.ventes[0].clientId,
          montant: serverData.ventes[0].montant
        });
      }

      // Log des paiements convertis pour vérification
      if (serverData.paiements.length > 0) {
        console.log('💰 Exemple de paiement converti:', {
          id: serverData.paiements[0].id,
          venteId: serverData.paiements[0].venteId,
          montant: serverData.paiements[0].montant,
          datePaiement: serverData.paiements[0].datePaiement
        });
        
        // Vérifier tous les paiements pour venteId invalide
        serverData.paiements.forEach((paiement, index) => {
          if (!paiement.id || !paiement.venteId) {
            console.error(`❌ Paiement ${index} a des IDs invalides:`, {
              id: paiement.id,
              venteId: paiement.venteId,
              montant: paiement.montant
            });
          }
        });
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
      
      // Nettoyer les ventes corrompues avant la synchronisation
      if (typeof db.cleanupCorruptedVentes === 'function') {
        await db.cleanupCorruptedVentes();
      } else {
        console.warn('⚠️ cleanupCorruptedVentes non disponible, rechargez l\'app');
      }
      
      // Créer un mapping UUID → ID local pour les clients
      const clientUuidToLocalId = new Map<string, number>();
      
      // Clients
      for (const serverClient of serverData.clients || []) {
        try {
          // Vérifier si le client existe déjà localement (par téléphone)
          const existing = await db.getClientByPhone(serverClient.telephone);
          
          if (existing && existing.id !== undefined) {
            // Mettre à jour le client existant
            await db.updateClient(existing.id, mapClientFromServer(serverClient));
            updatedCount++;
            console.log(`  🔄 Client mis à jour: ${serverClient.nom} ${serverClient.prenom}`);
            
            // Sauvegarder le mapping UUID → ID local
            clientUuidToLocalId.set(serverClient.id, existing.id);
            await db.saveUuidMapping(serverClient.id, existing.id, 'client');
          } else {
            // Ajouter un nouveau client
            const convertedClient = mapClientFromServer(serverClient);
            const localId = await db.addClient(convertedClient);
            insertedCount++;
            console.log(`  ✅ Nouveau client ajouté: ${serverClient.nom} ${serverClient.prenom}`);
            
            // Sauvegarder le mapping UUID → ID local
            clientUuidToLocalId.set(serverClient.id, localId);
            await db.saveUuidMapping(serverClient.id, localId, 'client');
          }
        } catch (error) {
          console.error(`  ❌ Erreur client ${serverClient.nom}:`, error);
        }
      }
      
      // Templates - Vérification de l'UUID pour éviter les doublons
      for (const serverTemplate of serverData.templates || []) {
        try {
          // Ignorer les templates avec message NULL
          if (!serverTemplate.message || serverTemplate.message.trim() === '') {
            console.log(`  ⚠️ Template "${serverTemplate.nom}" ignoré (message vide ou NULL)`);
            continue;
          }
          
          // Vérifier si le template existe déjà localement via son UUID
          const existingLocalId = await db.getLocalIdFromUuid(serverTemplate.id, 'template');
          
          if (existingLocalId) {
            // Template existe déjà, on le met à jour
            await db.updateTemplate(existingLocalId, {
              nom: serverTemplate.nom,
              message: serverTemplate.message
            });
            updatedCount++;
            console.log(`  🔄 Template mis à jour: ${serverTemplate.nom}`);
          } else {
            // Vérifier aussi par nom pour éviter les doublons même sans UUID mapping
            const existingTemplates = await db.getAllTemplates();
            const duplicateTemplate = existingTemplates.find(t => 
              t.nom === serverTemplate.nom && t.message === serverTemplate.message
            );
            
            if (duplicateTemplate && duplicateTemplate.id) {
              // Template existe déjà par nom+message, juste créer le mapping
              await db.saveUuidMapping(serverTemplate.id, duplicateTemplate.id, 'template');
              updatedCount++;
              console.log(`  🔗 Mapping créé pour template existant: ${serverTemplate.nom}`);
            } else {
              // Nouveau template
              const template = {
                nom: serverTemplate.nom,
                message: serverTemplate.message
              };
              const localId = await db.addTemplate(template);
              insertedCount++;
              
              // Sauvegarder le mapping UUID → ID local
              await db.saveUuidMapping(serverTemplate.id, localId, 'template');
              console.log(`  ✅ Template ajouté: ${serverTemplate.nom}`);
            }
          }
        } catch (error) {
          console.error(`  ❌ Erreur template ${serverTemplate.nom}:`, error);
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
      
      // Ventes (avec mapping des UUIDs vers IDs locaux)
      for (const serverVente of serverData.ventes || []) {
        try {
          // Vérifier si la vente existe déjà localement via son UUID
          const existingVenteId = await db.getLocalIdFromUuid(serverVente.id, 'vente');
          
          if (existingVenteId) {
            // Vente existe déjà, on la passe
            updatedCount++;
            console.log(`  🔄 Vente déjà existante (UUID): ${serverVente.montant} CFA (ignorée)`);
            continue;
          }
          
          // Récupérer l'ID local du client à partir de son UUID
          const localClientId = clientUuidToLocalId.get(serverVente.client_id) || 
                                await db.getLocalIdFromUuid(serverVente.client_id, 'client');
          
          if (!localClientId) {
            console.warn(`  ⚠️ Client UUID ${serverVente.client_id} introuvable localement, vente ignorée`);
            continue;
          }
          
          // Vérifier aussi si une vente similaire existe déjà (même client, même montant, même date)
          const allVentes = await db.getAllVentes();
          const venteDate = new Date(serverVente.date_vente || Date.now()).getTime();
          const duplicateVente = allVentes.find(v => 
            v.clientId === localClientId && 
            v.total === serverVente.montant &&
            Math.abs(v.date - venteDate) < 60000 // Moins d'1 minute de différence
          );
          
          if (duplicateVente && duplicateVente.id) {
            // Vente existe déjà, juste créer le mapping
            await db.saveUuidMapping(serverVente.id, duplicateVente.id, 'vente');
            updatedCount++;
            console.log(`  🔗 Mapping créé pour vente existante: ${serverVente.montant} CFA`);
            continue;
          }
          
          // Créer la vente avec l'ID local du client
          const vente = {
            clientId: localClientId,
            articles: typeof serverVente.produits === 'string' 
              ? JSON.parse(serverVente.produits) 
              : serverVente.produits || [],
            total: serverVente.montant,
            montantPaye: serverVente.montant_paye,
            statut: serverVente.type_paiement as 'Payé' | 'Crédit' | 'Partiel',
            date: venteDate
          };
          
          const localVenteId = await db.addVente(vente);
          insertedCount++;
          
          // Sauvegarder le mapping UUID → ID local pour la vente
          await db.saveUuidMapping(serverVente.id, localVenteId, 'vente');
          
          console.log(`  ✅ Vente ajoutée: ${vente.total} CFA (client local #${localClientId})`);
        } catch (error) {
          console.error(`  ❌ Erreur vente:`, error);
        }
      }
      
      // Paiements (temporairement ignorés car nécessitent un mapping vente UUID → ID local)
      // TODO: Implémenter le mapping des ventes comme pour les clients
      console.log(`  ⏭️ ${serverData.paiements?.length || 0} paiements ignorés (mapping non implémenté)`);
      
      
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
      
      // Rappels (temporairement ignorés car nécessitent un mapping client/vente UUID → ID local)
      // TODO: Implémenter le mapping des rappels comme pour les clients
      console.log(`  ⏭️ ${serverData.rappels?.length || 0} rappels ignorés (mapping non implémenté)`);
      
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

    // Synchroniser toutes les X minutes (SEULEMENT télécharger, pas uploader)
    this.autoSyncInterval = setInterval(async () => {
      const isAuth = await this.isAuthenticated();
      if (isAuth && !this.syncState.isSyncing) {
        console.log('⏰ Synchronisation automatique périodique (téléchargement uniquement)...');
        // Seulement télécharger les données du serveur
        // L'upload se fait manuellement ou quand l'utilisateur crée/modifie des données
        this.syncFromServer();
      }
    }, intervalMinutes * 60 * 1000);
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