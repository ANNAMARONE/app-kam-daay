import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import Colors from '../constants/Colors';
import { formatCurrency, formatDate } from '../lib/utils';

export default function RappelsPage() {
  const { rappels, clients, ventes, paiements, updateRappel, addRappel, deleteRappel } = useStore();
  const [filter, setFilter] = useState<'tous' | 'actifs' | 'resolus'>('actifs');
  const hasCheckedCredits = useRef(false);

  // Créer automatiquement des rappels pour les crédits en retard
  useEffect(() => {
    // N'exécuter qu'une seule fois au montage
    if (hasCheckedCredits.current) return;
    hasCheckedCredits.current = true;

    const checkCreditsEnRetard = async () => {
      const now = Date.now();
      const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;

      console.log('🔍 Vérification des crédits en retard...');
      
      for (const vente of ventes) {
        if (vente.statut === 'Crédit' || vente.statut === 'Partiel') {
          const paiementsVente = paiements.filter(p => p.venteId === vente.id);
          const totalPaye = paiementsVente.reduce((sum, p) => sum + p.montant, 0) + (vente.montantPaye || 0);
          const reste = vente.total - totalPaye;

          if (reste > 0 && (now - vente.date > SEPT_JOURS)) {
            // Vérifier si un rappel actif existe déjà pour cette vente
            const rappelExiste = rappels.find(
              r => r.venteId === vente.id && !r.resolu
            );

            if (!rappelExiste) {
              const client = clients.find(c => c.id === vente.clientId);
              if (client) {
                console.log(`📝 Création rappel pour ${client.prenom} ${client.nom}: ${formatCurrency(reste)}`);
                try {
                  await addRappel({
                    clientId: vente.clientId,
                    venteId: vente.id!,
                    message: `Crédit en retard de ${formatCurrency(reste)} pour ${client.prenom} ${client.nom}`,
                    dateLimite: now + (3 * 24 * 60 * 60 * 1000), // Dans 3 jours
                    resolu: false,
                    dateCreation: now
                  });
                } catch (error) {
                  console.error('❌ Erreur création rappel:', error);
                }
              }
            }
          }
        }
      }
      console.log('✅ Vérification des crédits terminée');
    };

    // Délai pour s'assurer que les données sont chargées
    const timer = setTimeout(() => {
      if (ventes.length > 0) {
        checkCreditsEnRetard();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Dépendances vides - s'exécute une seule fois

  const rappelsFiltres = rappels.filter(r => {
    if (filter === 'actifs') return !r.resolu;
    if (filter === 'resolus') return r.resolu;
    return true;
  }).sort((a, b) => a.dateLimite - b.dateLimite);

  const rappelsEnRetard = rappelsFiltres.filter(r => !r.resolu && r.dateLimite < Date.now()).length;
  const rappelsActifs = rappelsFiltres.filter(r => !r.resolu).length;

  const handleMarquerResolu = async (id: number) => {
    try {
      await updateRappel(id, { resolu: true });
      Alert.alert('Succès', 'Rappel marqué comme résolu');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la mise à jour');
    }
  };

  const handleSupprimer = async (id: number) => {
    Alert.alert(
      'Confirmer',
      'Êtes-vous sûr de vouloir supprimer ce rappel ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRappel(id);
              Alert.alert('Succès', 'Rappel supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  const getJoursRestants = (dateLimite: number) => {
    const diff = dateLimite - Date.now();
    const jours = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return jours;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="notifications" size={24} color={Colors.secondary} />
            {rappelsActifs > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rappelsActifs}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Rappels</Text>
            <Text style={styles.headerSubtitle}>
              {rappelsEnRetard > 0 ? `${rappelsEnRetard} en retard` : 'Tous à jour'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Alerte Urgente */}
        {rappelsEnRetard > 0 && (
          <Card style={styles.alertCard}>
            <CardContent style={styles.alertContent}>
              <View style={styles.alertIcon}>
                <Ionicons name="warning" size={20} color={Colors.error} />
              </View>
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>Attention !</Text>
                <Text style={styles.alertText}>
                  Vous avez {rappelsEnRetard} rappel(s) en retard qui nécessite(nt) votre attention.
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            onPress={() => setFilter('actifs')}
            style={[
              styles.filterButton,
              filter === 'actifs' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'actifs' && styles.filterButtonTextActive
            ]}>
              Actifs ({rappelsActifs})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('resolus')}
            style={[
              styles.filterButton,
              filter === 'resolus' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'resolus' && styles.filterButtonTextActive
            ]}>
              Résolus
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter('tous')}
            style={[
              styles.filterButton,
              filter === 'tous' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'tous' && styles.filterButtonTextActive
            ]}>
              Tous
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des Rappels */}
        {rappelsFiltres.length === 0 ? (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
              </View>
              <Text style={styles.emptyTitle}>Aucun rappel</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'actifs' ? 'Tous vos rappels sont à jour !' : 'Aucun rappel trouvé'}
              </Text>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.rappelsList}>
            {rappelsFiltres.map((rappel) => {
              const client = clients.find(c => c.id === rappel.clientId);
              const vente = ventes.find(v => v.id === rappel.venteId);
              const joursRestants = getJoursRestants(rappel.dateLimite);
              const enRetard = joursRestants < 0;

              return (
                <Card
                  key={rappel.id}
                  style={[
                    styles.rappelCard,
                    rappel.resolu && styles.rappelCardResolu,
                    enRetard && !rappel.resolu && styles.rappelCardEnRetard,
                  ]}
                >
                  <CardContent style={styles.rappelContent}>
                    <View style={styles.rappelHeader}>
                      <View style={[
                        styles.rappelIconContainer,
                        rappel.resolu && styles.rappelIconResolu,
                        enRetard && !rappel.resolu && styles.rappelIconEnRetard,
                      ]}>
                        {rappel.resolu ? (
                          <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                        ) : (
                          <Ionicons
                            name="notifications"
                            size={24}
                            color={enRetard ? Colors.error : Colors.primary}
                          />
                        )}
                      </View>

                      <View style={styles.rappelInfo}>
                        {client && (
                          <View style={styles.clientInfo}>
                            <Ionicons name="person" size={14} color={Colors.textSecondary} />
                            <Text style={styles.clientName}>
                              {client.prenom} {client.nom}
                            </Text>
                            <Text style={styles.clientPhone}>{client.telephone}</Text>
                          </View>
                        )}

                        <Text style={styles.rappelMessage}>{rappel.message}</Text>

                        <View style={styles.rappelMeta}>
                          <View style={styles.rappelDate}>
                            <Ionicons name="calendar" size={12} color={Colors.textSecondary} />
                            <Text style={styles.rappelDateText}>
                              Échéance: {formatDate(rappel.dateLimite)}
                            </Text>
                          </View>
                          {!rappel.resolu && (
                            <Text style={[
                              styles.rappelJours,
                              enRetard ? styles.rappelJoursRetard : styles.rappelJoursOk
                            ]}>
                              {enRetard
                                ? `En retard de ${Math.abs(joursRestants)} jour(s)`
                                : `${joursRestants} jour(s) restant(s)`}
                            </Text>
                          )}
                        </View>

                        {vente && (
                          <View style={styles.venteInfo}>
                            <Text style={styles.venteInfoText}>
                              Vente du {formatDate(vente.date)} •{' '}
                              <Text style={styles.venteInfoMontant}>
                                {formatCurrency(vente.total - vente.montantPaye)}
                              </Text>{' '}
                              à recouvrer
                            </Text>
                          </View>
                        )}

                        {!rappel.resolu && (
                          <View style={styles.rappelActions}>
                            <Button
                              title="Marquer résolu"
                              onPress={() => handleMarquerResolu(rappel.id!)}
                              variant="success"
                              size="sm"
                              style={styles.rappelActionButton}
                              icon={<Ionicons name="checkmark-circle" size={16} color={Colors.white} />}
                            />
                            <TouchableOpacity
                              onPress={() => handleSupprimer(rappel.id!)}
                              style={styles.deleteButton}
                            >
                              <Text style={styles.deleteButtonText}>Supprimer</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </CardContent>
                </Card>
              );
            })}
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    backgroundColor: Colors.error,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  alertCard: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: Colors.error + '50',
    marginBottom: 16,
  },
  alertContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.error + '20',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.secondary,
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
    backgroundColor: Colors.accent + '20',
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
  rappelsList: {
    gap: 12,
  },
  rappelCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  rappelCardResolu: {
    opacity: 0.6,
    borderLeftColor: Colors.accent,
  },
  rappelCardEnRetard: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: Colors.error,
  },
  rappelContent: {
    padding: 16,
  },
  rappelHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  rappelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rappelIconResolu: {
    backgroundColor: Colors.accent + '20',
  },
  rappelIconEnRetard: {
    backgroundColor: Colors.error + '20',
  },
  rappelInfo: {
    flex: 1,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  clientPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rappelMessage: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  rappelMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rappelDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rappelDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rappelJours: {
    fontSize: 12,
    fontWeight: '600',
  },
  rappelJoursRetard: {
    color: Colors.error,
  },
  rappelJoursOk: {
    color: Colors.accent,
  },
  venteInfo: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  venteInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  venteInfoMontant: {
    fontWeight: '700',
    color: Colors.error,
  },
  rappelActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  rappelActionButton: {
    flex: 1,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
  },
});