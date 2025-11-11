import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';
import { formatCurrency, getWeekNumber } from '../lib/utils';

const screenWidth = Dimensions.get('window').width;

type PeriodType = 'week' | 'month' | 'all';

export default function StatistiquesPage() {
  const insets = useSafeAreaInsets();
  const { ventes, clients, depenses } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');

  // Statistiques générales
  const totalVentes = ventes.reduce((sum, v) => sum + v.total, 0);
  const totalDepenses = depenses?.reduce((sum: number, d: any) => sum + d.montant, 0) || 0;
  const benefice = totalVentes - totalDepenses;
  const ventesPayees = ventes.filter(v => v.statut === 'Payé').length;
  const ventesCredit = ventes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel').length;
  const panierMoyen = ventes.length > 0 ? totalVentes / ventes.length : 0;

  // Ventes par semaine (4 dernières semaines)
  const ventesParSemaine = ventes.reduce((acc: any, vente) => {
    const date = new Date(vente.date);
    const weekNum = getWeekNumber(date);
    const key = `S${weekNum}`;
    
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += vente.total;
    return acc;
  }, {});

  const dataVentesParSemaine = Object.entries(ventesParSemaine)
    .slice(-4)
    .map(([name, value]) => ({ name, value: value as number }));

  // Top 5 clients
  const clientsAvecVentes = clients.map(client => {
    const ventesClient = ventes.filter(v => v.clientId === client.id);
    const totalClient = ventesClient.reduce((sum, v) => sum + v.total, 0);
    return {
      nom: `${client.prenom} ${client.nom}`,
      total: totalClient,
      nombreVentes: ventesClient.length,
    };
  }).filter(c => c.nombreVentes > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Répartition des paiements
  const pieData = [
    {
      name: 'Payé',
      population: ventesPayees,
      color: Colors.accent,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Crédit',
      population: ventesCredit,
      color: Colors.warning,
      legendFontColor: Colors.text,
      legendFontSize: 12,
    },
  ];

  // Produits les plus vendus
  const produitsVendus = ventes.reduce((acc: any, vente) => {
    vente.articles.forEach(article => {
      if (!acc[article.nom]) {
        acc[article.nom] = { quantite: 0, montant: 0 };
      }
      acc[article.nom].quantite += article.quantite;
      acc[article.nom].montant += article.quantite * article.prixUnitaire;
    });
    return acc;
  }, {});

  const topProduits = Object.entries(produitsVendus)
    .map(([nom, data]: [string, any]) => ({
      nom,
      quantite: data.quantite,
      montant: data.montant,
    }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 5);

  const chartConfig = {
    backgroundColor: Colors.white,
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 77, 64, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: '600',
    },
  };

  const COLORS = [Colors.primary, Colors.accent, Colors.secondary, Colors.warning, '#26A69A'];
  const MEDAL_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <View style={styles.container}>
      {/* Header avec Safe Area */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerBgEffect2} />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="bar-chart" size={28} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>Statistiques</Text>
          </View>
          <Text style={styles.headerSubtitle}>Analysez vos performances</Text>
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
          {/* KPIs Principaux */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="trending-up" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{formatCurrency(totalVentes)}</Text>
                <Text style={styles.statLabel}>Total Ventes</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="cart-outline" size={20} color="#1976D2" />
                </View>
                <Text style={styles.statValue}>{ventes.length}</Text>
                <Text style={styles.statLabel}>Nb Ventes</Text>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="people-outline" size={20} color="#F57C00" />
                </View>
                <Text style={styles.statValue}>{clients.length}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </CardContent>
            </Card>
          </View>

          {/* Bénéfice et Panier Moyen */}
          <View style={styles.statsRow}>
            <Card style={[styles.miniStatCard, benefice >= 0 ? styles.miniStatCardPositive : styles.miniStatCardNegative]}>
              <CardContent style={styles.miniStatContent}>
                <View style={styles.miniStatLeft}>
                  <Ionicons 
                    name={benefice >= 0 ? "trending-up" : "trending-down"} 
                    size={24} 
                    color={benefice >= 0 ? Colors.accent : Colors.error} 
                  />
                  <View style={styles.miniStatInfo}>
                    <Text style={styles.miniStatLabel}>Bénéfice</Text>
                    <Text style={[styles.miniStatValue, benefice < 0 && styles.miniStatValueNegative]}>
                      {formatCurrency(benefice)}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card style={styles.miniStatCard}>
              <CardContent style={styles.miniStatContent}>
                <View style={styles.miniStatLeft}>
                  <Ionicons name="basket" size={24} color={Colors.primary} />
                  <View style={styles.miniStatInfo}>
                    <Text style={styles.miniStatLabel}>Panier Moyen</Text>
                    <Text style={styles.miniStatValue}>
                      {formatCurrency(panierMoyen)}
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Ventes par Semaine */}
        {dataVentesParSemaine.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderLeft}>
                  <View style={styles.chartIconBox}>
                    <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.chartTitle}>Ventes par Semaine</Text>
                </View>
              </View>
              <View style={styles.chartWrapper}>
                <BarChart
                  data={{
                    labels: dataVentesParSemaine.map(d => d.name),
                    datasets: [{ data: dataVentesParSemaine.map(d => d.value) }],
                  }}
                  width={screenWidth - 72}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                />
              </View>
            </CardContent>
          </Card>
        )}

        {/* Répartition Paiements */}
        {ventes.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <View style={styles.chartHeader}>
                <View style={styles.chartHeaderLeft}>
                  <View style={styles.chartIconBox}>
                    <Ionicons name="pie-chart-outline" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.chartTitle}>Répartition des Paiements</Text>
                </View>
              </View>
              <View style={styles.chartWrapper}>
                <PieChart
                  data={pieData}
                  width={screenWidth - 72}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
              <View style={styles.pieStats}>
                <View style={styles.pieStatItem}>
                  <View style={[styles.pieStatDot, { backgroundColor: Colors.accent }]} />
                  <Text style={styles.pieStatLabel}>Payé</Text>
                  <Text style={styles.pieStatValue}>{ventesPayees}</Text>
                </View>
                <View style={styles.pieStatItem}>
                  <View style={[styles.pieStatDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.pieStatLabel}>Crédit</Text>
                  <Text style={styles.pieStatValue}>{ventesCredit}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Top Clients */}
        {clientsAvecVentes.length > 0 && (
          <Card style={styles.topCard}>
            <CardContent style={styles.topContent}>
              <View style={styles.topHeader}>
                <View style={styles.topHeaderLeft}>
                  <View style={styles.topIconBox}>
                    <Ionicons name="people" size={20} color={Colors.white} />
                  </View>
                  <View>
                    <Text style={styles.topTitle}>Top 5 Clients</Text>
                    <Text style={styles.topSubtitle}>Meilleurs acheteurs</Text>
                  </View>
                </View>
                <View style={styles.topBadge}>
                  <Text style={styles.topBadgeText}>{clientsAvecVentes.length}</Text>
                </View>
              </View>
              
              <View style={styles.topList}>
                {clientsAvecVentes.map((client, index) => (
                  <View key={index} style={styles.topItem}>
                    <View style={styles.topItemLeft}>
                      <Text style={styles.topMedal}>{MEDAL_EMOJIS[index]}</Text>
                      <View style={styles.topItemInfo}>
                        <Text style={styles.topItemName} numberOfLines={1}>
                          {client.nom}
                        </Text>
                        <Text style={styles.topItemSubtitle}>
                          {client.nombreVentes} vente{client.nombreVentes > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.topItemRight}>
                      <Text style={styles.topItemValue}>
                        {formatCurrency(client.total)}
                      </Text>
                      <View style={[styles.topItemRank, { backgroundColor: COLORS[index % COLORS.length] + '20' }]}>
                        <Text style={[styles.topItemRankText, { color: COLORS[index % COLORS.length] }]}>
                          #{index + 1}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Top Produits */}
        {topProduits.length > 0 && (
          <Card style={styles.topCard}>
            <CardContent style={styles.topContent}>
              <View style={styles.topHeader}>
                <View style={styles.topHeaderLeft}>
                  <View style={[styles.topIconBox, { backgroundColor: Colors.accent }]}>
                    <Ionicons name="cube" size={20} color={Colors.white} />
                  </View>
                  <View>
                    <Text style={styles.topTitle}>Top 5 Produits</Text>
                    <Text style={styles.topSubtitle}>Plus vendus</Text>
                  </View>
                </View>
                <View style={[styles.topBadge, { backgroundColor: Colors.accent + '20' }]}>
                  <Text style={[styles.topBadgeText, { color: Colors.accent }]}>{topProduits.length}</Text>
                </View>
              </View>
              
              <View style={styles.topList}>
                {topProduits.map((produit, index) => (
                  <View key={index} style={styles.topItem}>
                    <View style={styles.topItemLeft}>
                      <Text style={styles.topMedal}>{MEDAL_EMOJIS[index]}</Text>
                      <View style={styles.topItemInfo}>
                        <Text style={styles.topItemName} numberOfLines={1}>
                          {produit.nom}
                        </Text>
                        <Text style={styles.topItemSubtitle}>
                          {produit.quantite} unité{produit.quantite > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.topItemRight}>
                      <Text style={styles.topItemValue}>
                        {formatCurrency(produit.montant)}
                      </Text>
                      <View style={[styles.topItemRank, { backgroundColor: COLORS[index % COLORS.length] + '20' }]}>
                        <Text style={[styles.topItemRankText, { color: COLORS[index % COLORS.length] }]}>
                          #{index + 1}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {ventes.length === 0 && (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Ionicons name="bar-chart-outline" size={56} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Aucune donnée disponible</Text>
              <Text style={styles.emptySubtitle}>
                Enregistrez des ventes pour voir vos statistiques
              </Text>
            </CardContent>
          </Card>
        )}
      </ScrollView>
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
    gap: 16,
  },

  // ===== STATS =====
  statsContainer: {
    gap: 12,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  miniStatCard: {
    flex: 1,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  miniStatCardPositive: {
    backgroundColor: '#E8F5E9',
  },
  miniStatCardNegative: {
    backgroundColor: '#FFEBEE',
  },
  miniStatContent: {
    padding: 16,
  },
  miniStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniStatInfo: {
    flex: 1,
  },
  miniStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
  },
  miniStatValueNegative: {
    color: Colors.error,
  },

  // ===== CHARTS =====
  chartCard: {
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartContent: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartIconBox: {
    width: 36,
    height: 36,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  chartWrapper: {
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  pieStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pieStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieStatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pieStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pieStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },

  // ===== TOP LISTS =====
  topCard: {
    backgroundColor: Colors.white,
    borderWidth: 0,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  topContent: {
    padding: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary + '20',
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topIconBox: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 2,
  },
  topSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  topList: {
    gap: 12,
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topMedal: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 3,
  },
  topItemSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topItemRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  topItemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 4,
  },
  topItemRank: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topItemRankText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ===== EMPTY STATE =====
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
});
