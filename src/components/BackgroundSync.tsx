import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../lib/sync';
import { getDatabaseInstance } from '../lib/store';

/**
 * Composant invisible qui gère la synchronisation en arrière-plan
 * Affiche uniquement des logs dans la console pour le débogage
 */
export default function BackgroundSync() {
  useEffect(() => {
    // Écouter les changements d'état de sync pour le logging
    const unsubscribe = syncService.onSyncStateChange((state) => {
      if (state.isSyncing) {
        console.log('🔄 Synchronisation en cours...');
      } else {
        console.log('✅ Synchronisation terminée');
        if (state.lastSyncTime) {
          const date = new Date(state.lastSyncTime);
          console.log(`📅 Dernière sync: ${date.toLocaleTimeString()}`);
        }
        if (state.pendingChanges > 0) {
          console.log(`⚠️ ${state.pendingChanges} modifications en attente`);
        }
      }
    });

    // Écouter les changements de connexion
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected ?? false;
      console.log(`📡 Statut réseau: ${isOnline ? 'EN LIGNE ✅' : 'HORS LIGNE ⚠️'}`);
      
      // Synchroniser automatiquement quand la connexion revient
      // Mais seulement si la base de données est initialisée
      const db = getDatabaseInstance();
      if (isOnline && !syncService.getSyncState().isSyncing && db) {
        console.log('🔄 Connexion rétablie, synchronisation automatique...');
        syncService.syncToServer();
      } else if (isOnline && !db) {
        console.log('⚠️ Connexion rétablie mais DB pas encore initialisée');
      }
    });

    return () => {
      unsubscribe();
      netInfoUnsubscribe();
    };
  }, []);

  // Ce composant ne rend rien - il fonctionne uniquement en arrière-plan
  return null;
}
