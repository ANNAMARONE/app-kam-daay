import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import Colors from '../constants/Colors';
import { formatCurrency, calculateDailyTotal, calculateWeeklyTotal } from '../lib/utils';

export default function Dashboard() {
  const { ventes, clients } = useStore();

  const dailyTotal = calculateDailyTotal(ventes);
  const weeklyTotal = calculateWeeklyTotal(ventes);
  const activeClients = clients.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header moderne avec gradient */}
      <View style={styles.header}>
        {/* Effets de fond */}
        <View style={styles.headerBgEffect1} />
        <View style={styles.headerBgEffect2} />
        
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>💼</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Kame Daay</Text>
            <Text style={styles.headerSubtitle}>Gestion Client Intelligente</Text>
          </View>
        </View>
      </View>

      <View style={styles.kpisContainer}>
        {/* Ventes du Jour */}
        <Card style={StyleSheet.flatten([styles.kpiCard, styles.kpiCardPrimary])}>
          <View style={styles.kpiCardBg} />
          <CardContent style={styles.kpiContent}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, styles.kpiIconPrimary]}>
                <Ionicons name="trending-up" size={28} color={Colors.secondary} />
              </View>
              <View style={styles.kpiTextContainer}>
                <Text style={styles.kpiLabel}>Ventes du Jour</Text>
                <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                  {formatCurrency(dailyTotal)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Ventes de la Semaine */}
        <Card style={StyleSheet.flatten([styles.kpiCard, styles.kpiCardSuccess])}>
          <View style={styles.kpiCardBg} />
          <CardContent style={styles.kpiContent}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, styles.kpiIconSuccess]}>
                <Ionicons name="cart" size={28} color={Colors.white} />
              </View>
              <View style={styles.kpiTextContainer}>
                <Text style={styles.kpiLabel}>Ventes de la Semaine</Text>
                <Text style={[styles.kpiValue, { color: Colors.accent }]}>
                  {formatCurrency(weeklyTotal)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Clients Actifs */}
        <Card style={StyleSheet.flatten([styles.kpiCard, styles.kpiCardSecondary])}>
          <View style={styles.kpiCardBg} />
          <CardContent style={styles.kpiContent}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiIcon, styles.kpiIconSecondary]}>
                <Ionicons name="people" size={28} color={Colors.white} />
              </View>
              <View style={styles.kpiTextContainer}>
                <Text style={styles.kpiLabel}>Clients Actifs</Text>
                <Text style={[styles.kpiValue, { color: Colors.secondary }]}>
                  {activeClients}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Bouton Action Rapide */}
      <View style={styles.actionContainer}>
        <Button
          title="Nouvelle Vente"
          onPress={() => {/* Navigation vers Ventes */}}
          variant="primary"
          size="lg"
          fullWidth
          icon={
            <View style={styles.actionButtonIcon}>
              <Ionicons name="cart" size={24} color={Colors.white} />
            </View>
          }
          style={styles.actionButton}
        />
      </View>

      {/* Statut Application */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBgEffect1: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 160,
    height: 160,
    backgroundColor: Colors.primary,
    borderRadius: 80,
    opacity: 0.1,
  },
  headerBgEffect2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 128,
    height: 128,
    backgroundColor: Colors.accent,
    borderRadius: 64,
    opacity: 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  kpisContainer: {
    paddingHorizontal: 16,
    marginTop: 15,
    gap: 16,
  },
  kpiCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  kpiCardPrimary: {
    backgroundColor: '#FFFBF0',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  kpiCardSuccess: {
    backgroundColor: '#F1F8E9',
  },
  kpiCardSecondary: {
    backgroundColor: '#E0F2F1',
  },
  kpiCardBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 64,
  },
  kpiContent: {
    padding: 20,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  kpiIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  kpiIconPrimary: {
    backgroundColor: Colors.primary,
  },
  kpiIconSuccess: {
    backgroundColor: Colors.accent,
  },
  kpiIconSecondary: {
    backgroundColor: Colors.secondary,
  },
  kpiTextContainer: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  actionContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  actionButton: {
    height: 72,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statusDot: {
    width: 16,
    height: 16,
    backgroundColor: Colors.accent,
    borderRadius: 8,
  },
  statusDotPulse: {
    position: 'absolute',
    left: 16,
    width: 16,
    height: 16,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    opacity: 0.5,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  statusSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
