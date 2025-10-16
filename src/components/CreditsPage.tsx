import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { database } from '../lib/database';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';

export default function CreditsPage() {
  const { clients, ventes, paiements, addPaiement } = useStore();
  const [selectedVente, setSelectedVente] = useState<number | null>(null);
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState<'Espèces' | 'Mobile Money' | 'Virement' | 'Autre'>('Espèces');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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

  const handleOpenPaymentModal = (venteId: number) => {
    setSelectedVente(venteId);
    setIsPaymentModalOpen(true);
  };

  const handleAddPaiement = async () => {
    if (!selectedVente || !montant || parseFloat(montant) <= 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const vente = ventes.find(v => v.id === selectedVente);
    if (!vente) return;

    const reste = getResteAPayer(vente);
    const montantPaiement = parseFloat(montant);

    if (montantPaiement > reste) {
      alert('Le montant dépasse le reste à payer');
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
        await database.updateVente(selectedVente, { statut: 'Payé' });
      }

      alert('Paiement enregistré avec succès');
      setIsPaymentModalOpen(false);
      setSelectedVente(null);
      setMontant('');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="card" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.headerTitle}>Crédits & Paiements</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Total Crédit */}
        <Card style={styles.totalCard}>
          <CardContent style={styles.totalContent}>
            <View style={styles.totalInfo}>
              <Text style={styles.totalLabel}>Total Crédits en Cours</Text>
              <Text style={styles.totalValue}>{formatCurrency(getTotalCredit())}</Text>
              <Text style={styles.totalSubtitle}>
                {ventesAvecCredit.length} vente(s) en crédit
              </Text>
            </View>
            <View style={styles.totalIcon}>
              <Ionicons name="cash" size={32} color={Colors.secondary} />
            </View>
          </CardContent>
        </Card>

        {/* Liste des Crédits */}
        <Card style={styles.listCard}>
          <CardContent style={styles.listContent}>
            <View style={styles.listHeader}>
              <Ionicons name="alert-circle" size={20} color={Colors.warning} />
              <Text style={styles.listTitle}>Ventes à Crédit</Text>
            </View>

            {ventesAvecCredit.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.accent} />
                <Text style={styles.emptyTitle}>Aucun crédit en cours</Text>
                <Text style={styles.emptySubtitle}>Toutes vos ventes sont à jour !</Text>
              </View>
            ) : (
              ventesAvecCredit.map((vente) => {
                const client = clients.find(c => c.id === vente.clientId);
                const reste = getResteAPayer(vente);
                const pourcentagePaye = ((vente.total - reste) / vente.total) * 100;

                return (
                  <Card key={vente.id} style={styles.creditCard}>
                    <CardContent style={styles.creditContent}>
                      <View style={styles.creditHeader}>
                        <View style={styles.creditInfo}>
                          <Text style={styles.creditClientName}>
                            {client ? `${client.prenom} ${client.nom}` : 'Client inconnu'}
                          </Text>
                          <Text style={styles.creditClientPhone}>{client?.telephone}</Text>
                          <Text style={styles.creditDate}>{formatDate(vente.date)}</Text>
                        </View>
                        <View style={[
                          styles.statusBadge,
                          vente.statut === 'Crédit' ? styles.statusBadgeCredit : styles.statusBadgePartiel
                        ]}>
                          <Text style={[
                            styles.statusBadgeText,
                            vente.statut === 'Crédit' ? styles.statusBadgeTextCredit : styles.statusBadgeTextPartiel
                          ]}>
                            {vente.statut}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.creditDetails}>
                        <View style={styles.creditRow}>
                          <Text style={styles.creditRowLabel}>Total vente:</Text>
                          <Text style={styles.creditRowValue}>{formatCurrency(vente.total)}</Text>
                        </View>
                        <View style={styles.creditRow}>
                          <Text style={styles.creditRowLabel}>Déjà payé:</Text>
                          <Text style={[styles.creditRowValue, { color: Colors.accent }]}>
                            {formatCurrency(vente.total - reste)}
                          </Text>
                        </View>
                        <View style={styles.creditRow}>
                          <Text style={styles.creditRowLabel}>Reste à payer:</Text>
                          <Text style={[styles.creditRowValue, styles.creditRowValueReste]}>
                            {formatCurrency(reste)}
                          </Text>
                        </View>

                        {/* Barre de progression */}
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${pourcentagePaye}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{pourcentagePaye.toFixed(0)}% payé</Text>
                      </View>

                      <Button
                        title="Enregistrer un Paiement"
                        onPress={() => handleOpenPaymentModal(vente.id!)}
                        variant="primary"
                        size="sm"
                        fullWidth
                        style={styles.paymentButton}
                      />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
      </ScrollView>

      {/* Modal Paiement */}
      <Modal
        visible={isPaymentModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Paiement</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selectedVente && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.resteCard}>
                  <Text style={styles.resteLabel}>Reste à payer</Text>
                  <Text style={styles.resteValue}>
                    {formatCurrency(getResteAPayer(ventes.find(v => v.id === selectedVente)!))}
                  </Text>
                </View>

                <Input
                  label="Montant du Paiement (FCFA) *"
                  placeholder="0"
                  value={montant}
                  onChangeText={setMontant}
                  keyboardType="numeric"
                />

                <Select
                  label="Méthode de Paiement"
                  value={methode}
                  onChange={(value) => setMethode(value as any)}
                  options={[
                    { label: 'Espèces', value: 'Espèces' },
                    { label: 'Mobile Money', value: 'Mobile Money' },
                    { label: 'Virement', value: 'Virement' },
                    { label: 'Autre', value: 'Autre' },
                  ]}
                />

                <Button
                  title="Enregistrer le Paiement"
                  onPress={handleAddPaiement}
                  variant="success"
                  fullWidth
                  style={styles.submitButton}
                />
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
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  totalCard: {
    backgroundColor: '#FFFBF0',
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 16,
  },
  totalContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  totalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  totalIcon: {
    width: 64,
    height: 64,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCard: {
    marginBottom: 16,
  },
  listContent: {
    padding: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  creditCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  creditContent: {
    padding: 16,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  creditClientPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  creditDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeCredit: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgePartiel: {
    backgroundColor: '#FFF9C4',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeTextCredit: {
    color: '#E65100',
  },
  statusBadgeTextPartiel: {
    color: '#F57F17',
  },
  creditDetails: {
    marginBottom: 16,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  creditRowLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  creditRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  creditRowValueReste: {
    color: Colors.warning,
    fontSize: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray,
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  paymentButton: {
    marginTop: 8,
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
    maxHeight: '80%',
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
  modalScroll: {
    padding: 20,
  },
  resteCard: {
    backgroundColor: Colors.gray,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  resteLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resteValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.secondary,
  },
  submitButton: {
    marginTop: 8,
  },
});
