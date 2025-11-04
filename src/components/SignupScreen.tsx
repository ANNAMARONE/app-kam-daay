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

interface SignupScreenProps {
  onSignupSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

export default function SignupScreen({ onSignupSuccess, onBack }: SignupScreenProps) {
  const [step, setStep] = useState(1); // 1: Nom/Prénom, 2: Téléphone, 3: Code PIN
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      if (!prenom.trim() || !nom.trim()) {
        Alert.alert('Information manquante', 'Veuillez entrer votre prénom et votre nom');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!telephone.trim()) {
        Alert.alert('Information manquante', 'Veuillez entrer votre numéro de téléphone');
        return;
      }
      setStep(3);
    }
  };

  const handleSignup = async () => {
    // Validation
    if (pin !== confirmPin) {
      Alert.alert('Erreur', 'Les codes PIN ne correspondent pas');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres');
      return;
    }

    if (!/^\d+$/.test(pin)) {
      Alert.alert('Erreur', 'Le code PIN doit contenir uniquement des chiffres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telephone: telephone.trim(),
          pin: pin,
          nom: nom.trim(),
          prenom: prenom.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Inscription réussie - maintenant se connecter automatiquement
      const loginResponse = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          telephone: telephone.trim(),
          pin: pin
        })
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error('Compte créé mais erreur de connexion');
      }

      onSignupSuccess(loginData.session.access_token, loginData.user);

    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      Alert.alert(
        'Erreur', 
        err instanceof Error ? err.message : 'Erreur lors de l\'inscription'
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
            onPress={() => step === 1 ? onBack() : setStep(step - 1)}
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

        {/* Indicateur de progression */}
        <View style={{ flexDirection: 'row', marginBottom: 32, paddingHorizontal: 8 }}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 4,
                backgroundColor: s <= step ? Colors.primary : Colors.grayLight,
                marginHorizontal: 4,
                borderRadius: 2,
              }}
            />
          ))}
        </View>

        {/* Étape 1: Nom et Prénom */}
        {step === 1 && (
          <View>
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
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.secondary, marginBottom: 8 }}>
                Faisons connaissance
              </Text>
              <Text style={{ fontSize: 15, color: Colors.grayDark, textAlign: 'center' }}>
                Comment vous appelez-vous ?
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
                Prénom
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: prenom ? Colors.primary : Colors.grayLight,
                borderRadius: 14,
                paddingHorizontal: 16,
                backgroundColor: Colors.white,
              }}>
                <Ionicons name="person-outline" size={20} color={Colors.grayDark} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    fontSize: 18,
                    color: Colors.secondary,
                  }}
                  placeholder="Fatou"
                  placeholderTextColor={Colors.gray}
                  value={prenom}
                  onChangeText={setPrenom}
                  editable={!isLoading}
                  autoFocus
                />
              </View>
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
                Nom
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: nom ? Colors.primary : Colors.grayLight,
                borderRadius: 14,
                paddingHorizontal: 16,
                backgroundColor: Colors.white,
              }}>
                <Ionicons name="person-outline" size={20} color={Colors.grayDark} />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    fontSize: 18,
                    color: Colors.secondary,
                  }}
                  placeholder="Diop"
                  placeholderTextColor={Colors.gray}
                  value={nom}
                  onChangeText={setNom}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>
        )}

        {/* Étape 2: Téléphone */}
        {step === 2 && (
          <View>
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
                <Text style={{ fontSize: 40 }}>📱</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.secondary, marginBottom: 8 }}>
                Votre numéro
              </Text>
              <Text style={{ fontSize: 15, color: Colors.grayDark, textAlign: 'center' }}>
                Ce numéro vous permettra de vous connecter
              </Text>
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
                Numéro de téléphone
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
              <Text style={{ fontSize: 12, color: Colors.grayDark, marginTop: 8, paddingHorizontal: 4 }}>
                Format: 77 XXX XX XX ou +221 77 XXX XX XX
              </Text>
            </View>
          </View>
        )}

        {/* Étape 3: Code PIN */}
        {step === 3 && (
          <View>
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
                <Text style={{ fontSize: 40 }}>🔒</Text>
              </View>
              <Text style={{ fontSize: 28, fontWeight: '700', color: Colors.secondary, marginBottom: 8 }}>
                Créez un code PIN
              </Text>
              <Text style={{ fontSize: 15, color: Colors.grayDark, textAlign: 'center' }}>
                Choisissez 4 chiffres faciles à retenir
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
                Code PIN
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
                  autoFocus
                />
              </View>
            </View>

            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 8 }}>
                Confirmer le code PIN
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: confirmPin ? Colors.primary : Colors.grayLight,
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
                  value={confirmPin}
                  onChangeText={(text) => {
                    const value = text.replace(/\D/g, '').slice(0, 4);
                    setConfirmPin(value);
                  }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  editable={!isLoading}
                />
              </View>
              {confirmPin.length === 4 && pin !== confirmPin && (
                <Text style={{ fontSize: 12, color: Colors.error, marginTop: 8, paddingHorizontal: 4 }}>
                  ❌ Les codes PIN ne correspondent pas
                </Text>
              )}
              {confirmPin.length === 4 && pin === confirmPin && (
                <Text style={{ fontSize: 12, color: Colors.success, marginTop: 8, paddingHorizontal: 4 }}>
                  ✅ Les codes PIN correspondent
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Bouton d'action */}
        <TouchableOpacity
          onPress={step === 3 ? handleSignup : handleNext}
          disabled={isLoading || (step === 1 && (!prenom || !nom)) || (step === 2 && !telephone) || (step === 3 && (pin.length !== 4 || confirmPin.length !== 4 || pin !== confirmPin))}
          style={{
            backgroundColor: (step === 1 && (!prenom || !nom)) || (step === 2 && !telephone) || (step === 3 && (pin.length !== 4 || confirmPin.length !== 4 || pin !== confirmPin)) 
              ? Colors.gray 
              : Colors.primary,
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
              {step === 3 ? 'Créer mon compte' : 'Continuer'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Info de progression */}
        <Text style={{ fontSize: 13, color: Colors.grayDark, textAlign: 'center', marginBottom: 24 }}>
          Étape {step} sur 3
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
