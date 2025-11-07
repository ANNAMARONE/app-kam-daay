import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '../lib/store';
import { formatCurrency, formatPhone } from '../lib/utils';
import Colors from '../constants/Colors';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';

type Tab = 'tous' | 'actifs' | 'inactifs' | 'credit';

export default function ClientsList() {
  const { clients, ventes, paiements } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any>(null);

  // Calculer le solde crédit pour un client
  const getClientCredit = (clientId: number) => {
    const clientVentes = ventes.filter(v => v.clientId === clientId);
    const totalVentes = clientVentes.reduce((sum, v) => sum + (v.total || 0), 0);
    const clientPaiements = paiements.filter(p => p.clientId === clientId);
    const totalPaiements = clientPaiements.reduce((sum, p) => sum + (p.montant || 0), 0);
    return totalVentes - totalPaiements;
  };

  // Filtrer les clients selon l'onglet et la recherche
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.telephone.includes(searchQuery);
    
    const credit = getClientCredit(client.id!);
    const isActive = client.derniereVisite && (Date.now() - client.derniereVisite) < 30 * 24 * 60 * 60 * 1000;
    
    switch (activeTab) {
      case 'actifs':
        return matchesSearch && isActive;
      case 'inactifs':
        return matchesSearch && !isActive;
      case 'credit':
        return matchesSearch && credit > 0;
      default:
        return matchesSearch;
    }
  });

  // Trier par date de dernière visite
  const sortedClients = [...filteredClients].sort((a, b) => {
    const dateA = a.derniereVisite || 0;
    const dateB = b.derniereVisite || 0;
    return dateB - dateA;
  });

  // Ouvrir le formulaire
  const openForm = (client?: any) => {
    setClientToEdit(client || null);
    setShowFormModal(true);
  };

  // Ouvrir les détails
  const openDetail = (client: any) => {
    setSelectedClient(client);
    setShowDetailModal(true);
  };

  // Fermer le formulaire
  const closeForm = () => {
    setShowFormModal(false);
    setClientToEdit(null);
  };

  // Fermer les détails
  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedClient(null);
  };

  // Ouvrir édition depuis les détails
  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setTimeout(() => {
      openForm(selectedClient);
    }, 300);
  };

  // Tabs
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'tous', label: 'Tous', icon: 'people' },
    { id: 'actifs', label: 'Actifs', icon: 'checkmark-circle' },
    { id: 'inactifs', label: 'Inactifs', icon: 'time' },
    { id: 'credit', label: 'Crédit', icon: 'card' },
  ];

  const renderClient = ({ item }: { item: any }) => {
    const credit = getClientCredit(item.id!);
    const hasCredit = credit > 0;
    const isActive = item.derniereVisite && (Date.now() - item.derniereVisite) < 30 * 24 * 60 * 60 * 1000;

    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => openDetail(item)}
        activeOpacity={0.7}
      >
        {/* Avatar et info */}
        <View style={styles.clientHeader}>
          <View style={[styles.avatar, hasCredit && styles.avatarCredit]}>
            <Text style={styles.avatarText}>
              {item.prenom.charAt(0).toUpperCase()}{item.nom.charAt(0).toUpperCase()}
            </Text>
            {item.type === 'Fidèle' && (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={12} color={Colors.white} />
              </View>
            )}
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.prenom} {item.nom}</Text>
            <View style={styles.clientMeta}>
              <Ionicons name="call" size={12} color={Colors.grayDark} />
              <Text style={styles.clientPhone}>{formatPhone(item.telephone)}</Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Actif</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Crédit si présent */}
        {hasCredit && (
          <View style={styles.clientFooter}>
            <View style={styles.creditBadge}>
              <Ionicons name="card" size={14} color={Colors.error} />
              <Text style={styles.creditText}>{formatCurrency(credit)}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Clients</Text>
            <Text style={styles.headerSubtitle}>{sortedClients.length} clients</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => openForm()}>
            <Ionicons name="add" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.grayDark} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.grayDark}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.grayDark} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? Colors.primary : Colors.grayDark}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des clients */}
      <FlatList
        data={sortedClients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={Colors.grayLight} />
            <Text style={styles.emptyText}>Aucun client trouvé</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier client'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={() => openForm()}>
                <Ionicons name="add-circle" size={20} color={Colors.white} />
                <Text style={styles.emptyButtonText}>Ajouter un client</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Modal Formulaire */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForm}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeForm}>
              <Ionicons name="close" size={28} color={Colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {clientToEdit ? 'Modifier Client' : 'Nouveau Client'}
            </Text>
            <View style={{ width: 28 }} />
          </View>
          <ClientForm client={clientToEdit} onSuccess={closeForm} />
        </SafeAreaView>
      </Modal>

      {/* Modal Détails */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetail}>
              <Ionicons name="close" size={28} color={Colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails Client</Text>
            <View style={{ width: 28 }} />
          </View>
          {selectedClient && (
            <ClientDetail
              client={selectedClient}
              onClose={closeDetail}
              onEdit={handleEditFromDetail}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.white,
  },
  tabsContainer: {
    flexGrow: 0,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayDark,
    marginLeft: 6,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  clientCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarCredit: {
    backgroundColor: Colors.error,
  },
  avatarText: {
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
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  clientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientPhone: {
    fontSize: 13,
    color: Colors.grayDark,
    marginLeft: 4,
  },
  activeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#8BC34A20',
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  clientFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FF444410',
    borderRadius: 8,
  },
  creditText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.grayDark,
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
});
