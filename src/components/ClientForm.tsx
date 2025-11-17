import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useStore } from '../lib/store';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import Colors from '../constants/Colors';

interface ClientFormProps {
  client?: any;
  onSuccess: () => void;
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { addClient, updateClient } = useStore();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [type, setType] = useState<'Fidèle' | 'Nouveau' | 'Potentiel'>('Nouveau');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    if (client) {
      setNom(client.nom || '');
      setPrenom(client.prenom || '');
      setTelephone(client.telephone || '');
      setAdresse(client.adresse || '');
      setType(client.type || 'Nouveau');
      setNotes(client.notes || '');
      if (client.notes) setShowNotes(true);
    }
  }, [client]);

  // Auto-formater le numéro de téléphone
  const handleTelephoneChange = (text: string) => {
    // Enlever tous les caractères non numériques sauf le +
    let cleaned = text.replace(/[^\d+]/g, '');
    
    // Si commence par 77, 78, 76, 70, ajouter automatiquement +221
    if (cleaned.length > 0 && !cleaned.startsWith('+')) {
      if (['77', '78', '76', '70'].some(prefix => cleaned.startsWith(prefix))) {
        cleaned = '+221' + cleaned;
      }
    }
    
    setTelephone(cleaned);
  };

  const handleSubmit = async () => {
    // Validation
    if (!nom.trim()) {
      Toast.show({
        type: 'error',
        text1: '❌ Nom manquant',
        text2: 'Entrez le nom du client',
      });
      return;
    }

    if (!prenom.trim()) {
      Toast.show({
        type: 'error',
        text1: '❌ Prénom manquant',
        text2: 'Entrez le prénom du client',
      });
      return;
    }

    if (!telephone.trim()) {
      Toast.show({
        type: 'error',
        text1: '❌ Téléphone manquant',
        text2: 'Entrez le numéro de téléphone',
      });
      return;
    }

    try {
      const clientData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim(),
        adresse: adresse.trim(),
        type,
        notes: notes.trim(),
        createdAt: client?.createdAt || Date.now(),
        derniereVisite: client?.derniereVisite,
      };

      if (client?.id) {
        await updateClient(client.id, clientData);
        Toast.show({
          type: 'success',
          text1: '✅ Client modifié',
          text2: `${prenom} ${nom}`,
        });
      } else {
        await addClient(clientData);
        Toast.show({
          type: 'success',
          text1: '✅ Client ajouté',
          text2: `${prenom} ${nom}`,
        });
      }

      onSuccess();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '❌ Erreur',
        text2: 'Réessayez plus tard',
      });
    }
  };

  // Vérifier si les champs obligatoires sont remplis
  const isValid = nom.trim() && prenom.trim() && telephone.trim();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* En-tête visuel */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="person-add" size={32} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>
            {client ? 'Modifier Client' : 'Nouveau Client'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Remplissez les 3 informations principales
          </Text>
        </View>

        {/* Prénom avec icône */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Prénom</Text>
            <Input
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Fatou, Awa, Mariama..."
              autoCapitalize="words"
              style={styles.input}
            />
          </View>
          {prenom.trim() && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
          )}
        </View>

        {/* Nom avec icône */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="people" size={24} color={Colors.primary} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Nom de famille</Text>
            <Input
              value={nom}
              onChangeText={setNom}
              placeholder="Diop, Fall, Ndiaye..."
              autoCapitalize="words"
              style={styles.input}
            />
          </View>
          {nom.trim() && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
          )}
        </View>

        {/* Téléphone avec icône */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="call" size={24} color={Colors.primary} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Numéro de téléphone</Text>
            <Input
              value={telephone}
              onChangeText={handleTelephoneChange}
              placeholder="77 123 45 67"
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>
          {telephone.trim() && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
          )}
        </View>

        {/* Séparateur */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Informations optionnelles</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Type de Client - Version simplifiée avec grandes cartes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.sectionLabel}>Type de client</Text>
          <View style={styles.typeGrid}>
            <TouchableOpacity
              onPress={() => setType('Nouveau')}
              style={[
                styles.typeCard,
                type === 'Nouveau' && styles.typeCardActive,
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.typeCardIcon,
                type === 'Nouveau' && styles.typeCardIconActive
              ]}>
                <Ionicons
                  name="sparkles"
                  size={28}
                  color={type === 'Nouveau' ? Colors.white : Colors.primary}
                />
              </View>
              <Text style={[
                styles.typeCardText,
                type === 'Nouveau' && styles.typeCardTextActive
              ]}>
                Nouveau
              </Text>
              {type === 'Nouveau' && (
                <View style={styles.typeCardCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType('Fidèle')}
              style={[
                styles.typeCard,
                type === 'Fidèle' && styles.typeCardActive,
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.typeCardIcon,
                type === 'Fidèle' && styles.typeCardIconActive
              ]}>
                <Ionicons
                  name="star"
                  size={28}
                  color={type === 'Fidèle' ? Colors.white : Colors.primary}
                />
              </View>
              <Text style={[
                styles.typeCardText,
                type === 'Fidèle' && styles.typeCardTextActive
              ]}>
                Fidèle
              </Text>
              {type === 'Fidèle' && (
                <View style={styles.typeCardCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType('Potentiel')}
              style={[
                styles.typeCard,
                type === 'Potentiel' && styles.typeCardActive,
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.typeCardIcon,
                type === 'Potentiel' && styles.typeCardIconActive
              ]}>
                <Ionicons
                  name="eye"
                  size={28}
                  color={type === 'Potentiel' ? Colors.white : Colors.primary}
                />
              </View>
              <Text style={[
                styles.typeCardText,
                type === 'Potentiel' && styles.typeCardTextActive
              ]}>
                Potentiel
              </Text>
              {type === 'Potentiel' && (
                <View style={styles.typeCardCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Adresse - Optionnelle */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="location" size={24} color={Colors.grayDark} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabelOptional}>Adresse (optionnel)</Text>
            <Input
              value={adresse}
              onChangeText={setAdresse}
              placeholder="Mbour, Quartier Médine..."
              style={styles.input}
            />
          </View>
        </View>

        {/* Bouton pour afficher les notes */}
        {!showNotes && (
          <TouchableOpacity
            style={styles.addNotesButton}
            onPress={() => setShowNotes(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addNotesText}>Ajouter une note</Text>
          </TouchableOpacity>
        )}

        {/* Notes - Cachées par défaut */}
        {showNotes && (
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="document-text" size={24} color={Colors.grayDark} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabelOptional}>Notes</Text>
              <Input
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Préfère être contactée le matin..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={styles.input}
              />
            </View>
            <TouchableOpacity onPress={() => setShowNotes(false)}>
              <Ionicons name="close-circle" size={24} color={Colors.grayDark} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bouton Submit - Grand et visible */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !isValid && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!isValid}
        >
          <Ionicons 
            name={client ? 'checkmark-done' : 'add-circle'} 
            size={24} 
            color={Colors.white} 
          />
          <Text style={styles.submitButtonText}>
            {client ? 'Enregistrer les modifications' : 'Ajouter le client'}
          </Text>
        </TouchableOpacity>

        {/* Indicateur de validation */}
        {!isValid && (
          <View style={styles.validationHint}>
            <Ionicons name="information-circle" size={20} color={Colors.warning} />
            <Text style={styles.validationHintText}>
              Remplissez le prénom, le nom et le téléphone
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  form: {
    padding: 20,
    paddingBottom: 40,
  },

  // ===== HEADER =====
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  headerIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ===== INPUT WRAPPER =====
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 6,
  },
  inputLabelOptional: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
  },

  // ===== SEPARATOR =====
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayDark,
  },

  // ===== TYPE CARDS =====
  fieldContainer: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 120,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  typeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    elevation: 6,
  },
  typeCardIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeCardIconActive: {
    backgroundColor: Colors.secondary,
  },
  typeCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
  },
  typeCardTextActive: {
    color: Colors.white,
  },
  typeCardCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // ===== ADD NOTES BUTTON =====
  addNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addNotesText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ===== SUBMIT BUTTON =====
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.grayLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },

  // ===== VALIDATION HINT =====
  validationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 14,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  validationHintText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '600',
  },
});