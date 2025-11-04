import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate, calculateDailyTotal, calculateWeeklyTotal } from '../lib/utils';
import ClientForm from './ClientForm';

export default function Dashboard() {
  const navigation = useNavigation();
  const { ventes, clients, paiements } = useStore();
  const [showClientModal, setShowClientModal] = useState(false);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const dailyTotal = calculateDailyTotal(ventes);
    const weeklyTotal = calculateWeeklyTotal(ventes);
    const monthlyTotal = ventes
      .filter(v => {
        const venteDate = new Date(v.date);
        const now = new Date();
        return venteDate.getMonth() === now.getMonth() && 
               venteDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, v) => sum + (v.total || 0), 0);

    // Total des crédits
    const totalVentes = ventes.reduce((sum, v) => sum + (v.total || 0), 0);
    const totalPaiements = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
    const totalCredits = totalVentes - totalPaiements;

    // Clients actifs (visités dans les 30 derniers jours)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const activeClients = clients.filter(c => 
      c.derniereVisite && c.derniereVisite > thirtyDaysAgo
    ).length;

    // Dernières ventes
    const recentVentes = [...ventes]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    return {
      dailyTotal,
      weeklyTotal,
      monthlyTotal,
      totalCredits,
      totalClients: clients.length,
      activeClients,
      totalVentes: ventes.length,
      recentVentes,
    };
  }, [ventes, clients, paiements]);

  // Obtenir le nom du client
  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  };

  // Navigation vers les différentes pages
  const handleNouvelleVente = () => {
    navigation.navigate('Ventes' as never);
  };

  const handleAjouterClient = () => {
    setShowClientModal(true);
  };

  const handlePaiementCredit = () => {
    navigation.navigate('Credits' as never);
  };

  const handleVoirStats = () => {
    navigation.navigate('Statistiques' as never);
  };

  const handleVoirToutClients = () => {
    navigation.navigate('Clients' as never);
  };

  const handleVoirToutVentes = () => {
    navigation.navigate('Ventes' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header avec date et salutation */}
        <View style={styles.header}>
          <View style={styles.headerBgEffect1} />
          <View style={styles.headerBgEffect2} />
          
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Bonjour! 👋</Text>
                <Text style={styles.date}>{formatDate(Date.now())}</Text>
              </View>
              <View style={styles.headerIcon}>
                <Text style={styles.headerEmoji}>💼</Text>
              </View>
            </View>
            
            <View style={styles.headerStats}>
              <TouchableOpacity 
                style={styles.headerStatItem}
                onPress={handleVoirToutClients}
                activeOpacity={0.7}
              >
                <Ionicons name="people" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.headerStatValue}>{stats.totalClients}</Text>
                <Text style={styles.headerStatLabel}>Clients</Text>
              </TouchableOpacity>
              <View style={styles.headerStatDivider} />
              <TouchableOpacity 
                style={styles.headerStatItem}
                onPress={handleVoirToutVentes}
                activeOpacity={0.7}
              >
                <Ionicons name="cart" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.headerStatValue}>{stats.totalVentes}</Text>
                <Text style={styles.headerStatLabel}>Ventes</Text>
              </TouchableOpacity>
              <View style={styles.headerStatDivider} />
              <TouchableOpacity 
                style={styles.headerStatItem}
                onPress={handleVoirToutClients}
                activeOpacity={0.7}
              >
                <Ionicons name="trending-up" size={20} color="rgba(255,255,255,0.8)" />
                <Text style={styles.headerStatValue}>{stats.activeClients}</Text>
                <Text style={styles.headerStatLabel}>Actifs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* KPIs Principaux */}
        <View style={styles.kpisContainer}>
          {/* Ventes du Jour */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleVoirToutVentes}
          >
            <Card style={[styles.kpiCard, styles.kpiCardPrimary]}>
              <CardContent style={styles.kpiContent}>
                <View style={styles.kpiHeader}>
                  <View style={[styles.kpiIcon, styles.kpiIconPrimary]}>
                    <Ionicons name="today" size={24} color={Colors.secondary} />
                  </View>
                  <View style={styles.kpiTextContainer}>
                    <Text style={styles.kpiLabel}>Aujourd'hui</Text>
                    <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                      {formatCurrency(stats.dailyTotal)}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </TouchableOpacity>

          {/* Grille 2x2 */}
          <View style={styles.kpiGrid}>
            {/* Semaine */}
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ flex: 1, minWidth: '47%' }}
              onPress={handleVoirStats}
            >
              <Card style={[styles.kpiCardSmall, styles.kpiCardSuccess]}>
                <CardContent style={styles.kpiContentSmall}>
                  <View style={[styles.kpiIconSmall, { backgroundColor: Colors.accent }]}>
                    <Ionicons name="calendar" size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.kpiLabelSmall}>Semaine</Text>
                  <Text style={[styles.kpiValueSmall, { color: Colors.accent }]}>
                    {formatCurrency(stats.weeklyTotal)}
                  </Text>
                </CardContent>
              </Card>
            </TouchableOpacity>

            {/* Mois */}
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ flex: 1, minWidth: '47%' }}
              onPress={handleVoirStats}
            >
              <Card style={[styles.kpiCardSmall, styles.kpiCardInfo]}>
                <CardContent style={styles.kpiContentSmall}>
                  <View style={[styles.kpiIconSmall, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="stats-chart" size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.kpiLabelSmall}>Mois</Text>
                  <Text style={[styles.kpiValueSmall, { color: '#2196F3' }]}>
                    {formatCurrency(stats.monthlyTotal)}
                  </Text>
                </CardContent>
              </Card>
            </TouchableOpacity>

            {/* Crédits */}
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ flex: 1, minWidth: '47%' }}
              onPress={handlePaiementCredit}
            >
              <Card style={[styles.kpiCardSmall, stats.totalCredits > 0 ? styles.kpiCardWarning : styles.kpiCardNeutral]}>
                <CardContent style={styles.kpiContentSmall}>
                  <View style={[styles.kpiIconSmall, { backgroundColor: stats.totalCredits > 0 ? Colors.error : Colors.grayLight }]}>
                    <Ionicons name="card" size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.kpiLabelSmall}>Crédits</Text>
                  <Text style={[styles.kpiValueSmall, { color: stats.totalCredits > 0 ? Colors.error : Colors.textSecondary }]}>
                    {formatCurrency(stats.totalCredits)}
                  </Text>
                </CardContent>
              </Card>
            </TouchableOpacity>

            {/* Clients Actifs */}
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ flex: 1, minWidth: '47%' }}
              onPress={handleVoirToutClients}
            >
              <Card style={[styles.kpiCardSmall, styles.kpiCardSecondary]}>
                <CardContent style={styles.kpiContentSmall}>
                  <View style={[styles.kpiIconSmall, { backgroundColor: Colors.secondary }]}>
                    <Ionicons name="people" size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.kpiLabelSmall}>Actifs</Text>
                  <Text style={[styles.kpiValueSmall, { color: Colors.secondary }]}>
                    {stats.activeClients}/{stats.totalClients}
                  </Text>
                </CardContent>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleNouvelleVente}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FFD70020' }]}>
                <Ionicons name="add-circle" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Nouvelle</Text>
              <Text style={styles.actionLabel}>Vente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleAjouterClient}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#004D4020' }]}>
                <Ionicons name="person-add" size={32} color={Colors.secondary} />
              </View>
              <Text style={styles.actionLabel}>Ajouter</Text>
              <Text style={styles.actionLabel}>Client</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handlePaiementCredit}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#8BC34A20' }]}>
                <Ionicons name="cash" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.actionLabel}>Paiement</Text>
              <Text style={styles.actionLabel}>Crédit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleVoirStats}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FFA72620' }]}>
                <Ionicons name="bar-chart" size={32} color="#FFA726" />
              </View>
              <Text style={styles.actionLabel}>Voir</Text>
              <Text style={styles.actionLabel}>Stats</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dernières Ventes */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activité Récente</Text>
            <TouchableOpacity onPress={handleVoirToutVentes}>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {stats.recentVentes.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent style={styles.emptyContent}>
                <Ionicons name="cart-outline" size={48} color={Colors.grayLight} />
                <Text style={styles.emptyText}>Aucune vente</Text>
                <Text style={styles.emptySubtext}>Commencez par créer votre première vente</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={handleNouvelleVente}
                >
                  <Ionicons name="add-circle" size={20} color={Colors.white} />
                  <Text style={styles.emptyButtonText}>Créer une vente</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>
          ) : (
            stats.recentVentes.map((vente, index) => (
              <TouchableOpacity 
                key={vente.id || index}
                activeOpacity={0.7}
                onPress={handleVoirToutVentes}
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
                          size={24}
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
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Statut Application */}
        <View style={styles.statusContainer}>
          <View style={styles.statusDot} />
          <View>
            <Text style={styles.statusTitle}>🔒 Mode Hors Ligne</Text>
            <Text style={styles.statusSubtitle}>Toutes vos données sont sécurisées localement</Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal Ajouter Client */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <Ionicons name="close" size={28} color={Colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau Client</Text>
            <View style={{ width: 28 }} />
          </View>
          <ClientForm 
            onSuccess={() => setShowClientModal(false)} 
          />
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
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgEffect1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: Colors.primary,
    borderRadius: 80,
    opacity: 0.1,
  },
  headerBgEffect2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 128,
    height: 128,
    backgroundColor: Colors.accent,
    borderRadius: 64,
    opacity: 0.1,
  },
  headerContent: {
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  headerStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  headerStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  kpisContainer: {
    paddingHorizontal: 16,
    marginTop: -16,
    gap: 12,
  },
  kpiCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  kpiCardPrimary: {
    backgroundColor: '#FFFBF0',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  kpiCardSuccess: {
    backgroundColor: '#F1F8E9',
  },
  kpiCardSecondary: {
    backgroundColor: '#E0F2F1',
  },
  kpiCardInfo: {
    backgroundColor: '#E3F2FD',
  },
  kpiCardWarning: {
    backgroundColor: '#FFEBEE',
  },
  kpiCardNeutral: {
    backgroundColor: '#F5F5F5',
  },
  kpiContent: {
    padding: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kpiIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconPrimary: {
    backgroundColor: Colors.primary,
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCardSmall: {
    borderRadius: 16,
  },
  kpiContentSmall: {
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  kpiIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLabelSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  kpiValueSmall: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 16,
  },
  emptyContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
  },
  venteCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  venteContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  venteIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venteInfo: {
    flex: 1,
  },
  venteClient: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 2,
  },
  venteDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venteRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  venteMontant: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  venteStatutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  venteStatutText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: 'rgba(139, 195, 74, 0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.2)',
  },
  statusDot: {
    width: 12,
    height: 12,
    backgroundColor: Colors.accent,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
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
