import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

/**
 * Composant temporaire pour forcer la déconnexion
 * À utiliser une seule fois pour nettoyer le token expiré
 */
export default function ForceLogout() {
  const handleForceLogout = async () => {
    Alert.alert(
      '🗑️ Forcer la déconnexion',
      'Voulez-vous supprimer le token expiré et vous reconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Suppression du token...');
              
              // Supprimer le token
              await AsyncStorage.removeItem('accessToken');
              
              // Supprimer aussi les autres données de session
              await AsyncStorage.removeItem('server_data');
              await AsyncStorage.removeItem('last_sync');
              
              console.log('✅ Token supprimé avec succès');
              
              Alert.alert(
                '✅ Déconnexion réussie',
                'Redémarrez l\'application pour vous reconnecter.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Erreur:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le token');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
        
        <Text style={styles.title}>🔐 Token Expiré</Text>
        <Text style={styles.subtitle}>
          Votre session a expiré.{'\n'}
          Cliquez ci-dessous pour vous déconnecter et obtenir un nouveau token.
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleForceLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Forcer la déconnexion</Text>
        </TouchableOpacity>

        <Text style={styles.info}>
          💡 Après la déconnexion, redémarrez l'app et reconnectez-vous.
        </Text>
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
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#004D40',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
