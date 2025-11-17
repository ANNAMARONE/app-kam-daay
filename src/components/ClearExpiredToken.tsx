import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

/**
 * 🗑️ Composant pour supprimer le token expiré
 * 
 * À utiliser UNE SEULE FOIS quand vous avez l'erreur "Token expiré"
 * Puis supprimez ce composant de votre code
 */
export default function ClearExpiredToken() {
  const [loading, setLoading] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClearToken = async () => {
    Alert.alert(
      '🗑️ Supprimer le token expiré',
      'Cette action va supprimer votre session actuelle. Vous devrez vous reconnecter.\n\nContinuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Oui, supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            
            try {
              console.log('🗑️ Suppression du token expiré...');
              
              // Supprimer le token
              await AsyncStorage.removeItem('accessToken');
              
              // Supprimer aussi les données de sync
              await AsyncStorage.removeItem('server_data');
              await AsyncStorage.removeItem('last_sync');
              
              console.log('✅ Token supprimé avec succès');
              
              setLoading(false);
              setCleared(true);
              
              setTimeout(() => {
                Alert.alert(
                  '✅ Token supprimé',
                  'Fermez complètement l\'application et relancez-la.\n\nVous serez redirigé vers l\'écran de connexion.',
                  [{ text: 'OK' }]
                );
              }, 500);
              
            } catch (error) {
              console.error('❌ Erreur lors de la suppression:', error);
              setLoading(false);
              Alert.alert(
                '❌ Erreur',
                'Impossible de supprimer le token. Essayez de désinstaller/réinstaller l\'app.'
              );
            }
          }
        }
      ]
    );
  };

  const handleCheckToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        Alert.alert('ℹ️ Aucun token', 'Aucun token trouvé dans AsyncStorage.');
      } else {
        Alert.alert(
          '🔍 Token trouvé',
          `Token: ${token.substring(0, 50)}...\n\nLongueur: ${token.length} caractères`
        );
        console.log('🔑 Token complet:', token);
      }
    } catch (error) {
      Alert.alert('❌ Erreur', 'Impossible de lire le token.');
    }
  };

  if (cleared) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Ionicons name="checkmark-circle" size={80} color="#8BC34A" />
          
          <Text style={styles.title}>✅ Token supprimé</Text>
          
          <Text style={styles.subtitle}>
            Fermez complètement l'application et relancez-la.
            {'\n\n'}
            Vous serez redirigé vers l'écran de connexion.
          </Text>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>📋 Étapes suivantes :</Text>
            <Text style={styles.instructionItem}>1. Fermez cette app complètement</Text>
            <Text style={styles.instructionItem}>2. Relancez depuis Expo</Text>
            <Text style={styles.instructionItem}>3. Reconnectez-vous</Text>
            <Text style={styles.instructionItem}>4. Token permanent généré !</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="alert-circle-outline" size={80} color="#FFD700" />
        
        <Text style={styles.title}>🔐 Token Expiré</Text>
        
        <Text style={styles.subtitle}>
          Votre session a expiré.
          {'\n\n'}
          Cliquez sur "Supprimer" pour nettoyer le token expiré, puis reconnectez-vous.
        </Text>

        <Text style={styles.warningText}>
          ⚠️ Vous devrez entrer à nouveau votre téléphone et code PIN
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
        ) : (
          <>
            <TouchableOpacity 
              style={styles.buttonPrimary} 
              onPress={handleClearToken}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={22} color="#FFFFFF" />
              <Text style={styles.buttonText}>Supprimer le token expiré</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.buttonSecondary} 
              onPress={handleCheckToken}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle" size={20} color="#004D40" />
              <Text style={styles.buttonTextSecondary}>Vérifier le token</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 Après avoir supprimé le token, vous obtiendrez un nouveau token valide 100 ans (jamais expiré).
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004D40',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#004D40',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    fontWeight: '600',
  },
  buttonPrimary: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  buttonText: {
    color: '#004D40',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(0, 77, 64, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  buttonTextSecondary: {
    color: '#004D40',
    fontSize: 15,
    fontWeight: '600',
  },
  info: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  instructions: {
    marginTop: 20,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#004D40',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 8,
  },
});
