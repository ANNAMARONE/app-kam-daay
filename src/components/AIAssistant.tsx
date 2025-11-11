/**
 * 🤖 Page Assistant IA - Insights et Recommandations Intelligentes
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '../constants/Colors';
import { Card, CardContent } from './ui/Card';
import {
  aiAssistant,
  ClientRiskScore,
  SmartReminder,
  BusinessInsight,
  SalesForecast,
  ClientVIPScore,
  BusinessCoaching,
} from '../lib/ai-assistant';

type TabType = 'coach' | 'previsions' | 'vip' | 'insights' | 'risques' | 'relances';

export default function AIAssistant() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('coach');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [riskScores, setRiskScores] = useState<ClientRiskScore[]>([]);
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [forecast, setForecast] = useState<SalesForecast | null>(null);
  const [vipScores, setVipScores] = useState<ClientVIPScore[]>([]);
  const [coaching, setCoaching] = useState<BusinessCoaching | null>(null);

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      const [scores, remindersList, insightsList, forecastData, vipData, coachingData] = await Promise.all([
        aiAssistant.calculateCreditRiskScores(),
        aiAssistant.getSmartReminders(),
        aiAssistant.getBusinessInsights(),
        aiAssistant.getSalesForecast(),
        aiAssistant.getClientVIPScores(),
        aiAssistant.getBusinessCoaching(),
      ]);

      setRiskScores(scores);
      setReminders(remindersList);
      setInsights(insightsList);
      setForecast(forecastData);
      setVipScores(vipData);
      setCoaching(coachingData);
    } catch (error) {
      console.error('Erreur chargement IA:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAIData();
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const openWhatsApp = (phoneNumber: string, message: string) => {
    // Vérifier que le numéro existe
    if (!phoneNumber || phoneNumber.trim() === '') {
      console.warn('Numéro de téléphone manquant');
      return;
    }
    
    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
    
    // Vérifier que le numéro nettoyé n'est pas vide
    if (cleanPhone === '') {
      console.warn('Numéro de téléphone invalide');
      return;
    }
    
    // Encoder le message pour l'URL
    const encodedMessage = encodeURIComponent(message);
    
    // URL WhatsApp avec le numéro et le message
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
    
    // Ouvrir WhatsApp
    Linking.openURL(whatsappUrl).catch(() => {
      // Si WhatsApp n'est pas installé, afficher une alerte ou utiliser la version web
      const webUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      Linking.openURL(webUrl);
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platine': return ['#E8E8E8', '#A0A0A0'];
      case 'or': return ['#FFD700', '#FFA500'];
      case 'argent': return ['#C0C0C0', '#808080'];
      case 'bronze': return ['#CD7F32', '#8B4513'];
      default: return ['#E0E0E0', '#BDBDBD'];
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platine': return 'diamond';
      case 'or': return 'trophy';
      case 'argent': return 'medal';
      case 'bronze': return 'ribbon';
      default: return 'person';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case 'platine': return '💎';
      case 'or': return '🏆';
      case 'argent': return '🥈';
      case 'bronze': return '🥉';
      default: return '⭐';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header avec Safe Area et effets */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerBgEffect} />
          <View style={styles.headerBgEffect2} />
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerIcon}>
                <Ionicons name="bulb" size={28} color={Colors.white} />
              </View>
              <Text style={styles.headerTitle}>Assistant IA</Text>
            </View>
            <Text style={styles.headerSubtitle}>Analyse intelligente</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Analyse en cours...</Text>
            <Text style={styles.loadingSubtext}>Traitement des données</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header avec Safe Area et effets */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerBgEffect2} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="bulb" size={28} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>🤖 Assistant IA</Text>
          </View>
          <Text style={styles.headerSubtitle}>Insights intelligents • {vipScores.filter(v => v.tier === 'platine' || v.tier === 'or').length} clients VIP</Text>
          
          {/* Bouton refresh en absolu */}
          <TouchableOpacity 
            style={styles.refreshButtonHeader}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs améliorés */}
      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'coach' && styles.tabActive]}
            onPress={() => setActiveTab('coach')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconContainer, activeTab === 'coach' && styles.tabIconActive]}>
              <Ionicons name="school" size={22} color={activeTab === 'coach' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[styles.tabText, activeTab === 'coach' && styles.tabTextActive]}>Coach</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'previsions' && styles.tabActive]}
            onPress={() => setActiveTab('previsions')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconContainer, activeTab === 'previsions' && styles.tabIconActive]}>
              <Ionicons name="trending-up" size={22} color={activeTab === 'previsions' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[styles.tabText, activeTab === 'previsions' && styles.tabTextActive]}>Prévisions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'vip' && styles.tabActive]}
            onPress={() => setActiveTab('vip')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconContainer, activeTab === 'vip' && styles.tabIconActive]}>
              <Ionicons name="star" size={22} color={activeTab === 'vip' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[styles.tabText, activeTab === 'vip' && styles.tabTextActive]}>VIP</Text>
            {vipScores.filter(v => v.tier === 'platine' || v.tier === 'or').length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{vipScores.filter(v => v.tier === 'platine' || v.tier === 'or').length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
            onPress={() => setActiveTab('insights')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconContainer, activeTab === 'insights' && styles.tabIconActive]}>
              <Ionicons name="bulb" size={22} color={activeTab === 'insights' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>Insights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'risques' && styles.tabActive]}
            onPress={() => setActiveTab('risques')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconContainer, activeTab === 'risques' && styles.tabIconActive]}>
              <Ionicons name="warning" size={22} color={activeTab === 'risques' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[styles.tabText, activeTab === 'risques' && styles.tabTextActive]}>Risques</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'relances' && styles.tabActive]}
            onPress={() => setActiveTab('relances')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabIconContainer, activeTab === 'relances' && styles.tabIconActive]}>
              <Ionicons name="chatbubbles" size={22} color={activeTab === 'relances' ? Colors.white : Colors.primary} />
            </View>
            <Text style={[styles.tabText, activeTab === 'relances' && styles.tabTextActive]}>Relances</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ONGLET COACH */}
        {activeTab === 'coach' && coaching && (
          <View style={styles.section}>
            {/* Conseil du jour - PREMIUM */}
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCard}
            >
              <View style={styles.premiumCardContent}>
                <View style={styles.premiumIconContainer}>
                  <Text style={styles.premiumEmoji}>{coaching.dailyTip.emoji}</Text>
                </View>
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>{coaching.dailyTip.title}</Text>
                  <Text style={styles.premiumText}>{coaching.dailyTip.message}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Insights hebdomadaires */}
            <Text style={styles.sectionTitle}>📊 Cette semaine</Text>
            <Card style={styles.card}>
              <CardContent style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <View style={styles.statIconBox}>
                    <Ionicons name="calendar" size={20} color={Colors.accent} />
                  </View>
                  <Text style={styles.statLabel}>Meilleur jour</Text>
                  <Text style={styles.statValue}>{coaching.weeklyInsights.bestDay}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.statIconBox}>
                    <Ionicons name="person" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.statLabel}>Top client</Text>
                  <Text style={styles.statValue}>{coaching.weeklyInsights.topClient}</Text>
                </View>
              </CardContent>
            </Card>

            {/* Opportunités */}
            {coaching.opportunities.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>💡 Opportunités</Text>
                {coaching.opportunities.map((opp, idx) => (
                  <Card key={idx} style={styles.card}>
                    <CardContent style={styles.cardContent}>
                      <LinearGradient
                        colors={['#8BC34A', '#4CAF50']}
                        style={styles.gradientIcon}
                      >
                        <Ionicons name="gift" size={26} color={Colors.white} />
                      </LinearGradient>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>{opp.clientName}</Text>
                        <Text style={styles.cardText}>{opp.message}</Text>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Alertes */}
            {coaching.warnings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⚠️ Alertes importantes</Text>
                {coaching.warnings.map((warning, idx) => (
                  <Card key={idx} style={[styles.card, styles.warningCard]}>
                    <CardContent style={styles.cardContent}>
                      <View style={styles.warningIconContainer}>
                        <Ionicons name="alert-circle" size={28} color={Colors.error} />
                      </View>
                      <View style={styles.cardTextContainer}>
                        <Text style={styles.cardText}>{warning.message}</Text>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </View>
        )}

        {/* ONGLET PRÉVISIONS */}
        {activeTab === 'previsions' && forecast && (
          <View style={styles.section}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.forecastCard}
            >
              <Text style={styles.forecastCardTitle}>🔮 Prévisions du mois</Text>
              
              <View style={styles.forecastMainStat}>
                <Text style={styles.forecastMainLabel}>Prévision fin de mois</Text>
                <Text style={styles.forecastMainValue}>
                  {new Intl.NumberFormat('fr-FR').format(forecast.prediction.estimatedTotal)} CFA
                </Text>
                <View style={styles.growthBadge}>
                  <Ionicons 
                    name={forecast.prediction.growthVsLastMonth > 0 ? "trending-up" : "trending-down"} 
                    size={16} 
                    color={Colors.white} 
                  />
                  <Text style={styles.growthText}>
                    {forecast.prediction.growthVsLastMonth > 0 ? '+' : ''}{forecast.prediction.growthVsLastMonth.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View style={styles.forecastStats}>
                <View style={styles.forecastStatItem}>
                  <Text style={styles.forecastStatLabel}>Ventes actuelles</Text>
                  <Text style={styles.forecastStatValue}>
                    {new Intl.NumberFormat('fr-FR').format(forecast.currentMonth.total)} CFA
                  </Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(forecast.currentMonth.daysElapsed / (forecast.currentMonth.daysElapsed + forecast.currentMonth.daysRemaining)) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {forecast.currentMonth.daysElapsed} jours • {forecast.currentMonth.daysRemaining} jours restants
                </Text>
              </View>
            </LinearGradient>

            <Card style={styles.card}>
              <CardContent>
                <View style={styles.messageContainer}>
                  <Text style={styles.messageTitle}>💬 Message IA</Text>
                  <Text style={styles.messageText}>{forecast.prediction.message}</Text>
                </View>
                <View style={styles.recommendationBox}>
                  <Ionicons name="bulb" size={22} color={Colors.primary} />
                  <Text style={styles.recommendationText}>{forecast.recommendation}</Text>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ONGLET VIP - PREMIUM */}
        {activeTab === 'vip' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Programme Fidélité VIP</Text>
            {vipScores.length === 0 ? (
              <Card style={styles.card}>
                <CardContent style={styles.emptyContent}>
                  <Text style={styles.emptyEmoji}>👥</Text>
                  <Text style={styles.emptyText}>Aucun client pour le moment</Text>
                  <Text style={styles.emptySubtext}>Les clients apparaîtront ici</Text>
                </CardContent>
              </Card>
            ) : (
              vipScores.map((vip) => (
                <Card key={vip.clientId} style={styles.vipCard}>
                  <CardContent>
                    <View style={styles.vipHeader}>
                      <LinearGradient
                        colors={getTierColor(vip.tier)}
                        style={styles.tierBadge}
                      >
                        <Text style={styles.tierEmoji}>{getTierEmoji(vip.tier)}</Text>
                      </LinearGradient>
                      <View style={styles.vipInfo}>
                        <Text style={styles.vipName}>{vip.clientName}</Text>
                        <View style={styles.vipTierRow}>
                          <Text style={styles.vipTier}>{vip.tier.toUpperCase()}</Text>
                          <View style={styles.scoreBadge}>
                            <Ionicons name="star" size={12} color={Colors.primary} />
                            <Text style={styles.scoreText}>{vip.score}/100</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.vipStats}>
                      <View style={styles.vipStatBox}>
                        <Ionicons name="wallet" size={18} color={Colors.primary} />
                        <Text style={styles.vipStatLabel}>Total dépensé</Text>
                        <Text style={styles.vipStatValue}>{new Intl.NumberFormat('fr-FR').format(vip.totalSpent)} CFA</Text>
                      </View>
                      <View style={styles.vipStatBox}>
                        <Ionicons name="cart" size={18} color={Colors.accent} />
                        <Text style={styles.vipStatLabel}>Achats</Text>
                        <Text style={styles.vipStatValue}>{vip.nbPurchases}</Text>
                      </View>
                      <View style={styles.vipStatBox}>
                        <Ionicons name="trending-up" size={18} color={Colors.secondary} />
                        <Text style={styles.vipStatLabel}>Panier moyen</Text>
                        <Text style={styles.vipStatValue}>{new Intl.NumberFormat('fr-FR').format(vip.avgPurchase)} CFA</Text>
                      </View>
                    </View>

                    <View style={styles.benefitsContainer}>
                      <Text style={styles.benefitsTitle}>✨ Avantages</Text>
                      {vip.benefits.map((benefit, idx) => (
                        <View key={idx} style={styles.benefitRow}>
                          <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
                          <Text style={styles.benefit}>{benefit}</Text>
                        </View>
                      ))}
                    </View>

                    {vip.tier !== 'platine' && (
                      <View style={styles.nextTier}>
                        <Text style={styles.nextTierLabel}>Progression vers {vip.nextTierName}</Text>
                        <View style={styles.tierProgressBar}>
                          <LinearGradient
                            colors={[Colors.primary, Colors.accent]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.tierProgressFill, { width: `${(vip.score / vip.nextTierScore) * 100}%` }]}
                          />
                        </View>
                        <Text style={styles.nextTierText}>
                          Plus que {vip.nextTierScore - vip.score} points !
                        </Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ONGLETS EXISTANTS - Style amélioré */}
        {activeTab === 'insights' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Insights Business</Text>
            {insights.length === 0 ? (
              <Card style={styles.card}>
                <CardContent style={styles.emptyContent}>
                  <Text style={styles.emptyEmoji}>✨</Text>
                  <Text style={styles.emptyText}>Tout va bien !</Text>
                  <Text style={styles.emptySubtext}>Aucun conseil spécifique</Text>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight, idx) => (
                <Card key={idx} style={styles.card}>
                  <CardContent style={styles.cardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${Colors.primary}15` }]}>
                      <Ionicons name="bulb" size={26} color={Colors.primary} />
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text style={styles.cardTitle}>{insight.title}</Text>
                      <Text style={styles.cardText}>{insight.message}</Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'risques' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Analyse des Risques</Text>
            {riskScores.length === 0 ? (
              <Card style={styles.card}>
                <CardContent style={styles.emptyContent}>
                  <Text style={styles.emptyEmoji}>✅</Text>
                  <Text style={styles.emptyText}>Aucun crédit actif</Text>
                  <Text style={styles.emptySubtext}>Tous les clients sont à jour</Text>
                </CardContent>
              </Card>
            ) : (
              riskScores.map((risk) => (
                <Card key={risk.clientId} style={styles.card}>
                  <CardContent>
                    <View style={styles.riskHeader}>
                      <Text style={styles.cardTitle}>{risk.clientName}</Text>
                      <View style={[styles.riskBadge, { 
                        backgroundColor: risk.riskLevel === 'high' ? Colors.error : risk.riskLevel === 'medium' ? '#FFA726' : Colors.accent 
                      }]}>
                        <Text style={styles.riskBadgeText}>
                          {risk.riskLevel === 'high' ? 'ÉLEVÉ' : risk.riskLevel === 'medium' ? 'MOYEN' : 'FAIBLE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.riskScore}>Score: {risk.score.toFixed(0)}/100</Text>
                    <View style={styles.reasonsContainer}>
                      {risk.reasons.map((reason, idx) => (
                        <Text key={idx} style={styles.reasonText}>• {reason}</Text>
                      ))}
                    </View>
                    <View style={styles.recommendationBox}>
                      <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
                      <Text style={styles.recommendationText}>{risk.recommendation}</Text>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'relances' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Relances Intelligentes</Text>
            {reminders.length === 0 ? (
              <Card style={styles.card}>
                <CardContent style={styles.emptyContent}>
                  <Text style={styles.emptyEmoji}>🎉</Text>
                  <Text style={styles.emptyText}>Aucune relance nécessaire</Text>
                  <Text style={styles.emptySubtext}>Tous les clients sont à jour</Text>
                </CardContent>
              </Card>
            ) : (
              reminders.map((reminder) => (
                <Card key={reminder.clientId} style={styles.card}>
                  <CardContent>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderIconBox}>
                        <Ionicons name="person" size={24} color={Colors.primary} />
                      </View>
                      <View style={styles.reminderInfo}>
                        <Text style={styles.cardTitle}>{reminder.clientName}</Text>
                        <Text style={styles.reminderAmount}>
                          {new Intl.NumberFormat('fr-FR').format(reminder.montant)} CFA
                        </Text>
                        <Text style={styles.reminderDays}>
                          {reminder.daysSinceLastPayment} jours • {reminder.bestTimeToContact}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.messageBox}>
                      <Text style={styles.messageBoxLabel}>📱 Message suggéré</Text>
                      <Text style={styles.messageText}>{reminder.messageTemplate}</Text>
                    </View>
                    
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => copyToClipboard(reminder.messageTemplate)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={[Colors.primary, Colors.accent]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="copy-outline" size={20} color={Colors.white} />
                          <Text style={styles.actionButtonText}>Copier</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openWhatsApp(reminder.phoneNumber, reminder.messageTemplate)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#25D366', '#128C7E']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
                          <Text style={styles.actionButtonText}>WhatsApp</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
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
  refreshButtonHeader: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  tabsWrapper: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBED',
  },
  tabsContainer: {
    backgroundColor: Colors.white,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    position: 'relative',
    minWidth: 85,
  },
  tabActive: {
    backgroundColor: `${Colors.secondary}15`,
  },
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tabIconActive: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  premiumCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumCardContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
    alignItems: 'flex-start',
  },
  premiumIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumEmoji: {
    fontSize: 32,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  premiumText: {
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  warningIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: `${Colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forecastCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  forecastCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  forecastMainStat: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forecastMainLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  forecastMainValue: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  growthText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  forecastStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  forecastStatItem: {
    alignItems: 'center',
  },
  forecastStatLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 6,
  },
  forecastStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.secondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  vipCard: {
    borderRadius: 18,
    backgroundColor: Colors.white,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#F5F7FA',
  },
  vipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  tierBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tierEmoji: {
    fontSize: 36,
  },
  vipInfo: {
    flex: 1,
  },
  vipName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  vipTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vipTier: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  vipStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  vipStatBox: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  vipStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 4,
    textAlign: 'center',
  },
  vipStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  benefit: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  nextTier: {
    backgroundColor: `${Colors.accent}08`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.accent}20`,
  },
  nextTierLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 10,
    textAlign: 'center',
  },
  tierProgressBar: {
    height: 8,
    backgroundColor: '#E8EBED',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextTierText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyContent: {
    padding: 50,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  riskScore: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  reasonsContainer: {
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 6,
  },
  reminderHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  reminderIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.error,
    marginVertical: 4,
  },
  reminderDays: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  messageBox: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  messageBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});