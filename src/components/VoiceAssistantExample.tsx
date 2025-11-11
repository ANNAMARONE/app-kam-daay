/**
 * 🎤 Exemple d'Utilisation de l'Assistant Vocal
 * Ce fichier montre comment intégrer l'assistant vocal dans l'app Kame Daay
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import VoiceAssistant from './VoiceAssistant';
import FloatingVoiceButton from './FloatingVoiceButton';

const Colors = {
  primary: '#FFD700',
  secondary: '#004D40',
  success: '#8BC34A',
  white: '#FFFFFF',
  accent: '#FFA000',
};

export default function VoiceAssistantExample() {
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.secondary} />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.secondary, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Kame Daay</Text>
        <Text style={styles.headerSubtitle}>Assistant Vocal Wolof 🇸🇳</Text>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="mic-circle" size={80} color={Colors.primary} />
          <Text style={styles.cardTitle}>Assistant Vocal Intelligent</Text>
          <Text style={styles.cardDescription}>
            Parle en wolof ou français pour contrôler ton application !
          </Text>

          {/* Bouton pour ouvrir l'assistant */}
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              style={styles.mainButtonGradient}
            >
              <Ionicons name="mic" size={24} color={Colors.white} />
              <Text style={styles.mainButtonText}>Ouvrir l'Assistant</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Exemples de commandes */}
          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>💡 Essaye de dire :</Text>
            
            <View style={styles.examplesList}>
              <ExampleCommand
                icon="cart"
                wolof="Jaay"
                french="Vendre"
                description="Ouvre nouvelle vente"
              />
              <ExampleCommand
                icon="people"
                wolof="Kiliyaan"
                french="Clients"
                description="Affiche les clients"
              />
              <ExampleCommand
                icon="cash"
                wolof="Kreedi"
                french="Crédits"
                description="Voir les crédits"
              />
              <ExampleCommand
                icon="call"
                wolof="Woote"
                french="Relancer"
                description="Relances clients"
              />
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color={Colors.secondary} />
          <Text style={styles.infoText}>
            L'assistant comprend le <Text style={styles.infoBold}>wolof</Text>, le{' '}
            <Text style={styles.infoBold}>français</Text>, ou un{' '}
            <Text style={styles.infoBold}>mélange des deux</Text> !
          </Text>
        </View>
      </View>

      {/* Assistant Vocal Modal */}
      <VoiceAssistant
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />

      {/* OU utiliser le bouton flottant global */}
      {/* <FloatingVoiceButton /> */}
    </SafeAreaView>
  );
}

// Composant pour les exemples de commandes
function ExampleCommand({
  icon,
  wolof,
  french,
  description,
}: {
  icon: string;
  wolof: string;
  french: string;
  description: string;
}) {
  return (
    <View style={styles.exampleItem}>
      <View style={styles.exampleIconContainer}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <View style={styles.exampleTextContainer}>
        <View style={styles.exampleLanguages}>
          <Text style={styles.exampleWolof}>{wolof}</Text>
          <Text style={styles.exampleSeparator}>/</Text>
          <Text style={styles.exampleFrench}>{french}</Text>
        </View>
        <Text style={styles.exampleDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  mainButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  mainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  mainButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  examplesSection: {
    width: '100%',
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 12,
  },
  examplesList: {
    gap: 10,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  exampleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exampleTextContainer: {
    flex: 1,
  },
  exampleLanguages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  exampleWolof: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
  },
  exampleSeparator: {
    fontSize: 14,
    color: '#999',
  },
  exampleFrench: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  exampleDescription: {
    fontSize: 12,
    color: '#999',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
  },
});
