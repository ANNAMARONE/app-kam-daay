import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Calculatrice } from './Calculatrice';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';

const CATEGORIES = [
  'Achat de Marchandises',
  'Transport',
  'Loyer',
  'Électricité',
  'Eau',
  'Téléphone/Internet',
  'Salaires',
  'Marketing',
  'Fournitures',
  'Autre'
];

const CATEGORY_ICONS: { [key: string]: string } = {
  'Achat de Marchandises': 'cart',
  'Transport': 'car',
  'Loyer': 'home',
  'Électricité': 'flash',
  'Eau': 'water',
  'Téléphone/Internet': 'call',
  'Salaires': 'people',
  'Marketing': 'megaphone',
  'Fournitures': 'archive',
  'Autre': 'ellipsis-horizontal'
};

export default function DepensesPage() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { depenses, ventes, addDepense, deleteDepense } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [expandedDepense, setExpandedDepense] = useState<number | null>(null);
  
  // Form state
  const [categorie, setCategorie] = useState('');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculer le bénéfice
  const totalRevenu = ventes.reduce((sum, v) => sum + v.total, 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const benefice = totalRevenu - totalDepenses;

  // Dépenses par catégorie
  const depensesParCategorie = depenses.reduce((acc: any, dep) => {
    if (!acc[dep.categorie]) {
      acc[dep.categorie] = 0;
    }
    acc[dep.categorie] += dep.montant;
    return acc;
  }, {});

  const handleSubmit = async () => {
    if (!categorie || !montant || !description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Montant invalide');
      return;
    }

    try {
      await addDepense({
        categorie,
        montant: montantNum,
        description,
        date: new Date(date).getTime()
      });

      alert('✅ Dépense enregistrée avec succès');
      setIsFormOpen(false);
      setCategorie('');
      setMontant('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      alert('❌ Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        await deleteDepense(id);
        alert('✅ Dépense supprimée');
      } catch (error) {
        alert('❌ Erreur lors de la suppression');
      }
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dépenses</Text>
            <View style={styles.headerIcon}>
              <Ionicons name="trending-down" size={28} color={Colors.white} />
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Suivez vos dépenses et bénéfices</Text>
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
          {/* Bénéfice Net - Card principale */}
          <Card style={[styles.beneficeCard, benefice >= 0 ? styles.beneficeCardPositive : styles.beneficeCardNegative]}>
            <CardContent style={styles.beneficeContent}>
              <View style={styles.beneficeLeft}>
                <View style={[styles.beneficeIconLarge, benefice >= 0 ? styles.beneficeIconPositive : styles.beneficeIconNegative]}>
                  <Ionicons 
                    name={benefice >= 0 ? "trending-up" : "trending-down"} 
                    size={36} 
                    color={Colors.white} 
                  />
                </View>
                <View style={styles.beneficeInfo}>
                  <Text style={styles.beneficeLabel}>Bénéfice Net</Text>
                  <Text style={[styles.beneficeValue, benefice < 0 && styles.beneficeValueNegative]}>
                    {formatCurrency(benefice)}
                  </Text>
                  <Text style={styles.beneficeSubtitle}>Revenus - Dépenses</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{formatCurrency(totalRevenu)}</Text>
                <Text style={styles.statLabel}>Revenus</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="wallet-outline" size={20} color="#F44336" />
                </View>
                <Text style={styles.statValue}>{formatCurrency(totalDepenses)}</Text>
                <Text style={styles.statLabel}>Dépenses</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="list-outline" size={20} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>{depenses.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Top Catégories */}
        {Object.keys(depensesParCategorie).length > 0 && (
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pie-chart" size={20} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Top Catégories</Text>
            </View>
            
            {Object.entries(depensesParCategorie)
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 5)
              .map(([cat, montant]: any, index) => {
                const percentage = (montant / totalDepenses) * 100;
                return (
                  <Card key={index} style={styles.categoryCard}>
                    <CardContent style={styles.categoryContent}>
                      <View style={styles.categoryLeft}>
                        <View style={styles.categoryIconBox}>
                          <Ionicons 
                            name={CATEGORY_ICONS[cat] as any || 'ellipsis-horizontal'} 
                            size={22} 
                            color={Colors.error} 
                          />
                        </View>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>{cat}</Text>
                          <View style={styles.categoryProgressBar}>
                            <View style={[styles.categoryProgressFill, { width: `${percentage}%` }]} />
                          </View>
                        </View>
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={styles.categoryValue}>{formatCurrency(montant)}</Text>
                        <Text style={styles.categoryPercentage}>{percentage.toFixed(0)}%</Text>
                      </View>
                    </CardContent>
                  </Card>
                );
              })}
          </View>
        )}

        {/* Bouton Ajouter */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsFormOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addButtonContent}>
            <View style={styles.addButtonIcon}>
              <Ionicons name="add" size={24} color={Colors.white} />
            </View>
            <Text style={styles.addButtonText}>Ajouter une Dépense</Text>
          </View>
        </TouchableOpacity>

        {/* Liste des Dépenses */}
        {depenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={56} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Aucune dépense</Text>
              <Text style={styles.emptySubtitle}>
                Enregistrez vos dépenses pour suivre vos bénéfices
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Ionicons name="time-outline" size={20} color={Colors.secondary} />
              <Text style={styles.listTitle}>Historique</Text>
              <View style={styles.listBadge}>
                <Text style={styles.listBadgeText}>{depenses.length}</Text>
              </View>
            </View>

            {[...depenses]
              .sort((a, b) => b.date - a.date)
              .map((depense) => (
                <Card key={depense.id} style={styles.depenseCard}>
                  <CardContent style={styles.depenseContent}>
                    <TouchableOpacity
                      onPress={() => setExpandedDepense(expandedDepense === depense.id ? null : depense.id!)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.depenseHeader}>
                        <View style={styles.depenseLeft}>
                          <View style={styles.depenseIconBox}>
                            <Ionicons 
                              name={CATEGORY_ICONS[depense.categorie] as any || 'ellipsis-horizontal'} 
                              size={24} 
                              color={Colors.error} 
                            />
                          </View>
                          <View style={styles.depenseInfo}>
                            <View style={styles.depenseTags}>
                              <View style={styles.categoryTag}>
                                <Text style={styles.categoryTagText}>{depense.categorie}</Text>
                              </View>
                            </View>
                            <Text style={styles.depenseDescription} numberOfLines={expandedDepense === depense.id ? undefined : 1}>
                              {depense.description}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.depenseRight}>
                          <Text style={styles.depenseMontant}>{formatCurrency(depense.montant)}</Text>
                          <View style={styles.depenseDate}>
                            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.depenseDateText}>{formatDate(depense.date)}</Text>
                          </View>
                        </View>
                      </View>

                      {expandedDepense === depense.id && (
                        <View style={styles.depenseDetails}>
                          <View style={styles.depenseDetailRow}>
                            <View style={styles.depenseDetailItem}>
                              <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
                              <Text style={styles.depenseDetailLabel}>Date</Text>
                              <Text style={styles.depenseDetailValue}>{formatDate(depense.date)}</Text>
                            </View>
                            <View style={styles.depenseDetailItem}>
                              <Ionicons name="pricetag" size={16} color={Colors.textSecondary} />
                              <Text style={styles.depenseDetailLabel}>Catégorie</Text>
                              <Text style={styles.depenseDetailValue}>{depense.categorie}</Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            onPress={() => handleDelete(depense.id!)}
                            style={styles.deleteButton}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={18} color={Colors.white} />
                            <Text style={styles.deleteButtonText}>Supprimer</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  </CardContent>
                </Card>
              ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Formulaire */}
      <Modal
        visible={isFormOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFormOpen(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <TouchableOpacity onPress={() => setIsFormOpen(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={Colors.secondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nouvelle Dépense</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={[styles.modalScrollContent, { paddingBottom: insets.bottom + 20 }]}
              showsVerticalScrollIndicator={false}
            >
              <Card style={styles.formCard}>
                <CardContent style={styles.formContent}>
                  <Select
                    label="Catégorie *"
                    value={categorie}
                    onChange={setCategorie}
                    options={CATEGORIES.map(cat => ({ label: cat, value: cat }))}
                    placeholder="Sélectionner une catégorie"
                  />

                  <View style={styles.inputWithButton}>
                    <Input
                      label="Montant (FCFA) *"
                      placeholder="0"
                      value={montant}
                      onChangeText={setMontant}
                      keyboardType="numeric"
                      containerStyle={styles.flexInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCalculator(true)}
                      style={styles.calcButton}
                    >
                      <Ionicons name="calculator" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <Input
                    label="Date *"
                    placeholder="YYYY-MM-DD"
                    value={date}
                    onChangeText={setDate}
                  />

                  <Input
                    label="Description *"
                    placeholder="Décrivez la dépense..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.formActions}>
                    <Button
                      title="Annuler"
                      onPress={() => setIsFormOpen(false)}
                      variant="outline"
                      style={styles.formButton}
                    />
                    <Button
                      title="Enregistrer"
                      onPress={handleSubmit}
                      variant="primary"
                      style={styles.formButton}
                    />
                  </View>
                </CardContent>
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Calculatrice
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
        onUseValue={(value) => setMontant(value.toString())}
      />
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
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 52,
  },

  // ===== CONTENT =====
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },

  // ===== STATS =====
  statsContainer: {
    gap: 12,
  },
  beneficeCard: {
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  beneficeCardPositive: {
    backgroundColor: '#E8F5E9',
  },
  beneficeCardNegative: {
    backgroundColor: '#FFEBEE',
  },
  beneficeContent: {
    padding: 20,
  },
  beneficeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  beneficeIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  beneficeIconPositive: {
    backgroundColor: Colors.accent,
  },
  beneficeIconNegative: {
    backgroundColor: Colors.error,
  },
  beneficeInfo: {
    flex: 1,
  },
  beneficeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  beneficeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 4,
  },
  beneficeValueNegative: {
    color: Colors.error,
  },
  beneficeSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ===== CATEGORIES =====
  categoriesSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 6,
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: Colors.error,
    borderRadius: 3,
  },
  categoryRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // ===== ADD BUTTON =====
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  addButtonIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },

  // ===== LIST =====
  listSection: {
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    flex: 1,
  },
  listBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 20,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.gray + '30',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ===== DEPENSE CARD =====
  depenseCard: {
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  depenseContent: {
    padding: 16,
  },
  depenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  depenseLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  depenseIconBox: {
    width: 48,
    height: 48,
    backgroundColor: Colors.error + '15',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  depenseInfo: {
    flex: 1,
  },
  depenseTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  categoryTag: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  depenseDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  depenseRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  depenseMontant: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 4,
  },
  depenseDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  depenseDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Details
  depenseDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  depenseDetailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  depenseDetailItem: {
    flex: 1,
    backgroundColor: Colors.gray + '20',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  depenseDetailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  depenseDetailValue: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    padding: 12,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  // ===== MODAL =====
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  modalContent: {
    flex: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formContent: {
    padding: 20,
    gap: 16,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  flexInput: {
    flex: 1,
  },
  calcButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
  },
});