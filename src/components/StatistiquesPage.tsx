import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';
import { formatCurrency, getWeekNumber } from '../lib/utils';

const screenWidth = Dimensions.get('window').width;

export default function StatistiquesPage() {
  const { ventes, clients } = useStore();

  // Statistiques générales
  const totalVentes = ventes.reduce((sum, v) => sum + v.total, 0);
  const ventesPayees = ventes.filter(v => v.statut === 'Payé').length;
  const ventesCredit = ventes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel').length;

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
      color: Colors.primary,
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
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const COLORS = [Colors.primary, Colors.accent, Colors.secondary, Colors.warning, '#26A69A'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="bar-chart" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.headerTitle}>Statistiques</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* KPIs Principaux */}
        <View style={styles.kpisRow}>
          <Card style={styles.kpiCard}>
            <CardContent style={styles.kpiContent}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="trending-up" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.kpiLabel}>Total Ventes</Text>
              <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                {formatCurrency(totalVentes)}
              </Text>
            </CardContent>
          </Card>

          <Card style={styles.kpiCard}>
            <CardContent style={styles.kpiContent}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="cart" size={16} color={Colors.accent} />
              </View>
              <Text style={styles.kpiLabel}>Nb Ventes</Text>
              <Text style={[styles.kpiValue, { color: Colors.accent }]}>
                {ventes.length}
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Ventes par Semaine */}
        {dataVentesParSemaine.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <Text style={styles.chartTitle}>Ventes par Semaine</Text>
              <BarChart
                data={{
                  labels: dataVentesParSemaine.map(d => d.name),
                  datasets: [{ data: dataVentesParSemaine.map(d => d.value) }],
                }}
                width={screenWidth - 64}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </CardContent>
          </Card>
        )}

        {/* Répartition Paiements */}
        {ventes.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <Text style={styles.chartTitle}>Répartition des Paiements</Text>
              <PieChart
                data={pieData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </CardContent>
          </Card>
        )}

        {/* Top Clients */}
        {clientsAvecVentes.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color={Colors.secondary} />
                <Text style={styles.chartTitle}>Top 5 Clients</Text>
              </View>
              
              <View style={styles.topList}>
                {clientsAvecVentes.map((client, index) => (
                  <View key={index} style={styles.topItem}>
                    <View style={styles.topItemLeft}>
                      <View style={[styles.topBadge, { backgroundColor: COLORS[index % COLORS.length] }]}>
                        <Text style={styles.topBadgeText}>{index + 1}</Text>
                      </View>
                      <View style={styles.topItemInfo}>
                        <Text style={styles.topItemName} numberOfLines={1}>
                          {client.nom}
                        </Text>
                        <Text style={styles.topItemSubtitle}>
                          {client.nombreVentes} vente(s)
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.topItemValue}>
                      {formatCurrency(client.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Top Produits */}
        {topProduits.length > 0 && (
          <Card style={styles.chartCard}>
            <CardContent style={styles.chartContent}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube" size={20} color={Colors.secondary} />
                <Text style={styles.chartTitle}>Produits les Plus Vendus</Text>
              </View>
              
              <View style={styles.topList}>
                {topProduits.map((produit, index) => (
                  <View key={index} style={styles.topItem}>
                    <View style={styles.topItemLeft}>
                      <View style={[styles.topBadge, { backgroundColor: COLORS[index % COLORS.length] }]}>
                        <Text style={styles.topBadgeText}>{index + 1}</Text>
                      </View>
                      <View style={styles.topItemInfo}>
                        <Text style={styles.topItemName} numberOfLines={1}>
                          {produit.nom}
                        </Text>
                        <Text style={styles.topItemSubtitle}>
                          {produit.quantite} unité(s)
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.topItemValue}>
                      {formatCurrency(produit.montant)}
                    </Text>
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
              <Ionicons name="bar-chart" size={64} color={Colors.grayDark} />
              <Text style={styles.emptyTitle}>Aucune donnée</Text>
              <Text style={styles.emptySubtitle}>
                Enregistrez des ventes pour voir les statistiques
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
  kpisRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
  },
  kpiContent: {
    padding: 16,
  },
  kpiIconContainer: {
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  chartCard: {
    marginBottom: 16,
  },
  chartContent: {
    padding: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  topList: {
    gap: 12,
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  topItemSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topItemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  emptyCard: {
    marginTop: 40,
  },
  emptyContent: {
    padding: 48,
    alignItems: 'center',
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
    textAlign: 'center',
  },
});
