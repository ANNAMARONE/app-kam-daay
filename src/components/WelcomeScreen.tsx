import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { getBackendUrl, testBackendConnection } from '../lib/network-helper';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignup: () => void;
}

export default function WelcomeScreen({ onLogin, onSignup }: WelcomeScreenProps) {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [backendUrl, setBackendUrl] = useState<string>('');

  useEffect(() => {
    // Tester la connexion au backend au démarrage
    const checkBackend = async () => {
      const url = getBackendUrl(3001);
      setBackendUrl(url);
      const isOk = await testBackendConnection(url);
      setBackendStatus(isOk ? 'ok' : 'error');
    };
    
    if (__DEV__) {
      checkBackend();
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />
      
      {/* Indicateur de connexion backend (mode dev uniquement) */}
      {__DEV__ && (
        <View style={[styles.debugBanner, backendStatus === 'ok' ? styles.debugOk : styles.debugError]}>
          <Text style={styles.debugText}>
            {backendStatus === 'checking' ? '🔍 Vérification backend...' : 
             backendStatus === 'ok' ? `✅ Backend: ${backendUrl}` : 
             `❌ Backend inaccessible: ${backendUrl}`}
          </Text>
        </View>
      )}
      
      <LinearGradient
        colors={[Colors.secondary, '#006655', Colors.secondary]}
        style={styles.gradient}
      >
        {/* Logo et titre */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💼</Text>
            </View>
            {/* Cercles décoratifs */}
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
          </View>
          
          <Text style={styles.title}>Kame Daay</Text>
          <Text style={styles.subtitle}>Gestion Client Intelligente</Text>
          
          {/* Séparateur décoratif */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <View style={styles.separatorDot} />
            <View style={styles.separatorLine} />
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            Gérez vos clients, ventes et crédits{'\n'}
            facilement, même sans connexion internet
          </Text>
          
          {/* Points clés */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureText}>Simple et rapide</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureText}>Sécurisé</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>☁️</Text>
              <Text style={styles.featureText}>Synchronisation automatique</Text>
            </View>
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSignup}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFC700']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>Créer un compte</Text>
              <Text style={styles.primaryButtonSubtext}>C'est gratuit !</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            En continuant, vous acceptez nos conditions{'\n'}
            d'utilisation et notre politique de confidentialité
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 1000,
  },
  debugOk: {
    backgroundColor: '#8BC34A',
  },
  debugError: {
    backgroundColor: '#F44336',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  // Logo Section
  logoSection: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 60,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  circle1: {
    width: 140,
    height: 140,
    top: -10,
    left: -10,
  },
  circle2: {
    width: 160,
    height: 160,
    top: -20,
    left: -20,
    borderWidth: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  separatorLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
  },
  separatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 12,
  },

  // Description Section
  descriptionSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Actions Section
  actionsSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 2,
  },
  primaryButtonSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    opacity: 0.8,
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  footer: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
