import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';

export default function HistoriqueVentes() {
  const navigation = useNavigation();
  const { ventes, clients } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<'Tous' | 'Payé' | 'Crédit' | 'Partiel'>('Tous');

  // Obtenir le nom du client
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  };

  // Filtrer et trier les ventes
  const ventesFiltered = useMemo(() => {
    let filtered = [...ventes];

    // Filtrer par statut
    if (filterStatut !== 'Tous') {
      filtered = filtered.filter(v => v.statut === filterStatut);
    }

    // Filtrer par recherche (nom client)
    if (searchQuery.trim()) {
      filtered = filtered.filter(v => {
        const clientName = getClientName(v.clientId).toLowerCase();
        return clientName.includes(searchQuery.toLowerCase());
      });
    }

    // Trier par date décroissante
    return filtered.sort((a, b) => b.date - a.date);
  }, [ventes, filterStatut, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const total = ventesFiltered.reduce((sum, v) => sum + (v.total || 0), 0);
    const count = ventesFiltered.length;
    const moyenne = count > 0 ? total / count : 0;

    return { total, count, moyenne };
  }, [ventesFiltered]);

  const handleVentePress = (venteId: number) => {
    navigation.navigate('DetailVente' as never, { venteId } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Historique des Ventes</Text>
            <Text style={styles.headerSubtitle}>{stats.count} vente{stats.count > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt" size={24} color={Colors.secondary} />
          </View>
        </View>
      </View>

      {/* Statistiques résumées */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.total)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Nombre</Text>
          <Text style={styles.statValue}>{stats.count}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Moyenne</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.moyenne)}</Text>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {(['Tous', 'Payé', 'Crédit', 'Partiel'] as const).map((statut) => (
            <TouchableOpacity
              key={statut}
              style={[
                styles.filterChip,
                filterStatut === statut && styles.filterChipActive
              ]}
              onPress={() => setFilterStatut(statut)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                filterStatut === statut && styles.filterChipTextActive
              ]}>
                {statut}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des ventes */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {ventesFiltered.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="receipt-outline" size={64} color={Colors.grayLight} />
              <Text style={styles.emptyText}>Aucune vente trouvée</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery || filterStatut !== 'Tous' 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Commencez par créer votre première vente'}
              </Text>
            </CardContent>
          </Card>
        ) : (
          ventesFiltered.map((vente, index) => (
            <TouchableOpacity
              key={vente.id || index}
              activeOpacity={0.7}
              onPress={() => handleVentePress(vente.id!)}
            >
              <Card style={styles.venteCard}>
                <CardContent style={styles.venteContent}>
                  <View style={styles.venteLeft}>
                    <View style={[
                      styles.venteIcon,
                      vente.statut === 'Payé' ? { backgroundColor: '#8BC34A20' } :
                      vente.statut === 'Crédit' ? { backgroundColor: '#FF444420' } :
                      { backgroundColor: '#FFA72620' }
                    ]}>
                      <Ionicons 
                        name={
                          vente.statut === 'Payé' ? 'checkmark-circle' :
                          vente.statut === 'Crédit' ? 'alert-circle' :
                          'time'
                        }
                        size={28}
                        color={
                          vente.statut === 'Payé' ? Colors.accent :
                          vente.statut === 'Crédit' ? Colors.error :
                          '#FFA726'
                        }
                      />
                    </View>
                    <View style={styles.venteInfo}>
                      <Text style={styles.venteClient}>{getClientName(vente.clientId)}</Text>
                      <Text style={styles.venteDate}>{formatDate(vente.date)}</Text>
                      {vente.articles && vente.articles.length > 0 && (
                        <Text style={styles.venteArticles}>
                          {vente.articles.length} article{vente.articles.length > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.venteRight}>
                    <Text style={styles.venteMontant}>{formatCurrency(vente.total || 0)}</Text>
                    <View style={[
                      styles.venteStatutBadge,
                      vente.statut === 'Payé' ? { backgroundColor: '#8BC34A20' } :
                      vente.statut === 'Crédit' ? { backgroundColor: '#FF444420' } :
                      { backgroundColor: '#FFA72620' }
                    ]}>
                      <Text style={[
                        styles.venteStatutText,
                        vente.statut === 'Payé' ? { color: Colors.accent } :
                        vente.statut === 'Crédit' ? { color: Colors.error } :
                        { color: '#FFA726' }
                      ]}>
                        {vente.statut}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgEffect: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: Colors.primary,
    borderRadius: 80,
    opacity: 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filtersScroll: {
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.secondary,
  },
  scrollContent: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyCard: {
    borderRadius: 16,
    marginTop: 40,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  venteCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  venteContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  venteIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venteInfo: {
    flex: 1,
  },
  venteClient: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  venteDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  venteArticles: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  venteRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  venteMontant: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  venteStatutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
  },
  venteStatutText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
