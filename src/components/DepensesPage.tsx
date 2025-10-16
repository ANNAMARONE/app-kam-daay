import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function DepensesPage() {
  const { depenses, ventes, addDepense, deleteDepense } = useStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
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

      alert('Dépense enregistrée');
      setIsFormOpen(false);
      setCategorie('');
      setMontant('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        await deleteDepense(id);
        alert('Dépense supprimée');
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  if (isFormOpen) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBgEffect} />
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="trending-down" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.headerTitle}>Nouvelle Dépense</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.formContainer}>
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
                placeholder="Date"
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

        <Calculatrice
          visible={showCalculator}
          onClose={() => setShowCalculator(false)}
          onUseValue={(value) => setMontant(value.toString())}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="trending-down" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.headerTitle}>Mes Dépenses</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* KPI Bénéfice */}
        <Card style={StyleSheet.flatten([styles.kpiCard, benefice >= 0 ? styles.kpiCardPositive : styles.kpiCardNegative])}>
          <CardContent style={styles.kpiContent}>
            <View style={styles.kpiInfo}>
              <Text style={styles.kpiLabel}>Bénéfice Net</Text>
              <Text style={[styles.kpiValue, benefice < 0 && styles.kpiValueNegative]}>
                {formatCurrency(benefice)}
              </Text>
              <Text style={styles.kpiSubtitle}>Revenus - Dépenses</Text>
            </View>
            <View style={styles.kpiIcon}>
              <Text style={styles.kpiEmoji}>💰</Text>
            </View>
          </CardContent>
        </Card>

        {/* KPIs Revenus/Dépenses */}
        <View style={styles.kpisRow}>
          <Card style={styles.miniKpiCard}>
            <CardContent style={styles.miniKpiContent}>
              <Text style={styles.miniKpiLabel}>Total Revenus</Text>
              <Text style={[styles.miniKpiValue, { color: Colors.accent }]}>
                {formatCurrency(totalRevenu)}
              </Text>
            </CardContent>
          </Card>

          <Card style={styles.miniKpiCard}>
            <CardContent style={styles.miniKpiContent}>
              <Text style={styles.miniKpiLabel}>Total Dépenses</Text>
              <Text style={[styles.miniKpiValue, { color: Colors.error }]}>
                {formatCurrency(totalDepenses)}
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Dépenses par Catégorie */}
        {Object.keys(depensesParCategorie).length > 0 && (
          <Card style={styles.categoryCard}>
            <CardContent style={styles.categoryContent}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetag" size={20} color={Colors.secondary} />
                <Text style={styles.sectionTitle}>Par Catégorie</Text>
              </View>
              {Object.entries(depensesParCategorie)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 5)
                .map(([cat, montant]: any, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <Text style={styles.categoryName}>{cat}</Text>
                    <Text style={styles.categoryValue}>{formatCurrency(montant)}</Text>
                  </View>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Bouton Ajouter */}
        <View style={styles.addButtonContainer}>
          <Button
            title="Ajouter une Dépense"
            onPress={() => setIsFormOpen(true)}
            variant="primary"
            fullWidth
            icon={<Ionicons name="add" size={20} color={Colors.white} />}
          />
        </View>

        {/* Liste des Dépenses */}
        {depenses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Ionicons name="trending-down" size={48} color={Colors.grayDark} />
              </View>
              <Text style={styles.emptyTitle}>Aucune dépense</Text>
              <Text style={styles.emptySubtitle}>
                Enregistrez vos dépenses pour suivre vos bénéfices
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.listTitle}>Historique</Text>
            {[...depenses]
              .sort((a, b) => b.date - a.date)
              .map((depense) => (
                <Card key={depense.id} style={styles.depenseCard}>
                  <CardContent style={styles.depenseContent}>
                    <View style={styles.depenseHeader}>
                      <View style={styles.depenseInfo}>
                        <View style={styles.depenseTags}>
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{depense.categorie}</Text>
                          </View>
                          <View style={styles.dateTag}>
                            <Ionicons name="calendar" size={12} color={Colors.textSecondary} />
                            <Text style={styles.dateTagText}>{formatDate(depense.date)}</Text>
                          </View>
                        </View>
                        <Text style={styles.depenseDescription}>{depense.description}</Text>
                        <Text style={styles.depenseMontant}>{formatCurrency(depense.montant)}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(depense.id!)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </CardContent>
                </Card>
              ))}
          </View>
        )}
      </ScrollView>
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
  formContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  formCard: {
    marginTop: 8,
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
  kpiCard: {
    marginBottom: 16,
  },
  kpiCardPositive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  kpiCardNegative: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: Colors.error,
  },
  kpiContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiInfo: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 4,
  },
  kpiValueNegative: {
    color: Colors.error,
  },
  kpiSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  kpiIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiEmoji: {
    fontSize: 32,
  },
  kpisRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniKpiCard: {
    flex: 1,
  },
  miniKpiContent: {
    padding: 16,
  },
  miniKpiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  miniKpiValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  categoryCard: {
    marginBottom: 16,
  },
  categoryContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  addButtonContainer: {
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
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
    textAlign: 'center',
  },
  depenseCard: {
    marginBottom: 12,
  },
  depenseContent: {
    padding: 16,
  },
  depenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  depenseInfo: {
    flex: 1,
  },
  depenseTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  depenseDescription: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  depenseMontant: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
  },
  deleteButton: {
    padding: 8,
  },
});
