import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useStore } from '../lib/store';
import { formatCurrency, formatDate, formatPhone } from '../lib/utils';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import Colors from '../constants/Colors';

interface ClientDetailProps {
  client: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function ClientDetail({ client, onClose, onEdit }: ClientDetailProps) {
  const { ventes, paiements, deleteClient } = useStore();
  const [clientVentes, setClientVentes] = useState<any[]>([]);
  const [totalVentes, setTotalVentes] = useState(0);
  const [totalPaye, setTotalPaye] = useState(0);
  const [credit, setCredit] = useState(0);

  useEffect(() => {
    if (client?.id) {
      loadClientData();
    }
  }, [client?.id, ventes, paiements]);

  const loadClientData = () => {
    // Récupérer les ventes du client
    const ventesDuClient = ventes.filter(v => v.clientId === client.id);
    setClientVentes(ventesDuClient.sort((a, b) => b.date - a.date));

    // Calculer les totaux en utilisant montantPaye de chaque vente
    const total = ventesDuClient.reduce((sum, v) => sum + (v.total || 0), 0);
    setTotalVentes(total);

    // Calculer le total payé à partir des ventes (montantPaye)
    const paye = ventesDuClient.reduce((sum, v) => sum + (v.montantPaye || 0), 0);
    setTotalPaye(paye);

    // Le crédit est la différence entre le total des ventes et le montant payé
    setCredit(total - paye);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer ${client.prenom} ${client.nom} ?\n\nToutes les ventes associées seront également supprimées.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(client.id);
              Toast.show({
                type: 'success',
                text1: 'Client supprimé',
                text2: `${client.prenom} ${client.nom} a été supprimé`,
              });
              onClose();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: 'Impossible de supprimer le client',
              });
            }
          },
        },
      ]
    );
  };

  const sendWhatsAppMessage = async (message: string) => {
    try {
      const cleanPhone = client.telephone.replace(/\D/g, '');
      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp');
    }
  };

  const demanderNote = () => {
    const message = `Bonjour ${client.prenom},\n\nNous espérons que vous êtes satisfait(e) de nos services. Pourriez-vous nous laisser un avis ? Cela nous aide beaucoup à nous améliorer.\n\nMerci de votre confiance ! 🙏`;
    sendWhatsAppMessage(message);
  };

  const envoyerRappel = () => {
    const message = `Bonjour ${client.prenom},\n\nCeci est un rappel concernant votre crédit de ${formatCurrency(credit)} FCFA.\n\nMerci de régler votre compte dès que possible.\n\nCordialement.`;
    sendWhatsAppMessage(message);
  };

  const ouvrirWhatsApp = () => {
    sendWhatsAppMessage('');
  };

  const appellerClient = async () => {
    try {
      const url = `tel:${client.telephone}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'Impossible de passer l\'appel');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de passer l\'appel');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* En-tête avec avatar */}
      <View style={styles.header}>
        <View style={[styles.avatar, credit > 0 && styles.avatarCredit]}>
          <Text style={styles.avatarText}>
            {client.prenom.charAt(0)}{client.nom.charAt(0)}
          </Text>
          {client.type === 'Fidèle' && (
            <View style={styles.starBadge}>
              <Ionicons name="star" size={14} color={Colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.clientName}>
          {client.prenom} {client.nom}
        </Text>
        {client.type && (
          <View style={[
            styles.typeBadge,
            client.type === 'Fidèle' && styles.typeBadgeFidele,
            client.type === 'Nouveau' && styles.typeBadgeNouveau,
            client.type === 'Potentiel' && styles.typeBadgePotentiel,
          ]}>
            <Text style={[
              styles.typeBadgeText,
              client.type === 'Fidèle' && styles.typeBadgeTextFidele,
              client.type === 'Nouveau' && styles.typeBadgeTextNouveau,
              client.type === 'Potentiel' && styles.typeBadgeTextPotentiel,
            ]}>
              {client.type}
            </Text>
          </View>
        )}
      </View>

      {/* Informations de contact */}
      <Card style={styles.card}>
        <CardContent style={styles.cardContent}>
          <TouchableOpacity style={styles.infoRow} onPress={appellerClient}>
            <Ionicons name="call" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>{formatPhone(client.telephone)}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
          {client.adresse && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{client.adresse}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Client depuis le {formatDate(client.createdAt)}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#8BC34A20' }]}>
              <Ionicons name="cart" size={28} color={Colors.accent} />
            </View>
            <Text style={styles.statValue}>{clientVentes.length}</Text>
            <Text style={styles.statLabel}>Ventes</Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFD70020' }]}>
              <Ionicons name="cash" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(totalVentes)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </CardContent>
        </Card>
        <Card style={[styles.statCard, credit > 0 && styles.statCardCredit]}>
          <CardContent style={styles.statContent}>
            <View style={[styles.statIconContainer, credit > 0 ? { backgroundColor: '#FF444420' } : { backgroundColor: '#E0E0E020' }]}>
              <Ionicons name="card" size={28} color={credit > 0 ? Colors.error : Colors.grayDark} />
            </View>
            <Text style={[styles.statValue, credit > 0 && styles.statValueCredit]}>
              {formatCurrency(credit)}
            </Text>
            <Text style={styles.statLabel}>Crédit</Text>
          </CardContent>
        </Card>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={ouvrirWhatsApp}>
          <View style={[styles.actionIcon, { backgroundColor: '#25D36620' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Message WhatsApp</Text>
            <Text style={styles.actionDesc}>Envoyer un message</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayDark} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={demanderNote}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFD70020' }]}>
            <Ionicons name="star" size={24} color={Colors.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Demander une note</Text>
            <Text style={styles.actionDesc}>Demander un avis client</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.grayDark} />
        </TouchableOpacity>

        {credit > 0 && (
          <TouchableOpacity style={styles.actionButton} onPress={envoyerRappel}>
            <View style={[styles.actionIcon, { backgroundColor: '#FF444420' }]}>
              <Ionicons name="notifications" size={24} color={Colors.error} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Rappel de crédit</Text>
              <Text style={styles.actionDesc}>
                Solde: {formatCurrency(credit)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notes */}
      {client.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              <Text style={styles.notesText}>{client.notes}</Text>
            </CardContent>
          </Card>
        </View>
      )}

      {/* Historique des ventes */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Historique des ventes</Text>
        {clientVentes.length === 0 ? (
          <Card style={styles.card}>
            <CardContent style={styles.emptyContent}>
              <Ionicons name="cart-outline" size={48} color={Colors.grayLight} />
              <Text style={styles.emptyText}>Aucune vente</Text>
            </CardContent>
          </Card>
        ) : (
          clientVentes.map((vente, index) => (
            <Card key={vente.id || index} style={styles.venteCard}>
              <CardContent style={styles.venteContent}>
                <View style={styles.venteHeader}>
                  <Text style={styles.venteDate}>{formatDate(vente.date)}</Text>
                  <Text style={styles.venteAmount}>
                    {formatCurrency(vente.total || 0)}
                  </Text>
                </View>
                <View style={styles.venteDetails}>
                  {vente.articles?.map((article: any, idx: number) => (
                    <Text key={idx} style={styles.venteArticle}>
                      • {article.nom} x{article.quantite} - {formatCurrency(article.prixUnitaire)}
                    </Text>
                  ))}
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>

      {/* Boutons d'action */}
      <View style={styles.bottomActions}>
        <Button
          title="Modifier"
          onPress={onEdit}
          variant="primary"
          fullWidth
          icon="pencil"
        />
        <Button
          title="Supprimer"
          onPress={handleDelete}
          variant="outline"
          fullWidth
          icon="trash"
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarCredit: {
    backgroundColor: Colors.error,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.secondary,
  },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeFidele: {
    backgroundColor: '#E8F5E9',
  },
  typeBadgeNouveau: {
    backgroundColor: '#E3F2FD',
  },
  typeBadgePotentiel: {
    backgroundColor: '#FFF9C4',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeTextFidele: {
    color: '#2E7D32',
  },
  typeBadgeTextNouveau: {
    color: '#1565C0',
  },
  typeBadgeTextPotentiel: {
    color: '#F57F17',
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
  },
  statCardCredit: {
    borderColor: Colors.error,
    borderWidth: 1,
  },
  statContent: {
    padding: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
  },
  statValueCredit: {
    color: Colors.error,
  },
  actionsContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  notesContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  notesText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  historyContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  venteCard: {
    marginBottom: 12,
  },
  venteContent: {
    padding: 12,
  },
  venteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venteDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  venteAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  venteDetails: {
    gap: 4,
  },
  venteArticle: {
    fontSize: 14,
    color: Colors.text,
  },
  emptyContent: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  bottomActions: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
});