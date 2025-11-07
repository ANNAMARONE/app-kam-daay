import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useStore } from '../lib/store';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import Colors from '../constants/Colors';
import { convertToCSV, generateCSVFilename, formatCurrency } from '../lib/utils';
import { syncService } from '../lib/sync';
import { getDatabaseInstance } from '../lib/store';

export default function ParametresPage() {
  const { clients, ventes, templates, addTemplate, deleteTemplate } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleExportClients = async () => {
    try {
      setIsExporting(true);
      
      if (clients.length === 0) {
        Alert.alert('Aucune donnée', 'Aucun client à exporter');
        return;
      }

      const csvData = clients.map(c => ({
        Prénom: c.prenom,
        Nom: c.nom,
        Téléphone: c.telephone,
        Adresse: c.adresse || '',
        Type: c.type || '',
      }));

      const csv = convertToCSV(csvData);
      const filename = generateCSVFilename('clients');
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les clients',
        });
      }

      Alert.alert('Succès', 'Clients exportés avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'export');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportVentes = async () => {
    try {
      setIsExporting(true);
      
      if (ventes.length === 0) {
        Alert.alert('Aucune donnée', 'Aucune vente à exporter');
        return;
      }

      const csvData = ventes.map(v => {
        const client = clients.find(c => c.id === v.clientId);
        return {
          Date: new Date(v.date).toLocaleDateString('fr-FR'),
          Client: client ? `${client.prenom} ${client.nom}` : 'Inconnu',
          Total: v.total,
          'Montant Payé': v.montantPaye,
          Statut: v.statut,
        };
      });

      const csv = convertToCSV(csvData);
      const filename = generateCSVFilename('ventes');
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les ventes',
        });
      }

      Alert.alert('Succès', 'Ventes exportées avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'export');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleManualSyncToServer = async () => {
    try {
      setIsSyncing(true);
      console.log('🔧 Déclenchement manuel de syncToServer...');
      const result = await syncService.syncToServer();
      if (result.success) {
        Alert.alert('Succès', 'Synchronisation vers le serveur réussie !');
      } else {
        Alert.alert('Erreur', result.error || 'Échec de la synchronisation');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur inconnue');
      console.error('Erreur sync manuelle:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSyncFromServer = async () => {
    try {
      setIsSyncing(true);
      console.log('🔧 Déclenchement manuel de syncFromServer...');
      const result = await syncService.syncFromServer();
      if (result.success) {
        Alert.alert('Succès', 'Synchronisation depuis le serveur réussie !');
      } else {
        Alert.alert('Erreur', result.error || 'Échec de la synchronisation');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur inconnue');
      console.error('Erreur sync manuelle:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCleanupCorruptedData = async () => {
    Alert.alert(
      'Nettoyer les données corrompues',
      'Cette action va supprimer toutes les ventes avec des clientId invalides (UUID au lieu de nombres). Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Nettoyer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSyncing(true);
              const db = getDatabaseInstance();
              if (db && typeof db.cleanupCorruptedVentes === 'function') {
                await db.cleanupCorruptedVentes();
                Alert.alert('Succès', 'Données corrompues nettoyées ! Vérifiez la console pour les détails.');
              } else {
                Alert.alert('Erreur', 'La méthode cleanupCorruptedVentes n\'existe pas. Rechargez l\'app.');
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Erreur lors du nettoyage');
              console.error('Erreur nettoyage:', error);
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  const handleShowDatabaseStats = async () => {
    try {
      const db = getDatabaseInstance();
      if (!db) {
        Alert.alert('Erreur', 'Base de données non initialisée');
        return;
      }

      // Récupérer toutes les ventes pour analyser
      const allVentes = await db.db.getAllAsync<any>('SELECT * FROM ventes');
      const ventesCorrectes = allVentes.filter(v => typeof v.clientId === 'number');
      const ventesCorrompues = allVentes.filter(v => typeof v.clientId !== 'number');

      const message = `
📊 Statistiques Base de Données SQLite

Clients: ${clients.length}
Ventes Totales: ${allVentes.length}
  ✅ Ventes OK: ${ventesCorrectes.length}
  ❌ Ventes Corrompues: ${ventesCorrompues.length}

${ventesCorrompues.length > 0 ? '⚠️ Des ventes corrompues détectées !' : '✅ Toutes les ventes sont OK'}
      `.trim();

      Alert.alert('Statistiques DB', message);

      // Log détaillé dans la console
      console.log('\n📊 ========== STATISTIQUES DATABASE ==========');
      console.log('  Clients:', clients.length);
      console.log('  Ventes totales:', allVentes.length);
      console.log('  Ventes OK:', ventesCorrectes.length);
      console.log('  Ventes corrompues:', ventesCorrompues.length);
      
      // Log TOUS les clients avec leurs IDs
      console.log('\n👥 LISTE DES CLIENTS LOCAUX:');
      clients.forEach((c, i) => {
        console.log(`  ${i + 1}. [ID ${c.id}] ${c.prenom} ${c.nom} - ${c.telephone}`);
      });
      
      // Log des ventes avec leurs clientId
      if (allVentes.length > 0) {
        console.log('\n💰 LISTE DES VENTES:');
        allVentes.forEach((v, i) => {
          console.log(`  ${i + 1}. [ID ${v.id}] Client ID: ${v.clientId} (${typeof v.clientId}) - Total: ${v.total}`);
        });
      }
      
      if (ventesCorrompues.length > 0) {
        console.log('\n❌ VENTES CORROMPUES:');
        ventesCorrompues.forEach(v => {
          console.log(`  - Vente ${v.id}: clientId=${v.clientId} (type: ${typeof v.clientId})`);
        });
      }
      
      console.log('========================================\n');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Erreur lors de la récupération des stats');
      console.error('Erreur stats:', error);
    }
  };

  const handleDeleteLocalDataOnly = () => {
    Alert.alert(
      '🗑️ Supprimer Données Locales',
      `Cette action va supprimer UNIQUEMENT les données SQLite locales :
• ${clients.length} clients
• ${ventes.length} ventes
• ${templates.length} templates

Les données sur le serveur MySQL resteront intactes.
Utilisez "Recevoir du Serveur" pour les récupérer après.

Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer Local',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSyncing(true);
              const db = getDatabaseInstance();
              
              if (!db) {
                Alert.alert('Erreur', 'Base de données non initialisée');
                setIsSyncing(false);
                return;
              }

              console.log('🗑️ Suppression des données locales UNIQUEMENT...');

              await db.db.runAsync('DELETE FROM rappels');
              await db.db.runAsync('DELETE FROM depenses');
              await db.db.runAsync('DELETE FROM objectifs');
              await db.db.runAsync('DELETE FROM templates');
              await db.db.runAsync('DELETE FROM produits');
              await db.db.runAsync('DELETE FROM paiements');
              await db.db.runAsync('DELETE FROM ventes');
              await db.db.runAsync('DELETE FROM clients');
              
              try {
                await db.db.runAsync('DELETE FROM uuid_mappings');
              } catch (error: any) {
                if (error.message && error.message.includes('no such table')) {
                  console.log('  ⚠️ Table uuid_mappings inexistante (ignoré)');
                } else {
                  throw error;
                }
              }

              console.log('✅ Données locales supprimées (serveur intact)');

              Alert.alert(
                'Succès',
                'Données locales supprimées. Utilisez "📥 Recevoir du Serveur" pour récupérer vos données.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('❌ Erreur:', error);
              Alert.alert('Erreur', error.message || 'Erreur lors de la suppression');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      '⚠️ Supprimer TOUTES les données',
      `Cette action va SUPPRIMER DÉFINITIVEMENT :
• ${clients.length} clients
• ${ventes.length} ventes
• ${templates.length} templates
• Toutes les autres données

Cette action est IRRÉVERSIBLE et supprimera également les données du serveur lors de la prochaine synchronisation.

Êtes-vous ABSOLUMENT sûr ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'SUPPRIMER TOUT',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSyncing(true);
              const db = getDatabaseInstance();
              
              if (!db) {
                Alert.alert('Erreur', 'Base de données non initialisée');
                setIsSyncing(false);
                return;
              }

              console.log('🗑️ Suppression de toutes les données...');

              // Supprimer dans l'ordre : dépendances d'abord
              console.log('  1. Suppression des rappels...');
              await db.db.runAsync('DELETE FROM rappels');
              
              console.log('  2. Suppression des dépenses...');
              await db.db.runAsync('DELETE FROM depenses');
              
              console.log('  3. Suppression des objectifs...');
              await db.db.runAsync('DELETE FROM objectifs');
              
              console.log('  4. Suppression des templates...');
              await db.db.runAsync('DELETE FROM templates');
              
              console.log('  5. Suppression des produits...');
              await db.db.runAsync('DELETE FROM produits');
              
              console.log('  6. Suppression des paiements...');
              await db.db.runAsync('DELETE FROM paiements');
              
              console.log('  7. Suppression des ventes...');
              await db.db.runAsync('DELETE FROM ventes');
              
              console.log('  8. Suppression des clients...');
              await db.db.runAsync('DELETE FROM clients');
              
              console.log('  9. Suppression des mappings UUID...');
              try {
                await db.db.runAsync('DELETE FROM uuid_mappings');
              } catch (error: any) {
                if (error.message && error.message.includes('no such table')) {
                  console.log('  ⚠️ Table uuid_mappings inexistante (ignoré)');
                } else {
                  throw error;
                }
              }

              console.log('✅ Toutes les données locales supprimées');

              // Déclencher une synchronisation pour supprimer sur le serveur aussi
              console.log('📤 Synchronisation vers le serveur...');
              await syncService.syncToServer();

              Alert.alert(
                'Succès',
                'Toutes les données ont été supprimées localement et synchronisées avec le serveur.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Recharger l'application pour mettre à jour l'UI
                      console.log('🔄 Rechargement de l\'application...');
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('❌ Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message || 'Erreur lors de la suppression des données');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const stats = {
    totalClients: clients.length,
    totalVentes: ventes.length,
    totalRevenu: ventes.reduce((sum, v) => sum + v.total, 0),
    totalCredits: ventes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBgEffect} />
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings" size={24} color={Colors.secondary} />
          </View>
          <Text style={styles.headerTitle}>Paramètres</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Statistiques Générales */}
        <Card style={styles.statsCard}>
          <CardContent style={styles.statsContent}>
            <Text style={styles.sectionTitle}>Statistiques Générales</Text>
            
            <View style={styles.statsList}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={20} color={Colors.primary} />
                <Text style={styles.statLabel}>Total Clients</Text>
                <Text style={styles.statValue}>{stats.totalClients}</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="cart" size={20} color={Colors.accent} />
                <Text style={styles.statLabel}>Total Ventes</Text>
                <Text style={styles.statValue}>{stats.totalVentes}</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="cash" size={20} color={Colors.secondary} />
                <Text style={styles.statLabel}>Revenu Total</Text>
                <Text style={styles.statValue}>{formatCurrency(stats.totalRevenu)}</Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="card" size={20} color={Colors.warning} />
                <Text style={styles.statLabel}>Ventes à Crédit</Text>
                <Text style={styles.statValue}>{stats.totalCredits}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Synchronisation Manuelle (Debug) */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sync" size={20} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Synchronisation (Debug)</Text>
            </View>

            <Button
              title="📊 Voir Statistiques DB"
              onPress={handleShowDatabaseStats}
              variant="outline"
              fullWidth
              icon={<Ionicons name="analytics" size={20} color={Colors.secondary} />}
              style={styles.exportButton}
            />

            <Button
              title="🧹 Nettoyer Données Corrompues"
              onPress={handleCleanupCorruptedData}
              variant="outline"
              fullWidth
              loading={isSyncing}
              icon={<Ionicons name="trash" size={20} color={Colors.warning} />}
              style={styles.exportButton}
            />

            <Button
              title="📤 Envoyer vers Serveur (syncToServer)"
              onPress={handleManualSyncToServer}
              variant="outline"
              fullWidth
              loading={isSyncing}
              icon={<Ionicons name="cloud-upload" size={20} color={Colors.accent} />}
              style={styles.exportButton}
            />

            <Button
              title="📥 Recevoir du Serveur (syncFromServer)"
              onPress={handleManualSyncFromServer}
              variant="outline"
              fullWidth
              loading={isSyncing}
              icon={<Ionicons name="cloud-download" size={20} color={Colors.accent} />}
              style={styles.exportButton}
            />
          </CardContent>
        </Card>

        {/* Export */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="download" size={20} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Export de Données</Text>
            </View>

            <Button
              title="Exporter les Clients (CSV)"
              onPress={handleExportClients}
              variant="outline"
              fullWidth
              loading={isExporting}
              icon={<Ionicons name="people" size={20} color={Colors.secondary} />}
              style={styles.exportButton}
            />

            <Button
              title="Exporter les Ventes (CSV)"
              onPress={handleExportVentes}
              variant="outline"
              fullWidth
              loading={isExporting}
              icon={<Ionicons name="cart" size={20} color={Colors.secondary} />}
              style={styles.exportButton}
            />
          </CardContent>
        </Card>

        {/* Templates WhatsApp */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="logo-whatsapp" size={20} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Templates WhatsApp</Text>
            </View>

            {templates.map((template) => (
              <View key={template.id} style={styles.templateItem}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.nom}</Text>
                  <Text style={styles.templateMessage} numberOfLines={2}>
                    {template.message}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Supprimer le template',
                      `Êtes-vous sûr de vouloir supprimer "${template.nom}" ?`,
                      [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Supprimer',
                          style: 'destructive',
                          onPress: () => deleteTemplate(template.id!),
                        },
                      ]
                    );
                  }}
                  style={styles.deleteTemplateButton}
                >
                  <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* À Propos */}
        <Card style={styles.section}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={20} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>À Propos</Text>
            </View>

            <View style={styles.aboutInfo}>
              <Text style={styles.appName}>Kame Daay</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appDescription}>
                Application de gestion client et ventes hors ligne pour femmes entrepreneuses
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Zone Danger */}
        <Card style={[styles.section, styles.dangerSection]}>
          <CardContent style={styles.sectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="warning" size={20} color={Colors.error} />
              <Text style={[styles.sectionTitle, { color: Colors.error }]}>Zone Danger</Text>
            </View>

            <Text style={styles.dangerText}>
              ⚠️ ATTENTION : Ces actions sont irréversibles !
            </Text>

            <Button
              title="🗑️ Supprimer Données Locales Uniquement"
              onPress={handleDeleteLocalDataOnly}
              variant="outline"
              fullWidth
              loading={isSyncing}
              icon={<Ionicons name="phone-portrait" size={20} color={Colors.warning} />}
              style={styles.exportButton}
            />

            <Button
              title="🗑️🌐 Supprimer TOUT (Local + Serveur)"
              onPress={handleDeleteAllData}
              variant="outline"
              fullWidth
              loading={isSyncing}
              icon={<Ionicons name="trash" size={20} color={Colors.error} />}
              style={styles.dangerButton}
              textStyle={{ color: Colors.error }}
            />
          </CardContent>
        </Card>
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
  statsCard: {
    marginBottom: 16,
    backgroundColor: '#FFFBF0',
  },
  statsContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
  },
  statsList: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  section: {
    marginBottom: 16,
  },
  sectionContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  exportButton: {
    marginBottom: 12,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  templateMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  deleteTemplateButton: {
    padding: 8,
  },
  aboutInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  dangerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  dangerButton: {
    borderColor: Colors.error,
  },
});
