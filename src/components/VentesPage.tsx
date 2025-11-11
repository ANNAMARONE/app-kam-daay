

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';
import { Article } from '../lib/database';
import { Calculatrice } from './Calculatrice';


// 🎨 Composants logos SVG
const WaveLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="48" fill="#00D4FF" />
    <Path
      d="M25 50 Q 35 35, 45 50 T 65 50 T 85 50"
      stroke="white"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M25 65 Q 35 50, 45 65 T 65 65 T 85 65"
      stroke="white"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
  </Svg>
);

const OrangeMoneyLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx="50" cy="50" r="48" fill="#FF8500" />
    <Circle cx="50" cy="50" r="28" fill="white" />
    <G transform="translate(50, 50)">
      <Path
        d="M-10,-5 L10,-5 L10,15 L-10,15 Z"
        fill="#FF8500"
      />
      <Path
        d="M-5,-10 L5,-10 L5,10 L-5,10 Z"
        fill="#FF8500"
      />
    </G>
  </Svg>
);

const FreeMoneyLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#0066CC" />
    <Rect x="30" y="20" width="40" height="60" rx="8" fill="white" />
    <Rect x="35" y="25" width="30" height="35" rx="4" fill="#0066CC" />
    <Circle cx="50" cy="72" r="3" fill="#0066CC" />
  </Svg>
);

