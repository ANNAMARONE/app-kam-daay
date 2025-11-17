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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useStore } from '../lib/store';
import { formatCurrency, formatPhone } from '../lib/utils';
import Colors from '../constants/Colors';
import { Card, CardContent } from './ui/Card';
import ClientForm from './ClientForm';
import ClientDetail from './ClientDetail';

type Tab = 'tous' | 'actifs' | 'inactifs' | 'credit';

export default function ClientsList() {
  const insets = useSafeAreaInsets();
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
    // Le crédit = somme des (total - montantPaye) pour chaque vente
    const totalCredit = clientVentes.reduce((sum, v) => {
      const reste = (v.total || 0) - (v.montantPaye || 0);
      return sum + (reste > 0 ? reste : 0); // On n'additionne que si reste > 0
    }, 0);
    return totalCredit;
  };

  // Vérifier si un client est actif (a une vente dans les 30 derniers jours)
  const isClientActive = (clientId: number) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const clientVentes = ventes.filter(v => v.clientId === clientId);
    
    // Un client est actif s'il a au moins une vente dans les 30 derniers jours
    const hasRecentVente = clientVentes.some(v => v.date >= thirtyDaysAgo);
    
    return hasRecentVente;
  };

  // Filtrer les clients selon l'onglet et la recherche
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.telephone.includes(searchQuery);
    
    const credit = getClientCredit(client.id!);
    const isActive = isClientActive(client.id!);
    
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

  // Calculer les statistiques
  const getStatistics = () => {
    const totalClients = clients.length;
    const clientsActifs = clients.filter(c => isClientActive(c.id!)).length;
    const clientsAvecCredit = clients.filter(c => getClientCredit(c.id!) > 0).length;
    const clientsFideles = clients.filter(c => c.type === 'Fidèle').length;

    return { totalClients, clientsActifs, clientsAvecCredit, clientsFideles };
  };

  const stats = getStatistics();

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
    const isActive = isClientActive(item.id!);

    return (
      <Card style={styles.clientCard}>
        <CardContent style={styles.clientCardContent}>
          <TouchableOpacity
            onPress={() => openDetail(item)}
            activeOpacity={0.7}
          >
            {/* Header avec Avatar et Info */}
            <View style={styles.clientHeader}>
              <View style={styles.clientLeft}>
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
                    <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.clientPhone}>{formatPhone(item.telephone)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.clientRight}>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>Actif</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={Colors.grayDark} />
              </View>
            </View>

            {/* Footer avec Crédit si présent */}
            {hasCredit && (
              <View style={styles.clientFooter}>
                <View style={styles.creditInfo}>
                  <Ionicons name="card-outline" size={16} color={Colors.warning} />
                  <Text style={styles.creditLabel}>Crédit en cours</Text>
                </View>
                <Text style={styles.creditAmount}>{formatCurrency(credit)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </CardContent>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec Safe Area et effets */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerBgEffect2} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={28} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>Clients</Text>
          </View>
          <Text style={styles.headerSubtitle}>Gérez votre portefeuille client</Text>
          
          {/* Bouton d'ajout dans le header */}
          <TouchableOpacity 
            style={styles.addButtonHeader} 
            onPress={() => openForm()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistiques en Haut */}
        <View style={styles.statsContainer}>
          {/* Total Clients - Card principale */}
          <Card style={styles.totalCard}>
            <CardContent style={styles.totalContent}>
              <View style={styles.totalLeft}>
                <View style={styles.totalIconLarge}>
                  <Ionicons name="people" size={36} color={Colors.white} />
                </View>
                <View style={styles.totalInfo}>
                  <Text style={styles.totalLabel}>Total Clients</Text>
                  <Text style={styles.totalValue}>{stats.totalClients}</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{stats.clientsActifs}</Text>
                <Text style={styles.statLabel}>Actifs</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="card-outline" size={20} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>{stats.clientsAvecCredit}</Text>
                <Text style={styles.statLabel}>Avec crédit</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF9C4' }]}>
                  <Ionicons name="star" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.clientsFideles}</Text>
                <Text style={styles.statLabel}>Fidèles</Text>
              </CardContent>
            </Card>
          </View>
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

        {/* Liste des clients */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Ionicons name="list" size={22} color={Colors.secondary} />
            <Text style={styles.listTitle}>
              {activeTab === 'tous' ? 'Tous les Clients' : 
               activeTab === 'actifs' ? 'Clients Actifs' :
               activeTab === 'inactifs' ? 'Clients Inactifs' : 
               'Clients avec Crédit'}
            </Text>
            <Text style={styles.listCount}>({sortedClients.length})</Text>
          </View>

          {sortedClients.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent style={styles.emptyContent}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={72} color={Colors.grayLight} />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Aucun client trouvé' : 'Aucun client'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Essayez une autre recherche' 
                    : 'Ajoutez votre premier client'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity style={styles.emptyButton} onPress={() => openForm()}>
                    <Ionicons name="add-circle" size={20} color={Colors.white} />
                    <Text style={styles.emptyButtonText}>Ajouter un client</Text>
                  </TouchableOpacity>
                )}
              </CardContent>
            </Card>
          ) : (
            <FlatList
              data={sortedClients}
              renderItem={renderClient}
              keyExtractor={(item) => item.id!.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ===== HEADER =====
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgEffect: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    backgroundColor: Colors.primary,
    borderRadius: 90,
    opacity: 0.15,
  },
  headerBgEffect2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    opacity: 0.08,
  },
  headerContent: {
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 52,
    height: 52,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 64,
  },
  addButtonHeader: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ===== CONTENT =====
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 20,
  },

  // ===== STATISTIQUES =====
  statsContainer: {
    marginBottom: 20,
  },
  totalCard: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  totalContent: {
    padding: 20,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  totalIconLarge: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ===== RECHERCHE =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: Colors.secondary,
  },

  // ===== TABS =====
  tabsContainer: {
    flexGrow: 0,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grayDark,
    marginLeft: 6,
  },
  tabTextActive: {
    color: Colors.secondary,
  },

  // ===== LISTE =====
  listSection: {
    marginBottom: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    flex: 1,
  },
  listCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // ===== CLIENT CARD =====
  clientCard: {
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  clientCardContent: {
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarCredit: {
    backgroundColor: Colors.warning,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
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
    gap: 4,
  },
  clientPhone: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clientRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  clientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.warning,
  },

  // ===== EMPTY STATE =====
  emptyCard: {
    backgroundColor: Colors.white,
  },
  emptyContent: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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

  // ===== MODALS =====
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