import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useStore } from '../lib/store';

import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate, calculateDailyTotal, calculateWeeklyTotal } from '../lib/utils';
import ClientForm from './ClientForm';

export default function Dashboard() {
  console.log('🏠 Dashboard: Rendu commencé');
  const navigation = useNavigation();
  console.log('🏠 Dashboard: navigation =', navigation ? 'OK' : 'NULL');

  const { ventes, clients, paiements, loadData } = useStore();
  const [showClientModal, setShowClientModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculer les statistiques avec comparaison
  const stats = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    // Ventes par période
    const dailyTotal = calculateDailyTotal(ventes);
    const previousDayTotal = ventes
      .filter(v => v.date >= oneDayAgo - 24 * 60 * 60 * 1000 && v.date < oneDayAgo)
      .reduce((sum, v) => sum + (v.total || 0), 0);
    
    const weeklyTotal = calculateWeeklyTotal(ventes);
    const previousWeekTotal = ventes
      .filter(v => v.date >= twoWeeksAgo && v.date < oneWeekAgo)
      .reduce((sum, v) => sum + (v.total || 0), 0);

    const monthlyTotal = ventes
      .filter(v => {
        const venteDate = new Date(v.date);
        const nowDate = new Date();
        return venteDate.getMonth() === nowDate.getMonth() && 
               venteDate.getFullYear() === nowDate.getFullYear();
      })
      .reduce((sum, v) => sum + (v.total || 0), 0);

    const previousMonthTotal = ventes
      .filter(v => v.date >= sixtyDaysAgo && v.date < thirtyDaysAgo)
      .reduce((sum, v) => sum + (v.total || 0), 0);

    // Calcul des variations en %
    const dailyChange = previousDayTotal > 0 
      ? ((dailyTotal - previousDayTotal) / previousDayTotal) * 100 
      : dailyTotal > 0 ? 100 : 0;
    
    const weeklyChange = previousWeekTotal > 0 
      ? ((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100 
      : weeklyTotal > 0 ? 100 : 0;

    const monthlyChange = previousMonthTotal > 0 
      ? ((monthlyTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : monthlyTotal > 0 ? 100 : 0;

    // Total des crédits avec détails
    const creditVentes = ventes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel');
    const totalVentes = ventes.reduce((sum, v) => sum + (v.total || 0), 0);
    const totalPaiements = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
    const totalMontantPaye = ventes.reduce((sum, v) => sum + (v.montantPaye || 0), 0);
    const totalCredits = totalVentes - totalPaiements - totalMontantPaye;
    const nbCredits = creditVentes.length;

    // 🐛 FIX: Calculer les clients actifs basé sur les ventes des 30 derniers jours
    const clientsWithRecentVentes = new Set(
      ventes
        .filter(v => v.date >= thirtyDaysAgo)
        .map(v => v.clientId)
    );
    const activeClients = clientsWithRecentVentes.size;

    // Clients VIP (>3 ventes et total >50000 CFA)
    const clientsVIP = clients.filter(c => {
      const clientVentes = ventes.filter(v => v.clientId === c.id);
      const totalClient = clientVentes.reduce((sum, v) => sum + (v.total || 0), 0);
      return clientVentes.length >= 3 && totalClient >= 50000;
    });

    // Top 3 clients
    const topClients = clients
      .map(c => {
        const clientVentes = ventes.filter(v => v.clientId === c.id);
        const totalClient = clientVentes.reduce((sum, v) => sum + (v.total || 0), 0);
        return { ...c, total: totalClient, nbVentes: clientVentes.length };
      })
      .filter(c => c.nbVentes > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // Dernières ventes
    const recentVentes = [...ventes]
      .sort((a, b) => b.date - a.date)
      .slice(0, 2); // Limité à 2 ventes les plus récentes

    // Objectif mensuel (fixe à 500,000 CFA pour l'exemple)
    const objectifMensuel = 500000;
    const progressionObjectif = (monthlyTotal / objectifMensuel) * 100;

    // Mini graphique des 7 derniers jours
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = now - (6 - i) * 24 * 60 * 60 * 1000;
      const dayStart = new Date(date).setHours(0, 0, 0, 0);
      const dayEnd = new Date(date).setHours(23, 59, 59, 999);
      const total = ventes
        .filter(v => v.date >= dayStart && v.date <= dayEnd)
        .reduce((sum, v) => sum + (v.total || 0), 0);
      return total;
    });

    const maxLast7Days = Math.max(...last7Days, 1);

    return {
      dailyTotal,
      weeklyTotal,
      monthlyTotal,
      dailyChange,
      weeklyChange,
      monthlyChange,
      totalCredits,
      nbCredits,
      totalClients: clients.length,
      activeClients,
      clientsVIP: clientsVIP.length,
      topClients,
      totalVentes: ventes.length,
      recentVentes,
      objectifMensuel,
      progressionObjectif,
      last7Days,
      maxLast7Days,
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
    // ✅ MODIFIÉ : Utiliser navigation au lieu de openOverlay
    navigation.navigate('HistoriqueVentes' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
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
          {/* Ventes du Jour avec Tendance */}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                        {formatCurrency(stats.dailyTotal)}
                      </Text>
                      {stats.dailyChange !== 0 && (
                        <View style={[
                          styles.changeIndicator,
                          { backgroundColor: stats.dailyChange > 0 ? '#8BC34A20' : '#FF444420' }
                        ]}>
                          <Ionicons 
                            name={stats.dailyChange > 0 ? 'trending-up' : 'trending-down'}
                            size={14}
                            color={stats.dailyChange > 0 ? Colors.accent : Colors.error}
                          />
                          <Text style={[
                            styles.changeText,
                            { color: stats.dailyChange > 0 ? Colors.accent : Colors.error }
                          ]}>
                            {Math.abs(stats.dailyChange).toFixed(0)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Mini graphique 7 derniers jours */}
                <View style={styles.miniChart}>
                  {stats.last7Days.map((value, index) => {
                    const height = (value / stats.maxLast7Days) * 40 || 2;
                    return (
                      <View key={index} style={styles.miniChartBar}>
                        <View 
                          style={[
                            styles.miniChartBarFill,
                            { 
                              height,
                              backgroundColor: index === 6 ? Colors.primary : 'rgba(255, 215, 0, 0.3)'
                            }
                          ]} 
                        />
                      </View>
                    );
                  })}
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

        {/* Assistant IA - Nouveau */}
        <Animated.View 
          style={[
            styles.aiAssistantSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.aiAssistantCard}
            onPress={() => navigation.navigate('AIAssistant' as never)} // ✅ MODIFIÉ : Utiliser navigation
            activeOpacity={0.8}
          >
            <View style={styles.aiAssistantGradient}>
              <View style={styles.aiAssistantContent}>
                <View style={styles.aiAssistantIcon}>
                  <Text style={styles.aiAssistantEmoji}>🤖</Text>
                </View>
                <View style={styles.aiAssistantText}>
                  <Text style={styles.aiAssistantTitle}>Assistant IA</Text>
                  <Text style={styles.aiAssistantSubtitle}>
                    Conseils intelligents · Relances · Analyse de risques
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Actions Rapides */}
        <Animated.View 
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.sectionTitle}>⚡ Actions Rapides</Text>
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
        </Animated.View>

        {/* Objectif Mensuel */}
        {stats.monthlyTotal > 0 && (
          <Animated.View 
            style={[
              styles.objectifSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Card style={styles.objectifCard}>
              <CardContent style={styles.objectifContent}>
                <View style={styles.objectifHeader}>
                  <View style={styles.objectifIconContainer}>
                    <Ionicons name="trophy" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.objectifTextContainer}>
                    <Text style={styles.objectifTitle}>🎯 Objectif du Mois</Text>
                    <Text style={styles.objectifSubtitle}>
                      {formatCurrency(stats.monthlyTotal)} / {formatCurrency(stats.objectifMensuel)}
                    </Text>
                  </View>
                </View>

                {/* Barre de progression */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View 
                      style={[
                        styles.progressBarFill,
                        { 
                          width: `${Math.min(stats.progressionObjectif, 100)}%`,
                          backgroundColor: stats.progressionObjectif >= 100 ? Colors.accent : 
                                         stats.progressionObjectif >= 75 ? '#FFA726' : 
                                         stats.progressionObjectif >= 50 ? '#2196F3' : Colors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {stats.progressionObjectif >= 100 ? '🎉 ' : ''}
                    {stats.progressionObjectif.toFixed(0)}%
                    {stats.progressionObjectif >= 100 ? ' Objectif atteint!' : ' complété'}
                  </Text>
                </View>

                {/* Stats détaillées */}
                <View style={styles.objectifStats}>
                  <View style={styles.objectifStatItem}>
                    <Text style={styles.objectifStatLabel}>Reste à faire</Text>
                    <Text style={[
                      styles.objectifStatValue,
                      { color: stats.monthlyTotal >= stats.objectifMensuel ? Colors.accent : Colors.error }
                    ]}>
                      {formatCurrency(Math.max(0, stats.objectifMensuel - stats.monthlyTotal))}
                    </Text>
                  </View>
                  <View style={styles.objectifStatDivider} />
                  <View style={styles.objectifStatItem}>
                    <Text style={styles.objectifStatLabel}>Progrès</Text>
                    <Text style={[
                      styles.objectifStatValue,
                      { color: stats.monthlyChange > 0 ? Colors.accent : Colors.error }
                    ]}>
                      {stats.monthlyChange > 0 ? '+' : ''}{stats.monthlyChange.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </Animated.View>
        )}

        {/* Top 3 Clients VIP */}
        {stats.topClients.length > 0 && (
          <Animated.View 
            style={[
              styles.vipSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👑 Top Clients VIP</Text>
              <TouchableOpacity onPress={handleVoirToutClients}>
                <Text style={styles.sectionLink}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {stats.topClients.map((client, index) => {
              const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
              const medalEmojis = ['🥇', '🥈', '🥉'];
              
              return (
                <TouchableOpacity 
                  key={client.id}
                  activeOpacity={0.7}
                  onPress={handleVoirToutClients}
                >
                  <Card style={styles.vipCard}>
                    <CardContent style={styles.vipContent}>
                      <View style={styles.vipLeft}>
                        <View style={styles.vipRank}>
                          <Text style={styles.vipRankEmoji}>{medalEmojis[index]}</Text>
                        </View>
                        <View style={[styles.vipAvatar, { backgroundColor: avatarColors[index] + '20' }]}>
                          <Text style={[styles.vipAvatarText, { color: avatarColors[index] }]}>
                            {client.prenom?.charAt(0).toUpperCase()}{client.nom?.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.vipInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.vipName}>{client.prenom} {client.nom}</Text>
                            {client.nbVentes >= 5 && (
                              <View style={styles.vipBadge}>
                                <Ionicons name="star" size={10} color={Colors.primary} />
                              </View>
                            )}
                          </View>
                          <Text style={styles.vipStats}>
                            {client.nbVentes} vente{client.nbVentes > 1 ? 's' : ''} • {client.telephone}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.vipRight}>
                        <Text style={styles.vipTotal}>{formatCurrency(client.total)}</Text>
                        <View style={[styles.vipLevelBadge, { backgroundColor: avatarColors[index] + '20' }]}>
                          <Text style={[styles.vipLevelText, { color: avatarColors[index] }]}>
                            {client.total >= 100000 ? 'Platine' : client.total >= 50000 ? 'Or' : 'Argent'}
                          </Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}

        {/* Alertes et Insights Intelligents */}
        {(stats.totalCredits > 50000 || stats.nbCredits >= 5 || stats.progressionObjectif < 30) && (
          <Animated.View 
            style={[
              styles.insightsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <Text style={styles.sectionTitle}>💡 Insights & Alertes</Text>
            
            {stats.totalCredits > 50000 && (
              <Card style={styles.insightCard}>
                <CardContent style={styles.insightContent}>
                  <View style={[styles.insightIcon, { backgroundColor: '#FF444420' }]}>
                    <Ionicons name="warning" size={24} color={Colors.error} />
                  </View>
                  <View style={styles.insightText}>
                    <Text style={styles.insightTitle}>⚠️ Crédits élevés</Text>
                    <Text style={styles.insightDescription}>
                      Vous avez {formatCurrency(stats.totalCredits)} de crédits en cours. 
                      Pensez à relancer vos clients.
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.insightButton}
                    onPress={handlePaiementCredit}
                  >
                    <Ionicons name="arrow-forward" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </CardContent>
              </Card>
            )}

            {stats.nbCredits >= 5 && (
              <Card style={styles.insightCard}>
                <CardContent style={styles.insightContent}>
                  <View style={[styles.insightIcon, { backgroundColor: '#FFA72620' }]}>
                    <Ionicons name="people" size={24} color="#FFA726" />
                  </View>
                  <View style={styles.insightText}>
                    <Text style={styles.insightTitle}>📊 Beaucoup de crédits</Text>
                    <Text style={styles.insightDescription}>
                      {stats.nbCredits} clients ont des crédits actifs. 
                      Utilisez les rappels WhatsApp.
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.insightButton}
                    onPress={() => navigation.navigate('WhatsApp' as never)}
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </TouchableOpacity>
                </CardContent>
              </Card>
            )}

            {stats.monthlyTotal > 0 && stats.progressionObjectif < 30 && (
              <Card style={styles.insightCard}>
                <CardContent style={styles.insightContent}>
                  <View style={[styles.insightIcon, { backgroundColor: '#2196F320' }]}>
                    <Ionicons name="trending-up" size={24} color="#2196F3" />
                  </View>
                  <View style={styles.insightText}>
                    <Text style={styles.insightTitle}>🚀 Boost nécessaire</Text>
                    <Text style={styles.insightDescription}>
                      Vous êtes à {stats.progressionObjectif.toFixed(0)}% de votre objectif mensuel. 
                      Continuez vos efforts!
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.insightButton}
                    onPress={handleNouvelleVente}
                  >
                    <Ionicons name="add-circle" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </CardContent>
              </Card>
            )}
          </Animated.View>
        )}

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
    backgroundColor: '#F8F9FA',
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgEffect1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 100,
  },
  headerBgEffect2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(139, 195, 74, 0.08)',
    borderRadius: 80,
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
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  headerIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  headerEmoji: {
    fontSize: 26,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  headerStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 6,
  },
  headerStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 4,
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 12,
  },
  kpisContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 12,
  },
  kpiCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiCardPrimary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  kpiCardSuccess: {
    backgroundColor: Colors.white,
  },
  kpiCardSecondary: {
    backgroundColor: Colors.white,
  },
  kpiCardInfo: {
    backgroundColor: Colors.white,
  },
  kpiCardWarning: {
    backgroundColor: Colors.white,
  },
  kpiCardNeutral: {
    backgroundColor: Colors.white,
  },
  kpiContent: {
    padding: 18,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  kpiIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
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
    marginBottom: 6,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCardSmall: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiContentSmall: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  kpiIconSmall: {
    width: 44,
    height: 44,
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
    fontSize: 17,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
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
    marginBottom: 14,
  },
  sectionLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: Colors.white,
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
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  venteContent: {
    padding: 14,
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
    width: 42,
    height: 42,
    borderRadius: 11,
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
    marginBottom: 3,
  },
  venteDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venteRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  venteMontant: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  venteStatutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  venteStatutText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.15)',
    shadowColor: Colors.accent,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    backgroundColor: Colors.accent,
    borderRadius: 5,
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
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  miniChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  miniChartBar: {
    width: 6,
    height: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniChartBarFill: {
    width: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    position: 'absolute',
    bottom: 0,
    borderRadius: 3,
  },
  objectifSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  objectifCard: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  objectifContent: {
    padding: 18,
  },
  objectifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  objectifIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  objectifTextContainer: {
    flex: 1,
  },
  objectifTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  objectifSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  objectifStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  objectifStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  objectifStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  objectifStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  objectifStatDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  vipSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  vipCard: {
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  vipContent: {
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  vipRank: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  vipRankEmoji: {
    fontSize: 20,
  },
  vipAvatar: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  vipInfo: {
    flex: 1,
  },
  vipName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 3,
  },
  vipStats: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  vipBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  vipTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  vipLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipLevelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  insightsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  insightCard: {
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  insightContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  insightButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  aiAssistantSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  aiAssistantCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  aiAssistantGradient: {
    width: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 18,
  },
  aiAssistantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aiAssistantIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  aiAssistantEmoji: {
    fontSize: 28,
  },
  aiAssistantText: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  aiAssistantSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
});
