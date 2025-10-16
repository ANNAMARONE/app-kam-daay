import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import Colors from '../constants/Colors';
import { formatCurrency } from '../lib/utils';
import { Article } from '../lib/database';

export default function VentesPage() {
  const { clients, addVente } = useStore();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [articles, setArticles] = useState<Article[]>([{ nom: '', quantite: 1, prixUnitaire: 0 }]);
  const [statut, setStatut] = useState<'Payé' | 'Crédit' | 'Partiel'>('Payé');
  const [montantPaye, setMontantPaye] = useState('');

  const clientOptions = clients.map(c => ({
    label: `${c.prenom} ${c.nom} - ${c.telephone}`,
    value: c.id!.toString(),
  }));

  const addArticle = () => {
    setArticles([...articles, { nom: '', quantite: 1, prixUnitaire: 0 }]);
  };

  const removeArticle = (index: number) => {
    if (articles.length > 1) {
      setArticles(articles.filter((_, i) => i !== index));
    }
  };

  const updateArticle = (index: number, field: keyof Article, value: string | number) => {
    const newArticles = [...articles];
    newArticles[index] = { ...newArticles[index], [field]: value };
    setArticles(newArticles);
  };

  const calculateTotal = () => {
    return articles.reduce((sum, article) => {
      return sum + (article.quantite * article.prixUnitaire);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      alert('Veuillez sélectionner un client');
      return;
    }

    const validArticles = articles.filter(a => a.nom && a.quantite > 0 && a.prixUnitaire > 0);
    
    if (validArticles.length === 0) {
      alert('Veuillez ajouter au moins un article valide');
      return;
    }

    const total = calculateTotal();
    const montant = parseFloat(montantPaye) || 0;

    if (statut !== 'Crédit' && montant > total) {
      alert('Le montant payé ne peut pas dépasser le total');
      return;
    }

    try {
      await addVente({
        clientId: parseInt(selectedClientId),
        articles: validArticles,
        total,
        montantPaye: montant,
        statut,
        date: Date.now(),
      });

      alert('Vente enregistrée avec succès');
      
      // Reset form
      setSelectedClientId('');
      setArticles([{ nom: '', quantite: 1, prixUnitaire: 0 }]);
      setStatut('Payé');
      setMontantPaye('');
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const total = calculateTotal();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="cart" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.headerTitle}>Nouvelle Vente</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.formContainer}>
        {/* Sélection Client */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Select
              label="Sélectionner un client *"
              value={selectedClientId}
              onChange={setSelectedClientId}
              options={clientOptions}
              placeholder="Choisir un client"
            />
          </CardContent>
        </Card>

        {/* Articles */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Articles</Text>
              <TouchableOpacity onPress={addArticle} style={styles.addArticleButton}>
                <Ionicons name="add-circle" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {articles.map((article, index) => (
              <View key={index} style={styles.articleItem}>
                <View style={styles.articleHeader}>
                  <Text style={styles.articleLabel}>Article {index + 1}</Text>
                  {articles.length > 1 && (
                    <TouchableOpacity onPress={() => removeArticle(index)}>
                      <Ionicons name="trash" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  placeholder="Nom de l'article"
                  value={article.nom}
                  onChangeText={(text) => updateArticle(index, 'nom', text)}
                />

                <View style={styles.articleRow}>
                  <Input
                    label="Quantité"
                    placeholder="0"
                    value={article.quantite.toString()}
                    onChangeText={(text) => updateArticle(index, 'quantite', parseInt(text) || 0)}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />

                  <Input
                    label="Prix Unitaire"
                    placeholder="0"
                    value={article.prixUnitaire.toString()}
                    onChangeText={(text) => updateArticle(index, 'prixUnitaire', parseFloat(text) || 0)}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                </View>

                <View style={styles.articleTotal}>
                  <Text style={styles.articleTotalLabel}>Sous-total:</Text>
                  <Text style={styles.articleTotalValue}>
                    {formatCurrency(article.quantite * article.prixUnitaire)}
                  </Text>
                </View>

                {index < articles.length - 1 && <View style={styles.articleDivider} />}
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Paiement */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Paiement</Text>
            
            <Select
              label="Statut de Paiement"
              value={statut}
              onChange={(value) => setStatut(value as any)}
              options={[
                { label: 'Payé Intégralement', value: 'Payé' },
                { label: 'Paiement Partiel', value: 'Partiel' },
                { label: 'À Crédit', value: 'Crédit' },
              ]}
            />

            {statut !== 'Crédit' && (
              <Input
                label="Montant Payé (FCFA)"
                placeholder="0"
                value={montantPaye}
                onChangeText={setMontantPaye}
                keyboardType="numeric"
              />
            )}
          </CardContent>
        </Card>

        {/* Total */}
        <Card style={StyleSheet.flatten([styles.section, styles.totalCard])}>
          <CardContent style={styles.totalContent}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          title="Enregistrer la Vente"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          icon={
            <View style={styles.submitIcon}>
              <Ionicons name="cart" size={20} color={Colors.white} />
            </View>
          }
          style={styles.submitButton}
        />
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
  formContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
  },
  sectionContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
  },
  addArticleButton: {
    padding: 4,
  },
  articleItem: {
    marginBottom: 16,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  articleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  articleTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  articleTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  articleTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  articleDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  totalCard: {
    backgroundColor: '#FFFBF0',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  totalContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  submitButton: {
    marginTop: 8,
    height: 64,
  },
  submitIcon: {
    width: 32,
    height: 32,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
