import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';

export default function DetailVente({ navigation }: { navigation?: any }) {
  // Utiliser les props navigation si fournis, sinon useNavigation (pour compatibilité)
  const navFromHook = useNavigation();
  const nav = navigation || navFromHook;
  const route = useRoute();
  
  const { venteId } = (route.params as { venteId: number }) || {};
  
  const { ventes, clients } = useStore();

  // Récupérer la vente
  const vente = useMemo(() => {
    return ventes.find(v => v.id === venteId);
  }, [ventes, venteId]);

  // Récupérer le client
  const client = useMemo(() => {
    if (!vente) return null;
    return clients.find(c => c.id === vente.clientId);
  }, [vente, clients]);

  if (!vente) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>Vente non trouvée</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => nav.goBack()}
          >
            <Text style={styles.errorButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const reste = (vente.total || 0) - (vente.montantPaye || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => nav.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Détails de la Vente</Text>
            <Text style={styles.headerSubtitle}>#{vente.id?.toString().padStart(5, '0')}</Text>
          </View>
          <View style={[
            styles.headerIcon,
            vente.statut === 'Payé' ? { backgroundColor: Colors.accent } :
            vente.statut === 'Crédit' ? { backgroundColor: Colors.error } :
            { backgroundColor: '#FFA726' }
          ]}>
            <Ionicons 
              name={
                vente.statut === 'Payé' ? 'checkmark-circle' :
                vente.statut === 'Crédit' ? 'alert-circle' :
                'time'
              }
              size={28}
              color={Colors.white}
            />
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Statut Badge */}
        <View style={styles.statusBadgeContainer}>
          <View style={[
            styles.statusBadge,
            vente.statut === 'Payé' ? { backgroundColor: '#8BC34A20' } :
            vente.statut === 'Crédit' ? { backgroundColor: '#FF444420' } :
            { backgroundColor: '#FFA72620' }
          ]}>
            <Ionicons 
              name={
                vente.statut === 'Payé' ? 'checkmark-circle' :
                vente.statut === 'Crédit' ? 'alert-circle' :
                'time-outline'
              }
              size={24}
              color={
                vente.statut === 'Payé' ? Colors.accent :
                vente.statut === 'Crédit' ? Colors.error :
                '#FFA726'
              }
            />
            <Text style={[
              styles.statusBadgeText,
              vente.statut === 'Payé' ? { color: Colors.accent } :
              vente.statut === 'Crédit' ? { color: Colors.error } :
              { color: '#FFA726' }
            ]}>
              {vente.statut}
            </Text>
          </View>
        </View>

        {/* Informations Client */}
        {client && (
          <Card style={styles.section}>
            <CardContent style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Client</Text>
              </View>
              <View style={styles.clientInfo}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {client.prenom.charAt(0)}{client.nom.charAt(0)}
                  </Text>
                </View>
                <View style={styles.clientDetails}>
                  <Text style={styles.clientName}>{client.prenom} {client.nom}</Text>
                  <View style={styles.clientContact}>
                    <Ionicons name="call" size={14} color={Colors.textSecondary} />
                    <Text style={styles.clientPhone}>{client.telephone}</Text>
                  </View>
                  {client.adresse && (
                    <View style={styles.clientContact}>
                      <Ionicons name="location" size={14} color={Colors.textSecondary} />
                      <Text style={styles.clientAddress}>{client.adresse}</Text>
                    </View>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Date et Heure */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Date et Heure</Text>
            </View>
            <View style={styles.dateInfo}>
              <Text style={styles.dateText}>{formatDate(vente.date)}</Text>
              <Text style={styles.timeText}>
                {new Date(vente.date).toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Articles */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Articles ({vente.articles?.length || 0})</Text>
            </View>
            
            {vente.articles && vente.articles.length > 0 ? (
              <View style={styles.articlesContainer}>
                {vente.articles.map((article, index) => (
                  <View key={index} style={styles.articleItem}>
                    <View style={styles.articleLeft}>
                      <View style={styles.articleBadge}>
                        <Text style={styles.articleBadgeText}>{index + 1}</Text>
                      </View>
                      <View style={styles.articleDetails}>
                        <Text style={styles.articleName}>{article.nom}</Text>
                        <Text style={styles.articleQty}>
                          {article.quantite} × {formatCurrency(article.prixUnitaire)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.articleTotal}>
                      {formatCurrency(article.quantite * article.prixUnitaire)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noArticles}>Aucun article</Text>
            )}
          </CardContent>
        </Card>

        {/* Paiement */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Paiement</Text>
            </View>
            
            <View style={styles.paymentContainer}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Sous-total</Text>
                <Text style={styles.paymentValue}>{formatCurrency(vente.total || 0)}</Text>
              </View>
              
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Montant payé</Text>
                <Text style={[styles.paymentValue, { color: Colors.accent }]}>
                  {formatCurrency(vente.montantPaye || 0)}
                </Text>
              </View>

              {reste > 0 && (
                <View style={[styles.paymentRow, styles.paymentRowFinal]}>
                  <Text style={styles.paymentLabelFinal}>Reste à payer</Text>
                  <Text style={[styles.paymentValueFinal, { color: Colors.error }]}>
                    {formatCurrency(reste)}
                  </Text>
                </View>
              )}

              {reste < 0 && (
                <View style={[styles.paymentRow, styles.paymentRowFinal]}>
                  <Text style={styles.paymentLabelFinal}>Rendu</Text>
                  <Text style={[styles.paymentValueFinal, { color: Colors.accent }]}>
                    {formatCurrency(Math.abs(reste))}
                  </Text>
                </View>
              )}

              {reste === 0 && vente.statut === 'Payé' && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
                  <Text style={styles.paidText}>✅ Payé intégralement</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Récapitulatif */}
        <Card style={[styles.section, styles.summaryCard]}>
          <CardContent style={styles.summaryContent}>
            <View style={styles.summaryHeader}>
              <Ionicons name="receipt" size={24} color={Colors.primary} />
              <Text style={styles.summaryTitle}>Total</Text>
            </View>
            <Text style={styles.summaryAmount}>{formatCurrency(vente.total || 0)}</Text>
            <Text style={styles.summarySubtext}>
              {vente.statut} • {formatDate(vente.date)}
            </Text>
          </CardContent>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // TODO: Implémenter l'impression ou le partage
              console.log('Partager la vente');
            }}
          >
            <Ionicons name="share-outline" size={22} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Partager</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // TODO: Implémenter l'impression
              console.log('Imprimer la vente');
            }}
          >
            <Ionicons name="print-outline" size={22} color={Colors.secondary} />
            <Text style={styles.actionButtonText}>Imprimer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBgEffect: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: Colors.primary,
    borderRadius: 80,
    opacity: 0.1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  statusBadgeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
    borderRadius: 20,
  },
  sectionContent: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  clientInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  clientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  clientDetails: {
    flex: 1,
    gap: 6,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.secondary,
  },
  clientContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  clientAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
  },
  timeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  articlesContainer: {
    gap: 12,
  },
  articleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  articleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  articleBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
  articleDetails: {
    flex: 1,
  },
  articleName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 3,
  },
  articleQty: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  articleTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  noArticles: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  paymentContainer: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentRowFinal: {
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  paymentLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  paymentLabelFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  paymentValueFinal: {
    fontSize: 20,
    fontWeight: '700',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#8BC34A20',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  paidText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
  summaryCard: {
    backgroundColor: '#FFFBF0',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  summaryContent: {
    padding: 24,
    alignItems: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  summarySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
});