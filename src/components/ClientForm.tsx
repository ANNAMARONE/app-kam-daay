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

  useEffect(() => {
    if (client) {
      setNom(client.nom || '');
      setPrenom(client.prenom || '');
      setTelephone(client.telephone || '');
      setAdresse(client.adresse || '');
      setType(client.type || 'Nouveau');
      setNotes(client.notes || '');
    }
  }, [client]);

  const handleSubmit = async () => {
    // Validation
    if (!nom.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Le nom est requis',
      });
      return;
    }

    if (!prenom.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Le prénom est requis',
      });
      return;
    }

    if (!telephone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Le téléphone est requis',
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
          text1: 'Client modifié',
          text2: `${prenom} ${nom} a été modifié avec succès`,
        });
      } else {
        await addClient(clientData);
        Toast.show({
          type: 'success',
          text1: 'Client ajouté',
          text2: `${prenom} ${nom} a été ajouté avec succès`,
        });
      }

      onSuccess();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder le client',
      });
    }
  };

  const types: Array<'Nouveau' | 'Fidèle' | 'Potentiel'> = ['Nouveau', 'Fidèle', 'Potentiel'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Prénom */}
        <Input
          label="Prénom *"
          value={prenom}
          onChangeText={setPrenom}
          placeholder="Ex: Fatou"
          autoCapitalize="words"
        />

        {/* Nom */}
        <Input
          label="Nom *"
          value={nom}
          onChangeText={setNom}
          placeholder="Ex: Diop"
          autoCapitalize="words"
        />

        {/* Téléphone */}
        <Input
          label="Téléphone *"
          value={telephone}
          onChangeText={setTelephone}
          placeholder="+221 XX XXX XX XX"
          keyboardType="phone-pad"
        />

        {/* Adresse */}
        <Input
          label="Adresse"
          value={adresse}
          onChangeText={setAdresse}
          placeholder="Ex: Mbour, Quartier..."
        />

        {/* Type de Client */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Type de Client</Text>
          <View style={styles.typeSelector}>
            {types.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.typeOption,
                  type === t && styles.typeOptionActive,
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    t === 'Fidèle' ? 'star' :
                    t === 'Nouveau' ? 'sparkles' :
                    'eye'
                  }
                  size={18}
                  color={type === t ? Colors.secondary : Colors.grayDark}
                  style={styles.typeIcon}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === t && styles.typeOptionTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <Input
          label="Notes (optionnel)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Informations supplémentaires..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Bouton Submit */}
        <Button
          title={client ? 'Modifier le Client' : 'Ajouter le Client'}
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          style={styles.submitButton}
        />

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Les champs marqués d'un * sont obligatoires
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeIcon: {
    marginRight: 6,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.grayDark,
  },
  typeOptionTextActive: {
    color: Colors.secondary,
  },
  submitButton: {
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
