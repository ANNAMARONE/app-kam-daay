import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../lib/sync';

/**
 * Composant invisible qui gère la synchronisation en arrière-plan
 * Affiche uniquement des logs dans la console pour le débogage
 */
export default function BackgroundSync() {
  useEffect(() => {
    // Écouter les changements d'état de sync pour le logging uniquement
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

    // Écouter les changements de connexion SANS déclencher de sync
    // (La sync automatique est gérée par syncService.startAutoSync dans App.tsx)
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected ?? false;
      console.log(`📡 Statut réseau: ${isOnline ? 'EN LIGNE ✅' : 'HORS LIGNE ⚠️'}`);
    });

    return () => {
      unsubscribe();
      netInfoUnsubscribe();
    };
  }, []);

  // Ce composant ne rend rien - il fonctionne uniquement en arrière-plan
  return null;
}