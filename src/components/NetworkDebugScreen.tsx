/**
 * Écran de diagnostic réseau pour Kame Daay
 * 
 * Affiche toutes les informations de connexion pour déboguer
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { getApiUrl } from '../lib/api-config';
import { getLocalIP, getBackendUrl, testBackendConnection } from '../lib/network-helper';
import Colors from '../constants/Colors';

interface NetworkDebugScreenProps {
  onBack: () => void;
}

export default function NetworkDebugScreen({ onBack }: NetworkDebugScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  const detectedIP = getLocalIP();
  const backendUrl = getBackendUrl(3001);
  const configuredUrl = getApiUrl();

  useEffect(() => {
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    setIsLoading(true);
    
    try {
      // Récupérer les infos réseau
      const netInfo = await NetInfo.fetch();
      setNetworkInfo(netInfo);

      // Tester la connexion au backend
      const isConnected = await testBackendConnection(configuredUrl);
      setBackendStatus(isConnected ? 'ok' : 'error');
      
      if (!isConnected) {
        setErrorDetails('Le backend ne répond pas. Vérifie qu\'il tourne sur ton PC.');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des infos réseau:', error);
      setBackendStatus('error');
      setErrorDetails(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const InfoCard = ({ title, value, status }: { title: string; value: string; status?: 'ok' | 'error' | 'warning' }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Text style={styles.infoTitle}>{title}</Text>
        {status && (
          <View style={[
            styles.statusBadge,
            status === 'ok' && styles.statusOk,
            status === 'error' && styles.statusError,
            status === 'warning' && styles.statusWarning,
          ]}>
            <Text style={styles.statusText}>
              {status === 'ok' ? '✅' : status === 'error' ? '❌' : '⚠️'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnostic Réseau</Text>
        <TouchableOpacity onPress={loadNetworkInfo} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyse en cours...</Text>
          </View>
        ) : (
          <>
            {/* Status global */}
            <View style={[
              styles.statusCard,
              backendStatus === 'ok' ? styles.statusCardOk : styles.statusCardError
            ]}>
              <Text style={styles.statusIcon}>
                {backendStatus === 'ok' ? '✅' : '❌'}
              </Text>
              <Text style={styles.statusTitle}>
                {backendStatus === 'ok' ? 'Connexion OK' : 'Connexion Impossible'}
              </Text>
              <Text style={styles.statusMessage}>
                {backendStatus === 'ok' 
                  ? 'Le backend est accessible' 
                  : errorDetails || 'Impossible de joindre le backend'}
              </Text>
            </View>

            {/* Infos Expo */}
            <Text style={styles.sectionTitle}>📱 Expo</Text>
            
            <InfoCard
              title="Expo Host URI"
              value={Constants.expoConfig?.hostUri || 'Non disponible'}
              status={Constants.expoConfig?.hostUri ? 'ok' : 'error'}
            />
            
            <InfoCard
              title="IP Détectée (auto)"
              value={detectedIP}
              status={detectedIP !== 'localhost' ? 'ok' : 'error'}
            />

            {/* URLs Backend */}
            <Text style={styles.sectionTitle}>🌐 Backend</Text>
            
            <InfoCard
              title="URL Auto-détectée"
              value={backendUrl}
              status={!backendUrl.includes('localhost') ? 'ok' : 'warning'}
            />
            
            <InfoCard
              title="URL Configurée (utilisée)"
              value={configuredUrl}
              status={backendStatus === 'ok' ? 'ok' : 'error'}
            />

            {/* Infos Réseau */}
            <Text style={styles.sectionTitle}>📡 Réseau</Text>
            
            <InfoCard
              title="Type de connexion"
              value={networkInfo?.type || 'Inconnue'}
              status={networkInfo?.isConnected ? 'ok' : 'error'}
            />
            
            <InfoCard
              title="Connecté à Internet"
              value={networkInfo?.isConnected ? 'Oui' : 'Non'}
              status={networkInfo?.isConnected ? 'ok' : 'error'}
            />
            
            {networkInfo?.details?.ssid && (
              <InfoCard
                title="Nom du WiFi"
                value={networkInfo.details.ssid}
              />
            )}

            {/* Infos Système */}
            <Text style={styles.sectionTitle}>⚙️ Système</Text>
            
            <InfoCard
              title="Plateforme"
              value={Platform.OS === 'ios' ? 'iOS' : 'Android'}
            />
            
            <InfoCard
              title="Mode"
              value={__DEV__ ? 'Développement' : 'Production'}
            />

            {/* Instructions */}
            {backendStatus === 'error' && (
              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>🆘 Comment corriger ?</Text>
                <View style={styles.helpStep}>
                  <Text style={styles.helpStepNumber}>1.</Text>
                  <Text style={styles.helpStepText}>
                    Vérifie que ton backend tourne :{'\n'}
                    <Text style={styles.helpCode}>cd backend && npm run dev</Text>
                  </Text>
                </View>
                <View style={styles.helpStep}>
                  <Text style={styles.helpStepNumber}>2.</Text>
                  <Text style={styles.helpStepText}>
                    Configure ton IP dans :{'\n'}
                    <Text style={styles.helpCode}>react-native-components/lib/api-config.ts</Text>
                    {'\n'}Ligne : <Text style={styles.helpCode}>const MANUAL_IP = 'TON_IP';</Text>
                  </Text>
                </View>
                <View style={styles.helpStep}>
                  <Text style={styles.helpStepNumber}>3.</Text>
                  <Text style={styles.helpStepText}>
                    Trouve ton IP :{'\n'}
                    <Text style={styles.helpCode}>{"hostname -I | awk '{print $1}'"}</Text>
                  </Text>
                </View>
                <View style={styles.helpStep}>
                  <Text style={styles.helpStepNumber}>4.</Text>
                  <Text style={styles.helpStepText}>
                    Vérifie que ton smartphone et ton PC sont sur le MÊME WiFi
                  </Text>
                </View>
                <View style={styles.helpStep}>
                  <Text style={styles.helpStepNumber}>5.</Text>
                  <Text style={styles.helpStepText}>
                    Teste dans le navigateur de ton smartphone :{'\n'}
                    <Text style={styles.helpCode}>{configuredUrl}/health</Text>
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.grayDark,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusCardOk: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  statusCardError: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 12,
    gap: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: Colors.grayDark,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 8,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusOk: {
    backgroundColor: '#E8F5E9',
  },
  statusError: {
    backgroundColor: '#FFEBEE',
  },
  statusWarning: {
    backgroundColor: '#FFF9E6',
  },
  statusText: {
    fontSize: 12,
  },
  helpCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
  },
  helpStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  helpStepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 12,
    width: 24,
  },
  helpStepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary,
    lineHeight: 20,
  },
  helpCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: Colors.secondary,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
