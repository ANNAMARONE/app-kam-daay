import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncService, SyncState } from '../lib/sync';

export default function SyncStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>(syncService.getSyncState());

  useEffect(() => {
    // Écouter les changements d'état de sync
    const unsubscribe = syncService.onSyncStateChange((state) => {
      setSyncState(state);
    });

    // Écouter les changements de connexion
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
      netInfoUnsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    const result = await syncService.syncToServer();
    
    if (result.success) {
      Alert.alert('Succès', 'Données synchronisées avec succès');
    } else {
      Alert.alert('Erreur', `Erreur de synchronisation: ${result.error}`);
    }
  };

  const formatLastSync = () => {
    if (!syncState.lastSyncTime) return 'Jamais synchronisé';
    
    const now = Date.now();
    const diff = now - syncState.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes === 1) return 'Il y a 1 min';
    if (minutes < 60) return `Il y a ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Il y a 1h';
    if (hours < 24) return `Il y a ${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Il y a 1j';
    return `Il y a ${days}j`;
  };

  if (!syncState) {
    return null;
  }

  return (
    <View 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: isOnline ? '#f0fdf4' : '#fef2f2',
        borderBottomWidth: 1,
        borderBottomColor: isOnline ? '#86efac' : '#fca5a5'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isOnline ? '#16a34a' : '#dc2626',
          marginRight: 8
        }} />
        <Text style={{ fontSize: 14, fontWeight: '500' }}>
          {String(isOnline ? 'En ligne' : 'Hors ligne')}
        </Text>
        
        {typeof syncState.pendingChanges === 'number' && syncState.pendingChanges > 0 && (
          <View style={{
            backgroundColor: '#FFD700',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            marginLeft: 8
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#004D40' }}>
              {String(syncState.pendingChanges)} {syncState.pendingChanges > 1 ? 'modifs' : 'modif'}
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#666666', marginRight: 12 }}>
          {String(syncState.isSyncing ? 'Sync...' : formatLastSync())}
        </Text>

        <TouchableOpacity
          onPress={handleManualSync}
          disabled={!isOnline || syncState.isSyncing}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(0, 77, 64, 0.08)',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text style={{ fontSize: 16 }}>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