const CashLogo = ({ size = 40 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect width="100" height="100" rx="20" fill="#4CAF50" />
    <Rect x="15" y="35" width="70" height="30" rx="5" fill="white" />
    <Circle cx="50" cy="50" r="10" fill="#4CAF50" />
    <Path
      d="M30 40 L30 35 M40 40 L40 35 M60 40 L60 35 M70 40 L70 35"
      stroke="#4CAF50"
      strokeWidth="3"
    />
  </Svg>
);

export default function VentesPage() {
  const navigation = useNavigation();
  const { clients, ventes, addVente } = useStore();
  
  // États du formulaire
  const [selectedClientId, setSelectedClientId] = useState('');
  const [articles, setArticles] = useState<Article[]>([{ nom: '', quantite: 1, prixUnitaire: 0 }]);
  const [statut, setStatut] = useState<'Payé' | 'Crédit' | 'Partiel'>('Payé');
  const [montantPaye, setMontantPaye] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorTarget, setCalculatorTarget] = useState<{ type: 'article' | 'paiement', index?: number } | null>(null);
  
  // 💰 Méthodes de paiement mobile - Ajout
  const [methodePaiement, setMethodePaiement] = useState<'especes' | 'wave' | 'orange_money' | 'free_money'>('especes');
  const [numeroTelPaiement, setNumeroTelPaiement] = useState('');

  // Clients récents (les 5 derniers utilisés)
  const recentClients = useMemo(() => {
    const clientsWithVentes = clients.map(client => {
      const clientVentes = ventes.filter(v => v.clientId === client.id);
      const lastVente = clientVentes.length > 0 
        ? Math.max(...clientVentes.map(v => v.date))
        : 0;
      return { ...client, lastVente, ventesCount: clientVentes.length };
    });

    return clientsWithVentes
      .filter(c => c.ventesCount > 0)
      .sort((a, b) => b.lastVente - a.lastVente)
      .slice(0, 5);
  }, [clients, ventes]);

  // Ventes récentes
  const recentVentes = useMemo(() => {
    return [...ventes]
      .sort((a, b) => b.date - a.date)
      .slice(0, 3);
  }, [ventes]);

  const clientOptions = clients.map(c => ({
    label: `${c.prenom} ${c.nom}`,
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

  const openCalculator = (type: 'article' | 'paiement', index?: number) => {
    setCalculatorTarget({ type, index });
    setShowCalculator(true);
  };

  const handleCalculatorResult = (value: number) => {
    if (calculatorTarget) {
      if (calculatorTarget.type === 'article' && calculatorTarget.index !== undefined) {
        updateArticle(calculatorTarget.index, 'prixUnitaire', value);
      } else if (calculatorTarget.type === 'paiement') {
        setMontantPaye(value.toString());
      }
    }
    setShowCalculator(false);
    setCalculatorTarget(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedClientId) {
      Toast.show({
        type: 'error',
        text1: 'Client requis',
        text2: 'Veuillez sélectionner un client',
      });
      return;
    }

    const validArticles = articles.filter(a => a.nom.trim() && a.quantite > 0 && a.prixUnitaire > 0);
    
    if (validArticles.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Articles requis',
        text2: 'Veuillez ajouter au moins un article valide',
      });
      return;
    }

    const total = calculateTotal();
    const montant = parseFloat(montantPaye) || 0;

    if (statut === 'Payé' && montant < total) {
      Toast.show({
        type: 'error',
        text1: 'Montant insuffisant',
        text2: 'Le montant payé doit être égal au total pour un paiement complet',
      });
      return;
    }

    if (montant > total) {
      Toast.show({
        type: 'error',
        text1: 'Montant invalide',
        text2: 'Le montant payé ne peut pas dépasser le total',
      });
      return;
    }

    try {
      await addVente({
        clientId: parseInt(selectedClientId),
        articles: validArticles,
        total,
        montantPaye: statut === 'Crédit' ? 0 : montant,
        statut,
        date: Date.now(),
      });

      Toast.show({
        type: 'success',
        text1: 'Vente enregistrée',
        text2: `Total: ${formatCurrency(total)}`,
      });
      
      // Reset form
      setSelectedClientId('');
      setArticles([{ nom: '', quantite: 1, prixUnitaire: 0 }]);
      setStatut('Payé');
      setMontantPaye('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'enregistrer la vente',
      });
    }
  };

  const selectRecentClient = (clientId: number) => {
    setSelectedClientId(clientId.toString());
    // 📞 Auto-remplir le numéro de téléphone du client
    const client = clients.find(c => c.id === clientId);
    if (client?.telephone) {
      setNumeroTelPaiement(client.telephone);
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.prenom} ${client.nom}` : 'Client inconnu';
  };

  const total = calculateTotal();
  const reste = statut === 'Crédit' ? total : total - (parseFloat(montantPaye) || 0);

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header avec Safe Area et effets */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerBgEffect2} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="cart" size={28} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>Nouvelle Vente</Text>
          </View>
          <Text style={styles.headerSubtitle}>Enregistrer une transaction</Text>
          
          {/* Bouton retour en absolu */}
          <TouchableOpacity 
            style={styles.backButtonHeader}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Clients Récents */}
        {recentClients.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>Clients Récents</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentClientsScroll}
            >
              {recentClients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.recentClientCard,
                    selectedClientId === client.id?.toString() && styles.recentClientCardActive
                  ]}
                  onPress={() => selectRecentClient(client.id!)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.recentClientAvatar,
                    selectedClientId === client.id?.toString() && styles.recentClientAvatarActive
                  ]}>
                    <Text style={styles.recentClientAvatarText}>
                      {client.prenom.charAt(0)}{client.nom.charAt(0)}
                    </Text>
                  </View>
                  <Text style={styles.recentClientName} numberOfLines={1}>
                    {client.prenom}
                  </Text>
                  <Text style={styles.recentClientCount}>
                    {client.ventesCount} vente{client.ventesCount > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sélection Client */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Client</Text>
            </View>
            <Select
              label="Sélectionner un client *"
              value={selectedClientId}
              onChange={(value) => {
                setSelectedClientId(value);
                // 📞 Auto-remplir le numéro de téléphone du client
                const client = clients.find(c => c.id?.toString() === value);
                if (client?.telephone) {
                  setNumeroTelPaiement(client.telephone);
                }
              }}
              options={clientOptions}
              placeholder="Choisir un client"
            />
          </CardContent>
        </Card>

        {/* Articles */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Articles</Text>
              <TouchableOpacity 
                onPress={addArticle} 
                style={styles.addArticleButton}
              >
                <Ionicons name="add-circle" size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {articles.map((article, index) => (
              <View key={index} style={styles.articleItem}>
                <View style={styles.articleHeader}>
                  <View style={styles.articleBadge}>
                    <Text style={styles.articleBadgeText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.articleLabel}>Article {index + 1}</Text>
                  {articles.length > 1 && (
                    <TouchableOpacity 
                      onPress={() => removeArticle(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <Input
                  placeholder="Nom de l'article (ex: Riz 50kg)"
                  value={article.nom}
                  onChangeText={(text) => updateArticle(index, 'nom', text)}
                  containerStyle={styles.inputContainer}
                />

                <View style={styles.articleRow}>
                  <Input
                    label="Quantité"
                    placeholder="1"
                    value={article.quantite.toString()}
                    onChangeText={(text) => updateArticle(index, 'quantite', parseInt(text) || 0)}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />

                  <View style={styles.halfInput}>
                    <Input
                      label="Prix Unitaire"
                      placeholder="0"
                      value={article.prixUnitaire.toString()}
                      onChangeText={(text) => updateArticle(index, 'prixUnitaire', parseFloat(text) || 0)}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      style={styles.calculatorButton}
                      onPress={() => openCalculator('article', index)}
                    >
                      <Ionicons name="calculator" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {article.quantite > 0 && article.prixUnitaire > 0 && (
                  <View style={styles.articleTotal}>
                    <Ionicons name="pricetag" size={16} color={Colors.textSecondary} />
                    <Text style={styles.articleTotalLabel}>Sous-total:</Text>
                    <Text style={styles.articleTotalValue}>
                      {formatCurrency(article.quantite * article.prixUnitaire)}
                    </Text>
                  </View>
                )}

                {index < articles.length - 1 && <View style={styles.articleDivider} />}
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Paiement */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Paiement</Text>
            </View>
            
            <Select
              label="Statut de Paiement"
              value={statut}
              onChange={(value) => {
                setStatut(value as any);
                if (value === 'Payé') {
                  setMontantPaye(total.toString());
                } else if (value === 'Crédit') {
                  setMontantPaye('0');
                }
              }}
              options={[
                { label: '✅ Payé Intégralement', value: 'Payé' },
                { label: '💰 Paiement Partiel', value: 'Partiel' },
                { label: '📝 À Crédit', value: 'Crédit' },
              ]}
            />

            {statut !== 'Crédit' && (
              <View>
                <View style={styles.inputWithButton}>
                  <Input
                    label="Montant Payé (FCFA)"
                    placeholder="0"
                    value={montantPaye}
                    onChangeText={setMontantPaye}
                    keyboardType="numeric"
                    containerStyle={{ flex: 1 }}
                  />
                  <TouchableOpacity
                    style={styles.calculatorButtonLarge}
                    onPress={() => openCalculator('paiement')}
                  >
                    <Ionicons name="calculator" size={24} color={Colors.white} />
                  </TouchableOpacity>
                </View>

                {reste > 0 && statut === 'Partiel' && (
                  <View style={styles.resteInfo}>
                    <Ionicons name="information-circle" size={20} color={Colors.error} />
                    <Text style={styles.resteText}>
                      Reste à payer: {formatCurrency(reste)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {statut === 'Crédit' && (
              <View style={styles.creditInfo}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.creditText}>
                  Le montant total sera ajouté au crédit du client
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 💰 Méthodes de Paiement Mobile */}
        {statut !== 'Crédit' && (
          <Card style={styles.section}>
            <CardContent style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <Ionicons name="phone-portrait" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Méthode de Paiement 💳</Text>
              </View>

              {/* Options de paiement */}
              <View style={styles.paymentOptionsGrid}>
                {/* Espèces */}
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    methodePaiement === 'especes' && styles.paymentOptionActive
                  ]}
                  onPress={() => setMethodePaiement('especes')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.paymentIcon,
                    { backgroundColor: '#4CAF5020' }
                  ]}>
                    <CashLogo size={32} />
                  </View>
                  <Text style={styles.paymentOptionLabel}>Espèces</Text>
                  {methodePaiement === 'especes' && (
                    <View style={styles.paymentCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Wave */}
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    methodePaiement === 'wave' && styles.paymentOptionActive
                  ]}
                  onPress={() => setMethodePaiement('wave')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.paymentIcon,
                    { backgroundColor: '#00D4FF20' }
                  ]}>
                    <WaveLogo size={32} />
                  </View>
                  <Text style={styles.paymentOptionLabel}>Wave</Text>
                  {methodePaiement === 'wave' && (
                    <View style={styles.paymentCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Orange Money */}
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    methodePaiement === 'orange_money' && styles.paymentOptionActive
                  ]}
                  onPress={() => setMethodePaiement('orange_money')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.paymentIcon,
                    { backgroundColor: '#FF850020' }
                  ]}>
                    <OrangeMoneyLogo size={32} />
                  </View>
                  <Text style={styles.paymentOptionLabel}>Orange Money</Text>
                  {methodePaiement === 'orange_money' && (
                    <View style={styles.paymentCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Free Money */}
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    methodePaiement === 'free_money' && styles.paymentOptionActive
                  ]}
                  onPress={() => setMethodePaiement('free_money')}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.paymentIcon,
                    { backgroundColor: '#0066CC20' }
                  ]}>
                    <FreeMoneyLogo size={32} />
                  </View>
                  <Text style={styles.paymentOptionLabel}>Free Money</Text>
                  {methodePaiement === 'free_money' && (
                    <View style={styles.paymentCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Champ numéro de téléphone si méthode mobile */}
              {methodePaiement !== 'especes' && (
                <View style={styles.phoneNumberSection}>
                  <Input
                    label={`Numéro ${methodePaiement === 'wave' ? 'Wave' : methodePaiement === 'orange_money' ? 'Orange Money' : 'Free Money'}`}
                    placeholder="77 123 45 67"
                    value={numeroTelPaiement}
                    onChangeText={setNumeroTelPaiement}
                    keyboardType="phone-pad"
                  />
                  <View style={styles.paymentInfo}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.paymentInfoText}>
                      Le numéro du client pour recevoir le paiement
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        )}

        {/* Récapitulatif */}
        <Card style={[styles.section, styles.summaryCard]}>
          <CardContent style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
            </View>
            {statut !== 'Crédit' && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payé</Text>
                  <Text style={styles.summaryValueSecondary}>
                    {formatCurrency(parseFloat(montantPaye) || 0)}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryRowFinal]}>
                  <Text style={styles.summaryLabelFinal}>
                    {reste > 0 ? 'Reste' : 'Rendu'}
                  </Text>
                  <Text style={[
                    styles.summaryValueFinal,
                    reste > 0 && { color: Colors.error }
                  ]}>
                    {formatCurrency(Math.abs(reste))}
                  </Text>
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          title="Enregistrer la Vente"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          icon="checkmark-circle"
          style={styles.submitButton}
        />

        {/* Ventes Récentes */}
        {recentVentes.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Dernières Ventes</Text>
            {recentVentes.map((vente, index) => (
              <Card key={vente.id || index} style={styles.historyCard}>
                <CardContent style={styles.historyContent}>
                  <View style={styles.historyLeft}>
                    <View style={[
                      styles.historyIcon,
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
                        size={20}
                        color={
                          vente.statut === 'Payé' ? Colors.accent :
                          vente.statut === 'Crédit' ? Colors.error :
                          '#FFA726'
                        }
                      />
                    </View>
                    <View>
                      <Text style={styles.historyClient}>
                        {getClientName(vente.clientId)}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(vente.date)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyAmount}>
                    {formatCurrency(vente.total || 0)}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Calculatrice */}
      <Modal
        visible={showCalculator}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalculator(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCalculator(false)}>
              <Ionicons name="close" size={28} color={Colors.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Calculatrice</Text>
            <View style={{ width: 28 }} />
          </View>
          <Calculatrice onResult={handleCalculatorResult} />
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
    paddingTop: 16,
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
  backButtonHeader: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
  scrollContent: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  recentClientsScroll: {
    gap: 12,
    paddingHorizontal: 4,
  },
  recentClientCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minWidth: 90,
  },
  recentClientCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBF0',
  },
  recentClientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentClientAvatarActive: {
    backgroundColor: Colors.primary,
  },
  recentClientAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  recentClientName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  recentClientCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 16,
    borderRadius: 20,
  },
  sectionContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    flex: 1,
  },
  addArticleButton: {
    padding: 4,
  },
  articleItem: {
    marginBottom: 12,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  articleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
  articleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 12,
  },
  articleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
    position: 'relative',
  },
  calculatorButton: {
    position: 'absolute',
    right: 8,
    top: 36,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFD70020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8BC34A15',
    padding: 12,
    borderRadius: 12,
  },
  articleTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  articleTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
  },
  articleDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  inputWithButton: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  calculatorButtonLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  resteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FF444415',
    borderRadius: 12,
  },
  resteText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFA72615',
    borderRadius: 12,
  },
  creditText: {
    flex: 1,
    fontSize: 13,
    color: '#F57C00',
  },
  summaryCard: {
    backgroundColor: '#FFFBF0',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  summaryContent: {
    padding: 20,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryRowFinal: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryValueSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryLabelFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  summaryValueFinal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.accent,
  },
  submitButton: {
    marginTop: 8,
    height: 64,
  },
  historySection: {
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  historyContent: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyClient: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
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
  paymentOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  paymentOption: {
    width: '47%',
    height: 110,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFBF0',
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  paymentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  paymentCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  phoneNumberSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  paymentInfoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});