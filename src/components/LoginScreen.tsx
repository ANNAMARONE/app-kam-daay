import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '../lib/api-config';
import Colors from '../constants/Colors';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

export default function LoginScreen({ onLoginSuccess, onBack }: LoginScreenProps) {
  const [telephone, setTelephone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!telephone.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir 4 chiffres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telephone: telephone.trim(),
          pin: pin
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      // Connexion réussie
      onLoginSuccess(data.session.access_token, data.user);

    } catch (err) {
      console.error('Erreur de connexion:', err);
      Alert.alert(
        'Erreur de connexion', 
        err instanceof Error ? err.message : 'Impossible de se connecter. Vérifiez votre numéro et votre code PIN.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header avec bouton retour */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, marginBottom: 24 }}>
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: Colors.grayLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Logo et titre */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: Colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
          }}>
            <Text style={{ fontSize: 40 }}>💼</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.secondary, marginBottom: 8 }}>
            Bon retour !
          </Text>
          <Text style={{ fontSize: 15, color: Colors.grayDark, textAlign: 'center' }}>
            Connectez-vous pour accéder à vos données
          </Text>
        </View>

        {/* Formulaire */}
        <View style={{ marginBottom: 24 }}>
          {/* Numéro de téléphone */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
              📱 Numéro de téléphone
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: telephone ? Colors.primary : Colors.grayLight,
              borderRadius: 14,
              paddingHorizontal: 16,
              backgroundColor: Colors.white,
            }}>
              <Ionicons name="phone-portrait-outline" size={20} color={Colors.grayDark} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 18,
                  color: Colors.secondary,
                }}
                placeholder="77 123 45 67"
                placeholderTextColor={Colors.gray}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                editable={!isLoading}
                autoFocus
              />
            </View>
          </View>

          {/* Code PIN */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
              🔢 Code PIN
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: pin ? Colors.primary : Colors.grayLight,
              borderRadius: 14,
              paddingHorizontal: 16,
              backgroundColor: Colors.white,
            }}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.grayDark} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 24,
                  textAlign: 'center',
                  letterSpacing: 12,
                  color: Colors.secondary,
                }}
                placeholder="••••"
                placeholderTextColor={Colors.gray}
                value={pin}
                onChangeText={(text) => {
                  const value = text.replace(/\D/g, '').slice(0, 4);
                  setPin(value);
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Lien mot de passe oublié */}
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Code PIN oublié',
              'Contactez le support pour réinitialiser votre code PIN.'
            )}
            style={{ alignItems: 'flex-end', paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>
              Code PIN oublié ?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de connexion */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading || !telephone || pin.length !== 4}
          style={{
            backgroundColor: (!telephone || pin.length !== 4) ? Colors.gray : Colors.primary,
            borderRadius: 14,
            paddingVertical: 18,
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: Colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.secondary} />
          ) : (
            <Text style={{ color: Colors.secondary, fontWeight: '700', fontSize: 17 }}>
              Se connecter
            </Text>
          )}
        </TouchableOpacity>

        {/* Indicateur de sécurité */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: 'rgba(139, 195, 74, 0.1)',
          borderRadius: 12,
          marginBottom: 24,
        }}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
          <Text style={{
            fontSize: 13,
            color: Colors.success,
            marginLeft: 8,
            fontWeight: '600',
          }}>
            Connexion sécurisée et chiffrée
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
