import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, getDatabaseInstance } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';

export default function CreditsPage() {
  const insets = useSafeAreaInsets();
  const { clients, ventes, paiements, addPaiement } = useStore();
  const [selectedVente, setSelectedVente] = useState<number | null>(null);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState<'Espèces' | 'Mobile Money' | 'Virement' | 'Autre'>('Espèces');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [expandedCredit, setExpandedCredit] = useState<number | null>(null);

  // Filtrer les ventes avec crédit
  const ventesAvecCredit = ventes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel');

  const getTotalCredit = () => {
    return ventesAvecCredit.reduce((total, vente) => {
      const paiementsVente = paiements.filter(p => p.venteId === vente.id);
      const totalPaye = paiementsVente.reduce((sum, p) => sum + p.montant, 0) + vente.montantPaye;
      const reste = vente.total - totalPaye;
      return total + reste;
    }, 0);
  };

  const getResteAPayer = (vente: any) => {
    const paiementsVente = paiements.filter(p => p.venteId === vente.id);
    const totalPaye = paiementsVente.reduce((sum, p) => sum + p.montant, 0) + vente.montantPaye;
    return vente.total - totalPaye;
  };

  const getPaiementsVente = (venteId: number) => {
    return paiements.filter(p => p.venteId === venteId).sort((a, b) => b.date - a.date);
  };

  const handleOpenPaymentModal = (venteId: number) => {
    setSelectedVente(venteId);
    setIsPaymentModalOpen(true);
    setMontant('');
  };

  const handleAddPaiement = async () => {
    if (!selectedVente || !montant || parseFloat(montant) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    const vente = ventes.find(v => v.id === selectedVente);
    if (!vente) return;

    const reste = getResteAPayer(vente);
    const montantPaiement = parseFloat(montant);

    if (montantPaiement > reste) {
      alert(`Le montant ne peut pas dépasser le reste à payer (${formatCurrency(reste)})`);
      return;
    }

    try {
      await addPaiement({
        venteId: selectedVente,
        montant: montantPaiement,
        date: Date.now(),
        methode,
      });

      // Mettre à jour le statut de la vente si complètement payée
      const nouveauReste = reste - montantPaiement;
      if (nouveauReste === 0) {
        await getDatabaseInstance().updateVente(selectedVente, { statut: 'Payé' });
      } else if (nouveauReste < reste && nouveauReste > 0) {
        await getDatabaseInstance().updateVente(selectedVente, { statut: 'Partiel' });
      }

      alert('✅ Paiement enregistré avec succès !');
      setIsPaymentModalOpen(false);
      setSelectedVente(null);
      setMontant('');
    } catch (error) {
      alert('❌ Erreur lors de l\'enregistrement du paiement');
      console.error('Erreur paiement:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec Safe Area */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerBgEffect2} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="card" size={28} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>Crédits</Text>
          </View>
          <Text style={styles.headerSubtitle}>Gérez vos paiements en cours</Text>
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
          {/* Total Crédit - Card principale */}
          <Card style={styles.totalCard}>
            <CardContent style={styles.totalContent}>
              <View style={styles.totalLeft}>
                <View style={styles.totalIconLarge}>
                  <Ionicons name="trending-up" size={36} color={Colors.white} />
                </View>
                <View style={styles.totalInfo}>
                  <Text style={styles.totalLabel}>Total à Recevoir</Text>
                  <Text style={styles.totalValue}>{formatCurrency(getTotalCredit())}</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="receipt-outline" size={20} color="#1976D2" />
                </View>
                <Text style={styles.statValue}>{ventesAvecCredit.length}</Text>
                <Text style={styles.statLabel}>Crédits actifs</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="people-outline" size={20} color="#E65100" />
                </View>
                <Text style={styles.statValue}>
                  {new Set(ventesAvecCredit.map(v => v.clientId)).size}
                </Text>
                <Text style={styles.statLabel}>Clients</Text>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Liste des Crédits */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Ionicons name="list" size={22} color={Colors.secondary} />
            <Text style={styles.listTitle}>Paiements en Attente</Text>
          </View>

          {ventesAvecCredit.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent style={styles.emptyContent}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="checkmark-circle" size={72} color={Colors.accent} />
                </View>
                <Text style={styles.emptyTitle}>Tout est à jour ! 🎉</Text>
                <Text style={styles.emptySubtitle}>
                  Aucun crédit en attente de paiement
                </Text>
              </CardContent>
            </Card>
          ) : (
            ventesAvecCredit.map((vente) => {
              const client = clients.find(c => c.id === vente.clientId);
              const reste = getResteAPayer(vente);
              const pourcentagePaye = ((vente.total - reste) / vente.total) * 100;
              const paiementsVente = getPaiementsVente(vente.id!);
              const isExpanded = expandedCredit === vente.id;

              return (
                <Card key={vente.id} style={styles.creditCard}>
                  <CardContent style={styles.creditContent}>
                    {/* Header du Crédit */}
                    <TouchableOpacity 
                      onPress={() => setExpandedCredit(isExpanded ? null : vente.id!)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.creditHeader}>
                        <View style={styles.creditLeft}>
                          <View style={styles.clientAvatar}>
                            <Text style={styles.clientAvatarText}>
                              {client?.prenom?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                          </View>
                          <View style={styles.creditInfo}>
                            <Text style={styles.creditClientName}>
                              {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                            </Text>
                            <View style={styles.creditMeta}>
                              <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                              <Text style={styles.creditDate}>{formatDate(vente.date)}</Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.creditRight}>
                          <View style={[
                            styles.statusBadge,
                            vente.statut === 'Crédit' ? styles.statusBadgeCredit : styles.statusBadgePartiel
                          ]}>
                            <Text style={styles.statusBadgeText}>
                              {vente.statut === 'Crédit' ? '⚠️ Crédit' : '⏳ Partiel'}
                            </Text>
                          </View>
                          <Ionicons 
                            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                            size={20} 
                            color={Colors.grayDark} 
                          />
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Montants Principaux */}
                    <View style={styles.creditAmounts}>
                      <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Total vente</Text>
                        <Text style={styles.amountValue}>{formatCurrency(vente.total)}</Text>
                      </View>
                      <View style={styles.amountDivider} />
                      <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Reste à payer</Text>
                        <Text style={[styles.amountValue, styles.amountValueReste]}>
                          {formatCurrency(reste)}
                        </Text>
                      </View>
                    </View>

                    {/* Barre de Progression Améliorée */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>
                          Payé: {formatCurrency(vente.total - reste)}
                        </Text>
                        <Text style={styles.progressPercentage}>
                          {pourcentagePaye.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${pourcentagePaye}%`,
                                backgroundColor: pourcentagePaye === 100 ? Colors.accent : 
                                               pourcentagePaye >= 50 ? '#FFA726' : Colors.warning
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>

                    {/* Historique des Paiements (Expandable) */}
                    {isExpanded && paiementsVente.length > 0 && (
                      <View style={styles.historySection}>
                        <View style={styles.historyHeader}>
                          <Ionicons name="time-outline" size={16} color={Colors.secondary} />
                          <Text style={styles.historyTitle}>
                            Historique ({paiementsVente.length})
                          </Text>
                        </View>
                        {paiementsVente.map((paiement, index) => (
                          <View key={paiement.id || index} style={styles.historyItem}>
                            <View style={styles.historyLeft}>
                              <View style={styles.historyDot} />
                              <View>
                                <Text style={styles.historyDate}>
                                  {formatDate(paiement.date)}
                                </Text>
                                <Text style={styles.historyMethode}>{paiement.methode}</Text>
                              </View>
                            </View>
                            <Text style={styles.historyMontant}>
                              +{formatCurrency(paiement.montant)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Bouton d'Action */}
                    <View style={styles.creditActions}>
                      <Button
                        title="💰 Enregistrer un Paiement"
                        onPress={() => handleOpenPaymentModal(vente.id!)}
                        variant="primary"
                        size="md"
                        fullWidth
                      />
                    </View>
                  </CardContent>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal Paiement Amélioré */}
      <Modal
        visible={isPaymentModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setIsPaymentModalOpen(false)}
          />
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[
              styles.modalContent,
              { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }
            ]}>
              {/* Header Modal */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIcon}>
                    <Ionicons name="cash" size={24} color={Colors.primary} />
                  </View>
                  <Text style={styles.modalTitle}>Nouveau Paiement</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setIsPaymentModalOpen(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close-circle" size={32} color={Colors.grayDark} />
                </TouchableOpacity>
              </View>

              {selectedVente && (
                <ScrollView 
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Info Client */}
                  {(() => {
                    const vente = ventes.find(v => v.id === selectedVente);
                    const client = vente ? clients.find(c => c.id === vente.clientId) : null;
                    const reste = vente ? getResteAPayer(vente) : 0;

                    return (
                      <>
                        <View style={styles.clientInfoCard}>
                          <View style={styles.clientInfoHeader}>
                            <View style={styles.clientAvatarLarge}>
                              <Text style={styles.clientAvatarLargeText}>
                                {client?.prenom?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            </View>
                            <View style={styles.clientInfoDetails}>
                              <Text style={styles.clientInfoName}>
                                {client ? `${client.prenom} ${client.nom}` : 'Client'}
                              </Text>
                              <Text style={styles.clientInfoPhone}>{client?.telephone}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Reste à Payer - Card mise en évidence */}
                        <View style={styles.resteCard}>
                          <View style={styles.resteIconContainer}>
                            <Ionicons name="wallet" size={28} color={Colors.warning} />
                          </View>
                          <View style={styles.resteInfo}>
                            <Text style={styles.resteLabel}>Reste à payer</Text>
                            <Text style={styles.resteValue}>{formatCurrency(reste)}</Text>
                          </View>
                        </View>

                        {/* Formulaire */}
                        <View style={styles.formSection}>
                          <Input
                            label="Montant du Paiement (FCFA) *"
                            placeholder="Entrez le montant"
                            value={montant}
                            onChangeText={setMontant}
                            keyboardType="numeric"
                          />

                          <Select
                            label="Méthode de Paiement"
                            value={methode}
                            onChange={(value) => setMethode(value as any)}
                            options={[
                              { label: '💵 Espèces', value: 'Espèces' },
                              { label: '📱 Mobile Money', value: 'Mobile Money' },
                              { label: '🏦 Virement', value: 'Virement' },
                              { label: '💳 Autre', value: 'Autre' },
                            ]}
                          />

                          {/* Boutons Montants Rapides */}
                          <View style={styles.quickAmounts}>
                            <Text style={styles.quickAmountsLabel}>Montants rapides</Text>
                            <View style={styles.quickAmountsRow}>
                              <TouchableOpacity
                                style={styles.quickAmountButton}
                                onPress={() => setMontant(String(Math.floor(reste / 2)))}
                              >
                                <Text style={styles.quickAmountText}>50%</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.quickAmountButton}
                                onPress={() => setMontant(String(Math.floor(reste * 0.75)))}
                              >
                                <Text style={styles.quickAmountText}>75%</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.quickAmountButton, styles.quickAmountButtonFull]}
                                onPress={() => setMontant(String(reste))}
                              >
                                <Text style={[styles.quickAmountText, styles.quickAmountTextFull]}>
                                  100%
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Bouton Submit */}
                          <Button
                            title="✅ Enregistrer le Paiement"
                            onPress={handleAddPaiement}
                            variant="success"
                            fullWidth
                            size="lg"
                            style={styles.submitButton}
                          />
                        </View>
                      </>
                    );
                  })()}
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
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
    marginBottom: 24,
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
    fontSize: 32,
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
  },

  // Empty State
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
  },

  // ===== CREDIT CARD =====
  creditCard: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  creditContent: {
    padding: 16,
  },

  // Header
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  creditInfo: {
    flex: 1,
  },
  creditClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  creditMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creditDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  creditRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCredit: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgePartiel: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondary,
  },

  // Montants
  creditAmounts: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  amountDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  amountLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  amountValueReste: {
    color: Colors.warning,
    fontSize: 18,
  },

  // Progression
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  progressBarContainer: {
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    borderRadius: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },

  // Historique
  historySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  historyMethode: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  historyMontant: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },

  // Actions
  creditActions: {
    marginTop: 4,
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: 500,
    maxHeight: '85%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 44,
    height: 44,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },

  // Client Info
  clientInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  clientInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatarLarge: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarLargeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  clientInfoDetails: {
    flex: 1,
  },
  clientInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  clientInfoPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Reste à Payer
  resteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: Colors.warning,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  resteIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resteInfo: {
    flex: 1,
  },
  resteLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  resteValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.warning,
  },

  // Form
  formSection: {
    gap: 16,
  },

  // Montants Rapides
  quickAmounts: {
    marginTop: 8,
  },
  quickAmountsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickAmountButtonFull: {
    backgroundColor: `${Colors.accent}15`,
    borderColor: Colors.accent,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  quickAmountTextFull: {
    color: Colors.accent,
  },

  submitButton: {
    marginTop: 8,
  },
});