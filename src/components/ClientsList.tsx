import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Colors from '../constants/Colors';
import { formatDate } from '../lib/utils';
import { Client } from '../lib/database';

export default function ClientsList() {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [type, setType] = useState<'Fidèle' | 'Nouveau' | 'Potentiel'>('Nouveau');

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.nom.toLowerCase().includes(query) ||
      client.prenom.toLowerCase().includes(query) ||
      client.telephone.includes(query)
    );
  });

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setNom(client.nom);
      setPrenom(client.prenom);
      setTelephone(client.telephone);
      setAdresse(client.adresse || '');
      setType(client.type || 'Nouveau');
    } else {
      setSelectedClient(null);
      setNom('');
      setPrenom('');
      setTelephone('');
      setAdresse('');
      setType('Nouveau');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!nom || !prenom || !telephone) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (selectedClient) {
        await updateClient(selectedClient.id!, { nom, prenom, telephone, adresse, type });
      } else {
        await addClient({ nom, prenom, telephone, adresse, type, createdAt: Date.now() });
      }
      setIsFormOpen(false);
      setNom('');
      setPrenom('');
      setTelephone('');
      setAdresse('');
      setType('Nouveau');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleOpenDetail = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  const renderClientItem = ({ item, index }: { item: Client; index: number }) => (
    <TouchableOpacity
      onPress={() => handleOpenDetail(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.clientCard}>
        <CardContent style={styles.clientContent}>
          <View style={styles.clientHeader}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientInitials}>
                {item.prenom[0]}{item.nom[0]}
              </Text>
              {item.type === 'Fidèle' && (
                <View style={styles.starBadge}>
                  <Ionicons name="star" size={12} color={Colors.white} />
                </View>
              )}
            </View>
            
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>
                {item.prenom} {item.nom}
              </Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={12} color={Colors.textSecondary} />
                <Text style={styles.clientPhone}>{item.telephone}</Text>
              </View>
              {item.type && (
                <View style={[
                  styles.typeBadge,
                  item.type === 'Fidèle' && styles.typeBadgeFidele,
                  item.type === 'Nouveau' && styles.typeBadgeNouveau,
                  item.type === 'Potentiel' && styles.typeBadgePotentiel,
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    item.type === 'Fidèle' && styles.typeBadgeTextFidele,
                    item.type === 'Nouveau' && styles.typeBadgeTextNouveau,
                    item.type === 'Potentiel' && styles.typeBadgeTextPotentiel,
                  ]}>
                    {item.type}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleOpenForm(item)}
              style={styles.editButton}
            >
              <Ionicons name="pencil" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="people" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.headerTitle}>Mes Clients</Text>
        </View>
      </View>

      {/* Search & Add */}
      <View style={styles.actionsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          onPress={() => handleOpenForm()}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Liste des clients */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={renderClientItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people" size={48} color={Colors.grayDark} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Aucun client trouvé' : 'Aucun client enregistré'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier client'}
              </Text>
            </CardContent>
          </Card>
        }
      />

      {/* Modal Formulaire */}
      <Modal
        visible={isFormOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedClient ? 'Modifier Client' : 'Nouveau Client'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <Input
                label="Prénom *"
                value={prenom}
                onChangeText={setPrenom}
                placeholder="Prénom"
              />
              <Input
                label="Nom *"
                value={nom}
                onChangeText={setNom}
                placeholder="Nom"
              />
              <Input
                label="Téléphone *"
                value={telephone}
                onChangeText={setTelephone}
                placeholder="+221 XX XXX XX XX"
                keyboardType="phone-pad"
              />
              <Input
                label="Adresse"
                value={adresse}
                onChangeText={setAdresse}
                placeholder="Adresse (optionnel)"
              />

              <Text style={styles.inputLabel}>Type de Client</Text>
              <View style={styles.typeSelector}>
                {(['Nouveau', 'Fidèle', 'Potentiel'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.typeOption,
                      type === t && styles.typeOptionActive
                    ]}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      type === t && styles.typeOptionTextActive
                    ]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title={selectedClient ? 'Modifier' : 'Ajouter'}
                onPress={handleSubmit}
                variant="primary"
                fullWidth
                style={styles.submitButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Détail Client */}
      <Modal
        visible={isDetailOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails Client</Text>
              <TouchableOpacity onPress={() => setIsDetailOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedClient && (
              <ScrollView style={styles.detailScroll}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailInitials}>
                    {selectedClient.prenom[0]}{selectedClient.nom[0]}
                  </Text>
                </View>

                <Text style={styles.detailName}>
                  {selectedClient.prenom} {selectedClient.nom}
                </Text>

                <View style={styles.detailInfo}>
                  <Ionicons name="call" size={20} color={Colors.primary} />
                  <Text style={styles.detailInfoText}>{selectedClient.telephone}</Text>
                </View>

                {selectedClient.adresse && (
                  <View style={styles.detailInfo}>
                    <Ionicons name="location" size={20} color={Colors.primary} />
                    <Text style={styles.detailInfoText}>{selectedClient.adresse}</Text>
                  </View>
                )}

                <View style={styles.detailInfo}>
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                  <Text style={styles.detailInfoText}>
                    Ajouté le {formatDate(selectedClient.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailActions}>
                  <Button
                    title="Modifier"
                    onPress={() => {
                      setIsDetailOpen(false);
                      handleOpenForm(selectedClient);
                    }}
                    variant="primary"
                    fullWidth
                  />
                  <Button
                    title="Supprimer"
                    onPress={async () => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
                        await deleteClient(selectedClient.id!);
                        setIsDetailOpen(false);
                      }
                    }}
                    variant="outline"
                    fullWidth
                    style={styles.deleteButton}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgEffect: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 160,
    backgroundColor: Colors.primary,
    borderRadius: 80,
    opacity: 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  clientCard: {
    marginBottom: 12,
  },
  clientContent: {
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientAvatar: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clientInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
    marginLeft: 16,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  clientPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeFidele: {
    backgroundColor: '#E8F5E9',
  },
  typeBadgeNouveau: {
    backgroundColor: '#E3F2FD',
  },
  typeBadgePotentiel: {
    backgroundColor: '#FFF9C4',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeTextFidele: {
    color: '#2E7D32',
  },
  typeBadgeTextNouveau: {
    color: '#1565C0',
  },
  typeBadgeTextPotentiel: {
    color: '#F57F17',
  },
  editButton: {
    padding: 8,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.gray,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  formScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeOptionTextActive: {
    color: Colors.secondary,
  },
  submitButton: {
    marginTop: 8,
  },
  detailScroll: {
    padding: 20,
  },
  detailAvatar: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.secondary,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  detailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailInfoText: {
    fontSize: 16,
    color: Colors.text,
  },
  detailActions: {
    marginTop: 24,
    gap: 12,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
});
