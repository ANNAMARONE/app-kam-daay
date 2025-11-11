/**
 * 🤖 Assistant IA Local pour Kame Daay
 * Fonctionne 100% hors ligne avec algorithmes locaux
 */

import { KameDaayDatabase, Client, Vente, Paiement } from './database';

// Types
export interface ClientRiskScore {
  clientId: number;
  clientName: string;
  riskLevel: 'low' | 'medium' | 'high';
  score: number; // 0-100
  reasons: string[];
  recommendation: string;
}

export interface SmartReminder {
  clientId: number;
  clientName: string;
  phoneNumber: string;
  montant: number;
  priority: 'high' | 'medium' | 'low';
  bestTimeToContact: string;
  messageTemplate: string;
  daysSinceLastPayment: number;
}

export interface BusinessInsight {
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  message: string;
  action?: string;
  priority: number;
}

export interface AnomalyDetection {
  type: 'unusual_amount' | 'duplicate' | 'high_credit';
  severity: 'low' | 'medium' | 'high';
  message: string;
  data: any;
}

// 🆕 Nouveaux types pour les fonctionnalités avancées
export interface SalesForecast {
  currentMonth: {
    total: number;
    daysElapsed: number;
    daysRemaining: number;
  };
  prediction: {
    estimatedTotal: number;
    confidence: 'high' | 'medium' | 'low';
    growthVsLastMonth: number;
    message: string;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendation: string;
}

export interface ClientVIPScore {
  clientId: number;
  clientName: string;
  tier: 'platine' | 'or' | 'argent' | 'bronze' | 'standard';
  score: number; // 0-100
  totalSpent: number;
  nbPurchases: number;
  avgPurchase: number;
  lastPurchaseDays: number;
  benefits: string[];
  nextTierScore: number;
  nextTierName: string;
}

export interface BusinessCoaching {
  dailyTip: {
    emoji: string;
    title: string;
    message: string;
    actionable: boolean;
  };
  weeklyInsights: {
    bestDay: string;
    worstDay: string;
    bestProduct?: string;
    topClient: string;
  };
  opportunities: {
    type: 'win_back' | 'upsell' | 'thank_you';
    clientName: string;
    message: string;
    priority: number;
  }[];
  warnings: {
    type: 'cash_flow' | 'client_loss' | 'low_sales';
    message: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

/**
 * 🎯 Classe principale de l'Assistant IA
 */
export class AIAssistant {
  private db: KameDaayDatabase | null = null;

  async initialize() {
    if (!this.db) {
      this.db = await KameDaayDatabase.initialize();
    }
    return this.db;
  }

  /**
   * ⚠️ Calcule le score de risque pour chaque client avec crédit
   */
  async calculateCreditRiskScores(): Promise<ClientRiskScore[]> {
    await this.initialize();
    const clients = await this.db!.getAllClients();
    const ventes = await this.db!.getAllVentes();
    const paiements = await this.db!.getAllPaiements();

    // Adapter les données au format attendu
    const clientsWithCredit = clients.filter(c => {
      const clientVentes = ventes.filter(v => v.clientId === c.id);
      const totalCredit = clientVentes
        .filter(v => v.statut === 'Crédit' || v.statut === 'Partiel')
        .reduce((sum, v) => sum + (v.total - v.montantPaye), 0);
      return totalCredit > 0;
    });

    const scores: ClientRiskScore[] = [];

    for (const client of clientsWithCredit) {
      const clientVentes = ventes.filter(v => v.clientId === client.id);
      const clientPaiements = paiements.filter(p => 
        clientVentes.some(v => v.id === p.venteId)
      );

      let score = 50; // Score de base
      const reasons: string[] = [];

      // Facteur 1: Historique de paiement (±30 points)
      const ventesAvecCredit = clientVentes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel');
      if (ventesAvecCredit.length > 0) {
        const ventesPayees = ventesAvecCredit.filter(v => v.statut === 'Payé');
        const tauxPaiement = ventesPayees.length / ventesAvecCredit.length;
        
        if (tauxPaiement >= 0.9) {
          score -= 20;
          reasons.push('✅ Excellent historique de paiement');
        } else if (tauxPaiement >= 0.7) {
          score -= 10;
          reasons.push('✓ Bon historique de paiement');
        } else if (tauxPaiement < 0.5) {
          score += 25;
          reasons.push('⚠️ Historique de paiement faible');
        }
      }

      // Facteur 2: Ancienneté client (±15 points)
      const firstVente = clientVentes.sort((a, b) => a.date - b.date)[0];
      
      if (firstVente) {
        const daysSinceFirst = Math.floor(
          (Date.now() - firstVente.date) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceFirst > 180) {
          score -= 15;
          reasons.push('✅ Client fidèle (>6 mois)');
        } else if (daysSinceFirst < 30) {
          score += 10;
          reasons.push('⚠️ Nouveau client (<1 mois)');
        }
      }

      // Facteur 3: Montant du crédit actuel (±20 points)
      const creditActuel = ventesAvecCredit.reduce((sum, v) => sum + (v.total - v.montantPaye), 0);
      const moyenneVentes = clientVentes.length > 0
        ? clientVentes.reduce((sum, v) => sum + v.total, 0) / clientVentes.length
        : 0;

      if (creditActuel > moyenneVentes * 3) {
        score += 20;
        reasons.push('⚠️ Crédit élevé par rapport à la moyenne');
      } else if (creditActuel < moyenneVentes) {
        score -= 10;
        reasons.push('✓ Crédit raisonnable');
      }

      // Facteur 4: Retards de paiement (±25 points)
      const ventesEnRetard = ventesAvecCredit.filter(v => {
        if (v.statut === 'Payé') return false;
        const daysSince = Math.floor(
          (Date.now() - v.date) / (1000 * 60 * 60 * 24)
        );
        return daysSince > 30;
      });

      if (ventesEnRetard.length > 3) {
        score += 25;
        reasons.push(`🔴 ${ventesEnRetard.length} paiements en retard`);
      } else if (ventesEnRetard.length > 0) {
        score += 10;
        reasons.push(`⚠️ ${ventesEnRetard.length} paiement(s) en retard`);
      }

      // Facteur 5: Régularité des achats (±10 points)
      if (clientVentes.length >= 5) {
        const dates = clientVentes.map(v => v.date);
        dates.sort();
        const intervals = [];
        for (let i = 1; i < dates.length; i++) {
          intervals.push(dates[i] - dates[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, val) => 
          sum + Math.pow(val - avgInterval, 2), 0
        ) / intervals.length;
        
        if (variance < avgInterval * 0.3) {
          score -= 10;
          reasons.push('✅ Achats réguliers');
        }
      }

      // Normaliser le score entre 0 et 100
      score = Math.max(0, Math.min(100, score));

      // Déterminer le niveau de risque
      let riskLevel: 'low' | 'medium' | 'high';
      let recommendation: string;

      if (score < 35) {
        riskLevel = 'low';
        recommendation = 'Client fiable. Vous pouvez continuer à accorder des crédits.';
      } else if (score < 65) {
        riskLevel = 'medium';
        recommendation = 'Prudence recommandée. Surveillez les paiements de près.';
      } else {
        riskLevel = 'high';
        recommendation = 'Risque élevé. Privilégiez les paiements comptant ou réduisez le crédit.';
      }

      const clientName = `${client.prenom} ${client.nom}`;

      scores.push({
        clientId: client.id!,
        clientName,
        riskLevel,
        score,
        reasons,
        recommendation
      });
    }

    // Trier par score décroissant (plus risqués en premier)
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * 📱 Génère des suggestions intelligentes de relances
   */
  async getSmartReminders(): Promise<SmartReminder[]> {
    await this.initialize();
    const clients = await this.db!.getAllClients();
    const ventes = await this.db!.getAllVentes();

    const reminders: SmartReminder[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    for (const client of clients) {
      const clientVentes = ventes.filter(v => v.clientId === client.id);
      const creditActuel = clientVentes
        .filter(v => v.statut === 'Crédit' || v.statut === 'Partiel')
        .reduce((sum, v) => sum + (v.total - v.montantPaye), 0);

      if (creditActuel === 0) continue;
      
      // Vérifier que le client a un numéro de téléphone
      if (!client.telephone || client.telephone.trim() === '') continue;

      const ventesCredit = clientVentes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel');
      if (ventesCredit.length === 0) continue;

      // Trouver la vente la plus ancienne non payée
      const oldestVente = ventesCredit.sort((a, b) => a.date - b.date)[0];

      const daysSince = Math.floor(
        (now.getTime() - oldestVente.date) / (1000 * 60 * 60 * 24)
      );

      // Calculer la priorité
      let priority: 'high' | 'medium' | 'low';
      if (daysSince > 30 || creditActuel > 50000) {
        priority = 'high';
      } else if (daysSince > 14 || creditActuel > 20000) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Déterminer le meilleur moment pour contacter
      let bestTimeToContact: string;
      if (currentHour < 9) {
        bestTimeToContact = 'Ce matin (9h-12h)';
      } else if (currentHour < 14) {
        bestTimeToContact = 'Cet après-midi (14h-17h)';
      } else if (currentHour < 18) {
        bestTimeToContact = 'En fin de journée (17h-19h)';
      } else {
        bestTimeToContact = 'Demain matin (9h-12h)';
      }

      // Générer le message personnalisé
      const clientName = `${client.prenom} ${client.nom}`;
      const messageTemplate = this.generateWhatsAppMessage(clientName, creditActuel, daysSince);

      reminders.push({
        clientId: client.id!,
        clientName,
        phoneNumber: client.telephone,
        montant: creditActuel,
        priority,
        bestTimeToContact,
        messageTemplate,
        daysSinceLastPayment: daysSince
      });
    }

    // Trier par priorité et montant
    return reminders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.montant - a.montant;
    });
  }

  /**
   * 💬 Génère un message WhatsApp personnalisé et intelligent
   */
  private generateWhatsAppMessage(clientName: string, montant: number, daysSince: number): string {
    const firstName = clientName.split(' ')[0];
    const montantFormate = new Intl.NumberFormat('fr-FR').format(montant);

    // Messages selon le contexte
    if (daysSince < 7) {
      return `Bonjour ${firstName} ! 😊\n\nJ'espère que vous allez bien. Je me permets de vous rappeler votre crédit de ${montantFormate} CFA.\n\nMerci beaucoup ! 🙏`;
    } else if (daysSince < 14) {
      return `Bonjour ${firstName},\n\nComment allez-vous ? Je vous contacte pour votre crédit de ${montantFormate} CFA.\n\nPouvez-vous me faire un paiement bientôt ?\n\nMerci infiniment ! 💚`;
    } else if (daysSince < 30) {
      return `Bonjour ${firstName},\n\nJ'espère que tout va bien de votre côté. Votre crédit de ${montantFormate} CFA est en attente depuis un moment.\n\nPouvons-nous arranger un paiement cette semaine ?\n\nJe compte sur vous ! 🙏`;
    } else {
      return `Bonjour ${firstName},\n\nJ'espère que vous allez bien. Je me permets de vous relancer concernant votre crédit de ${montantFormate} CFA.\n\nC'est important pour moi. Pouvons-nous en discuter ?\n\nMerci de votre compréhension. 🙏`;
    }
  }

  /**
   * 💡 Génère des insights et conseils automatiques
   */
  async getBusinessInsights(): Promise<BusinessInsight[]> {
    await this.initialize();
    const insights: BusinessInsight[] = [];
    const clients = await this.db!.getAllClients();
    const ventes = await this.db!.getAllVentes();

    // Calculer les stats basiques
    const ventesCredit = ventes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel');
    const totalCredits = ventesCredit.reduce((sum, v) => sum + (v.total - v.montantPaye), 0);
    const nbCredits = ventesCredit.length;

    // Calcul du total mensuel
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const ventesThisMonth = ventes.filter(v => {
      const venteDate = new Date(v.date);
      return venteDate.getMonth() === thisMonth && venteDate.getFullYear() === thisYear;
    });
    const monthlyTotal = ventesThisMonth.reduce((sum, v) => sum + v.total, 0);
    const objectifMensuel = 500000; // Fixé à 500k CFA
    const progressionObjectif = (monthlyTotal / objectifMensuel) * 100;

    // Insight 1: Crédits élevés
    if (totalCredits > 50000) {
      insights.push({
        type: 'warning',
        title: '⚠️ Crédits importants',
        message: `Vous avez ${new Intl.NumberFormat('fr-FR').format(totalCredits)} CFA de crédits. Pensez à relancer vos clients pour améliorer votre trésorerie.`,
        action: 'Voir les relances',
        priority: 90
      });
    }

    // Insight 2: Beaucoup de clients en crédit
    if (nbCredits >= 5) {
      insights.push({
        type: 'warning',
        title: '📊 Nombreux crédits actifs',
        message: `${nbCredits} clients ont des crédits en cours. Utilisez les messages WhatsApp automatiques pour gagner du temps.`,
        action: 'Messages automatiques',
        priority: 80
      });
    }

    // Insight 3: Progression objectif faible
    if (monthlyTotal > 0 && progressionObjectif < 30) {
      insights.push({
        type: 'info',
        title: '🚀 Objectif mensuel',
        message: `Vous êtes à ${progressionObjectif.toFixed(0)}% de votre objectif. Il reste ${new Intl.NumberFormat('fr-FR').format(objectifMensuel - monthlyTotal)} CFA à réaliser.`,
        action: 'Nouvelle vente',
        priority: 70
      });
    }

    // Insight 4: Meilleur jour de vente
    if (ventes.length >= 10) {
      const ventesByDay = ventes.reduce((acc, v) => {
        const day = new Date(v.date).getDay();
        acc[day] = (acc[day] || 0) + v.total;
        return acc;
      }, {} as Record<number, number>);

      const bestDay = Object.entries(ventesByDay).sort((a, b) => b[1] - a[1])[0];
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      insights.push({
        type: 'success',
        title: '📈 Tendance identifiée',
        message: `Votre meilleur jour de vente est le ${dayNames[parseInt(bestDay[0])]} avec ${new Intl.NumberFormat('fr-FR').format(bestDay[1])} CFA en moyenne.`,
        priority: 50
      });
    }

    // Insight 5: Clients VIP (top clients)
    const clientsStats = clients.map(c => {
      const clientVentes = ventes.filter(v => v.clientId === c.id);
      const totalAchats = clientVentes.reduce((sum, v) => sum + v.total, 0);
      return { ...c, totalAchats };
    });
    const clientsVIP = clientsStats.filter(c => c.totalAchats > 100000);
    
    if (clientsVIP.length > 0) {
      insights.push({
        type: 'success',
        title: '⭐ Clients fidèles',
        message: `Vous avez ${clientsVIP.length} client(s) VIP ! Pensez à les remercier pour leur fidélité.`,
        action: 'Voir mes VIP',
        priority: 60
      });
    }

    // Insight 6: Ratio crédit/comptant
    const ventesComptant = ventes.filter(v => v.statut === 'Payé');
    
    if (ventes.length >= 20 && ventesCredit.length > ventesComptant.length * 1.5) {
      insights.push({
        type: 'tip',
        title: '💡 Conseil financier',
        message: `${Math.round(ventesCredit.length / ventes.length * 100)}% de vos ventes sont à crédit. Privilégier le comptant améliorerait votre trésorerie.`,
        priority: 65
      });
    }

    // Insight 7: Croissance mensuelle
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    const ventesLastMonth = ventes.filter(v => {
      const venteDate = new Date(v.date);
      return venteDate.getMonth() === lastMonth && venteDate.getFullYear() === lastYear;
    });
    
    if (ventesThisMonth.length > 0 && ventesLastMonth.length > 0) {
      const totalLastMonth = ventesLastMonth.reduce((sum, v) => sum + v.total, 0);
      const growth = ((monthlyTotal - totalLastMonth) / totalLastMonth) * 100;
      
      if (growth > 10) {
        insights.push({
          type: 'success',
          title: '🎉 Excellente progression',
          message: `Vos ventes ont augmenté de ${growth.toFixed(0)}% ce mois-ci ! Continuez comme ça !`,
          priority: 95
        });
      } else if (growth < -10) {
        insights.push({
          type: 'warning',
          title: '📉 Baisse d\'activité',
          message: `Vos ventes ont baissé de ${Math.abs(growth).toFixed(0)}% ce mois-ci. Pensez à relancer vos clients.`,
          priority: 85
        });
      }
    }

    // Trier par priorité
    return insights.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 🚨 Détecte les anomalies dans les transactions
   */
  async detectAnomalies(vente: {
    total: number;
    clientId: number;
    statut: string;
  }): Promise<AnomalyDetection[]> {
    await this.initialize();
    const anomalies: AnomalyDetection[] = [];
    const ventes = await this.db!.getAllVentes();
    const client = await this.db!.getClientById(vente.clientId);

    // Anomalie 1: Montant inhabituel
    if (ventes.length >= 5) {
      const montants = ventes.map(v => v.total);
      const moyenne = montants.reduce((a, b) => a + b, 0) / montants.length;
      const ecartType = Math.sqrt(
        montants.reduce((sum, val) => sum + Math.pow(val - moyenne, 2), 0) / montants.length
      );

      if (vente.total > moyenne + (ecartType * 3)) {
        anomalies.push({
          type: 'unusual_amount',
          severity: 'high',
          message: `Cette vente de ${new Intl.NumberFormat('fr-FR').format(vente.total)} CFA est 3x plus élevée que votre moyenne (${new Intl.NumberFormat('fr-FR').format(moyenne)} CFA).`,
          data: { montant: vente.total, moyenne }
        });
      }
    }

    // Anomalie 2: Crédit élevé pour un nouveau client
    if (client) {
      const clientVentes = ventes.filter(v => v.clientId === client.id);
      if (clientVentes.length < 3 && (vente.statut === 'Crédit' || vente.statut === 'Partiel') && vente.total > 20000) {
        anomalies.push({
          type: 'high_credit',
          severity: 'medium',
          message: `Attention : Crédit élevé (${new Intl.NumberFormat('fr-FR').format(vente.total)} CFA) pour un client avec peu d'historique.`,
          data: { nbVentes: clientVentes.length }
        });
      }
    }

    // Anomalie 3: Doublon potentiel
    const recentVentes = ventes.filter(v => {
      const diff = Date.now() - v.date;
      return diff < 60000 && v.clientId === vente.clientId; // Moins de 1 minute
    });

    if (recentVentes.length > 0) {
      anomalies.push({
        type: 'duplicate',
        severity: 'high',
        message: `Une vente similaire pour ce client a été enregistrée il y a moins d'une minute. S'agit-il d'un doublon ?`,
        data: { recentVentes }
      });
    }

    return anomalies;
  }

  /**
   * 📊 Analyse les patterns de paiement d'un client
   */
  async analyzeClientBehavior(clientId: number) {
    await this.initialize();
    const ventes = await this.db!.getAllVentes();
    const clientVentes = ventes.filter(v => v.clientId === clientId);

    if (clientVentes.length < 3) {
      return {
        reliability: 'unknown',
        message: 'Pas assez d\'historique pour analyser ce client.'
      };
    }

    const ventesCredit = clientVentes.filter(v => v.statut === 'Crédit' || v.statut === 'Partiel');
    const ventesPayees = clientVentes.filter(v => v.statut === 'Payé');
    const tauxPaiement = ventesPayees.length / clientVentes.length;

    let reliability: 'excellent' | 'good' | 'average' | 'poor';
    let message: string;

    if (tauxPaiement >= 0.9) {
      reliability = 'excellent';
      message = '⭐ Client très fiable ! Toujours paye ses crédits.';
    } else if (tauxPaiement >= 0.7) {
      reliability = 'good';
      message = '✓ Bon client. Paye régulièrement.';
    } else if (tauxPaiement >= 0.5) {
      reliability = 'average';
      message = '⚠️ Client moyen. Surveiller les paiements.';
    } else {
      reliability = 'poor';
      message = '🔴 Historique de paiement faible. Prudence recommandée.';
    }

    return {
      reliability,
      message,
      tauxPaiement: Math.round(tauxPaiement * 100),
      nbVentes: clientVentes.length,
      nbCredits: ventesCredit.length,
      nbPayees: ventesPayees.length
    };
  }

  /**
   * 🔮 NOUVEAU : Prévisions de ventes intelligentes
   */
  async getSalesForecast(): Promise<SalesForecast> {
    await this.initialize();
    const ventes = await this.db!.getAllVentes();
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    
    // Ventes du mois en cours
    const ventesThisMonth = ventes.filter(v => {
      const venteDate = new Date(v.date);
      return venteDate.getMonth() === thisMonth && venteDate.getFullYear() === thisYear;
    });
    
    const currentTotal = ventesThisMonth.reduce((sum, v) => sum + v.total, 0);
    const daysElapsed = currentDay;
    const daysRemaining = daysInMonth - currentDay;
    
    // Calcul de la moyenne journalière
    const dailyAverage = daysElapsed > 0 ? currentTotal / daysElapsed : 0;
    
    // Prédiction basée sur la tendance actuelle
    const estimatedTotal = currentTotal + (dailyAverage * daysRemaining);
    
    // Ventes du mois dernier pour comparaison
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    const ventesLastMonth = ventes.filter(v => {
      const venteDate = new Date(v.date);
      return venteDate.getMonth() === lastMonth && venteDate.getFullYear() === lastYear;
    });
    const totalLastMonth = ventesLastMonth.reduce((sum, v) => sum + v.total, 0);
    
    // Calcul de la croissance prévue
    const growthVsLastMonth = totalLastMonth > 0 
      ? ((estimatedTotal - totalLastMonth) / totalLastMonth) * 100 
      : 0;
    
    // Déterminer la confiance de la prédiction
    let confidence: 'high' | 'medium' | 'low';
    if (daysElapsed >= 15 && ventesThisMonth.length >= 10) {
      confidence = 'high';
    } else if (daysElapsed >= 7 && ventesThisMonth.length >= 5) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    // Analyser la tendance sur les 3 derniers mois
    const last3Months = [];
    for (let i = 0; i < 3; i++) {
      const m = thisMonth - i - 1;
      const y = m < 0 ? thisYear - 1 : thisYear;
      const month = m < 0 ? m + 12 : m;
      
      const monthVentes = ventes.filter(v => {
        const venteDate = new Date(v.date);
        return venteDate.getMonth() === month && venteDate.getFullYear() === y;
      });
      
      last3Months.push(monthVentes.reduce((sum, v) => sum + v.total, 0));
    }
    
    // Déterminer la tendance
    let trend: 'increasing' | 'stable' | 'decreasing';
    if (last3Months.length >= 2) {
      const recentAvg = (last3Months[0] + last3Months[1]) / 2;
      const olderAvg = last3Months[2] || recentAvg;
      
      if (recentAvg > olderAvg * 1.1) {
        trend = 'increasing';
      } else if (recentAvg < olderAvg * 0.9) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }
    } else {
      trend = 'stable';
    }
    
    // Générer le message prédictif
    let message: string;
    if (growthVsLastMonth > 20) {
      message = `🚀 Excellent mois ! Vous êtes en route pour dépasser le mois dernier de ${Math.round(growthVsLastMonth)}% !`;
    } else if (growthVsLastMonth > 0) {
      message = `📈 Bon mois en perspective ! Vous devriez faire ${Math.round(growthVsLastMonth)}% de plus que le mois dernier.`;
    } else if (growthVsLastMonth > -10) {
      message = `📊 Mois stable. Résultat similaire au mois dernier attendu.`;
    } else {
      message = `⚠️ Attention, vous êtes ${Math.abs(Math.round(growthVsLastMonth))}% en dessous du mois dernier. Il faut accélérer !`;
    }
    
    // Recommandation personnalisée
    let recommendation: string;
    if (trend === 'decreasing' && growthVsLastMonth < -10) {
      recommendation = '🎯 Action urgente : Relancez vos meilleurs clients et proposez des promotions !';
    } else if (trend === 'increasing' && growthVsLastMonth > 15) {
      recommendation = '💪 Excellente dynamique ! Maintenez le cap et pensez à récompenser vos clients fidèles.';
    } else if (daysRemaining < 7 && estimatedTotal < totalLastMonth) {
      recommendation = '⚡ Dernière semaine ! Concentrez-vous sur les grosses ventes pour rattraper le retard.';
    } else {
      recommendation = '✅ Continuez sur cette lancée ! Pensez à préparer le stock pour les prochains jours.';
    }
    
    return {
      currentMonth: {
        total: currentTotal,
        daysElapsed,
        daysRemaining
      },
      prediction: {
        estimatedTotal,
        confidence,
        growthVsLastMonth,
        message
      },
      trend,
      recommendation
    };
  }

  /**
   * 🏆 NOUVEAU : Système de scoring VIP clients
   */
  async getClientVIPScores(): Promise<ClientVIPScore[]> {
    await this.initialize();
    const clients = await this.db!.getAllClients();
    const ventes = await this.db!.getAllVentes();
    
    const vipScores: ClientVIPScore[] = [];
    
    for (const client of clients) {
      const clientVentes = ventes.filter(v => v.clientId === client.id);
      
      if (clientVentes.length === 0) continue;
      
      // Calculs de base
      const totalSpent = clientVentes.reduce((sum, v) => sum + v.total, 0);
      const nbPurchases = clientVentes.length;
      const avgPurchase = totalSpent / nbPurchases;
      
      // Dernière visite
      const lastVente = clientVentes.sort((a, b) => b.date - a.date)[0];
      const lastPurchaseDays = Math.floor((Date.now() - lastVente.date) / (1000 * 60 * 60 * 24));
      
      // Calcul du score VIP (0-100)
      let score = 0;
      
      // Critère 1: Montant total dépensé (40 points max)
      if (totalSpent >= 500000) score += 40;
      else if (totalSpent >= 300000) score += 30;
      else if (totalSpent >= 150000) score += 20;
      else if (totalSpent >= 50000) score += 10;
      else score += Math.min(10, (totalSpent / 5000));
      
      // Critère 2: Fréquence d'achat (30 points max)
      if (nbPurchases >= 50) score += 30;
      else if (nbPurchases >= 30) score += 25;
      else if (nbPurchases >= 15) score += 20;
      else if (nbPurchases >= 8) score += 15;
      else score += Math.min(15, nbPurchases * 2);
      
      // Critère 3: Récence (20 points max)
      if (lastPurchaseDays <= 7) score += 20;
      else if (lastPurchaseDays <= 14) score += 15;
      else if (lastPurchaseDays <= 30) score += 10;
      else if (lastPurchaseDays <= 60) score += 5;
      // Aucun point si > 60 jours
      
      // Critère 4: Panier moyen (10 points max)
      if (avgPurchase >= 50000) score += 10;
      else if (avgPurchase >= 30000) score += 8;
      else if (avgPurchase >= 15000) score += 6;
      else if (avgPurchase >= 8000) score += 4;
      else score += Math.min(4, avgPurchase / 2000);
      
      // Déterminer le tier
      let tier: 'platine' | 'or' | 'argent' | 'bronze' | 'standard';
      let benefits: string[];
      let nextTierScore: number;
      let nextTierName: string;
      
      if (score >= 85) {
        tier = 'platine';
        benefits = [
          '⭐ Client VIP Platine',
          '🎁 Priorité absolue',
          '💎 Offres exclusives',
          '🎉 Cadeaux spéciaux',
          '📱 Contact privilégié'
        ];
        nextTierScore = 100;
        nextTierName = 'Maximum atteint !';
      } else if (score >= 70) {
        tier = 'or';
        benefits = [
          '🥇 Client VIP Or',
          '🎁 Remises exclusives',
          '⚡ Service prioritaire',
          '🎊 Cadeaux de fidélité'
        ];
        nextTierScore = 85;
        nextTierName = 'Platine';
      } else if (score >= 50) {
        tier = 'argent';
        benefits = [
          '🥈 Client VIP Argent',
          '💝 Avantages fidélité',
          '📢 Infos en avant-première'
        ];
        nextTierScore = 70;
        nextTierName = 'Or';
      } else if (score >= 30) {
        tier = 'bronze';
        benefits = [
          '🥉 Client Fidèle',
          '✨ Petites attentions'
        ];
        nextTierScore = 50;
        nextTierName = 'Argent';
      } else {
        tier = 'standard';
        benefits = [
          '👤 Client Standard',
          '🌟 Bienvenue !'
        ];
        nextTierScore = 30;
        nextTierName = 'Bronze';
      }
      
      vipScores.push({
        clientId: client.id!,
        clientName: `${client.prenom} ${client.nom}`,
        tier,
        score: Math.round(score),
        totalSpent,
        nbPurchases,
        avgPurchase,
        lastPurchaseDays,
        benefits,
        nextTierScore,
        nextTierName
      });
    }
    
    // Trier par score décroissant
    return vipScores.sort((a, b) => b.score - a.score);
  }

  /**
   * 💡 NOUVEAU : Coach Business Personnalisé
   */
  async getBusinessCoaching(): Promise<BusinessCoaching> {
    await this.initialize();
    const clients = await this.db!.getAllClients();
    const ventes = await this.db!.getAllVentes();
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // === CONSEIL DU JOUR ===
    const dailyTips = [
      {
        emoji: '💰',
        title: 'Optimisez votre trésorerie',
        message: 'Relancez vos clients avec des crédits de plus de 14 jours. Une bonne trésorerie = un business sain !',
        actionable: true
      },
      {
        emoji: '📞',
        title: 'Restez connectée',
        message: 'Envoyez un message à vos 3 meilleurs clients pour les remercier. La fidélisation coûte moins cher que l\'acquisition !',
        actionable: true
      },
      {
        emoji: '📊',
        title: 'Analysez vos données',
        message: 'Consultez vos statistiques pour identifier vos produits stars et ceux à améliorer.',
        actionable: true
      },
      {
        emoji: '',
        title: 'Fixez des objectifs',
        message: 'Un objectif clair = motivation décuplée ! Définissez votre objectif de vente pour aujourd\'hui.',
        actionable: true
      },
      {
        emoji: '🌟',
        title: 'Valorisez vos clients',
        message: 'Les clients satisfaits deviennent vos meilleurs ambassadeurs. Demandez-leur de parler de vous !',
        actionable: false
      },
      {
        emoji: '💪',
        title: 'Persévérance paye',
        message: 'Chaque grande entreprise a commencé petit. Continuez à avancer, les résultats suivront !',
        actionable: false
      },
      {
        emoji: '🎁',
        title: 'Surprenez vos clients',
        message: 'Un petit geste (cadeau, réduction surprise) peut transformer un client en fan !',
        actionable: true
      }
    ];
    
    const dailyTip = dailyTips[dayOfWeek % dailyTips.length];
    
    // === INSIGHTS HEBDOMADAIRES ===
    const last7Days = ventes.filter(v => {
      const diff = now.getTime() - v.date;
      return diff <= 7 * 24 * 60 * 60 * 1000;
    });
    
    const ventesByDay = last7Days.reduce((acc, v) => {
      const day = new Date(v.date).getDay();
      acc[day] = (acc[day] || 0) + v.total;
      return acc;
    }, {} as Record<number, number>);
    
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const sortedDays = Object.entries(ventesByDay).sort((a, b) => b[1] - a[1]);
    
    const bestDay = sortedDays.length > 0 
      ? dayNames[parseInt(sortedDays[0][0])] 
      : 'N/A';
    const worstDay = sortedDays.length > 0 
      ? dayNames[parseInt(sortedDays[sortedDays.length - 1][0])] 
      : 'N/A';
    
    // Top client de la semaine
    const clientsLastWeek = clients.map(c => {
      const clientVentes = last7Days.filter(v => v.clientId === c.id);
      const total = clientVentes.reduce((sum, v) => sum + v.total, 0);
      return { client: c, total };
    }).sort((a, b) => b.total - a.total);
    
    const topClient = clientsLastWeek.length > 0 && clientsLastWeek[0].total > 0
      ? `${clientsLastWeek[0].client.prenom} ${clientsLastWeek[0].client.nom}`
      : 'Aucun';
    
    // === OPPORTUNITÉS ===
    const opportunities: BusinessCoaching['opportunities'] = [];
    
    // 1. Clients à reconquérir (pas d'achat depuis 30+ jours)
    for (const client of clients) {
      const clientVentes = ventes.filter(v => v.clientId === client.id);
      if (clientVentes.length === 0) continue;
      
      const lastVente = clientVentes.sort((a, b) => b.date - a.date)[0];
      const daysSince = Math.floor((now.getTime() - lastVente.date) / (1000 * 60 * 60 * 24));
      
      // Client régulier qui ne revient plus
      if (daysSince >= 30 && daysSince <= 60 && clientVentes.length >= 3) {
        opportunities.push({
          type: 'win_back',
          clientName: `${client.prenom} ${client.nom}`,
          message: `N'a pas acheté depuis ${daysSince} jours. Client régulier à reconquérir !`,
          priority: 85
        });
      }
    }
    
    // 2. Clients VIP à remercier
    const vipClients = clients.map(c => {
      const clientVentes = ventes.filter(v => v.clientId === c.id);
      const total = clientVentes.reduce((sum, v) => sum + v.total, 0);
      return { client: c, total, nbVentes: clientVentes.length };
    }).filter(c => c.total >= 100000).slice(0, 3);
    
    for (const vip of vipClients) {
      opportunities.push({
        type: 'thank_you',
        clientName: `${vip.client.prenom} ${vip.client.nom}`,
        message: `Client VIP (${new Intl.NumberFormat('fr-FR').format(vip.total)} CFA) - Envoyez un message de remerciement !`,
        priority: 70
      });
    }
    
    // === ALERTES ===
    const warnings: BusinessCoaching['warnings'] = [];
    
    // 1. Trésorerie (crédits élevés)
    const creditsTotal = ventes
      .filter(v => v.statut === 'Crédit' || v.statut === 'Partiel')
      .reduce((sum, v) => sum + (v.total - v.montantPaye), 0);
    
    if (creditsTotal > 100000) {
      warnings.push({
        type: 'cash_flow',
        message: `Crédits élevés : ${new Intl.NumberFormat('fr-FR').format(creditsTotal)} CFA. Relancez activement !`,
        severity: 'high'
      });
    } else if (creditsTotal > 50000) {
      warnings.push({
        type: 'cash_flow',
        message: `Surveillez vos crédits : ${new Intl.NumberFormat('fr-FR').format(creditsTotal)} CFA en attente.`,
        severity: 'medium'
      });
    }
    
    // 2. Baisse d'activité
    const last30Days = ventes.filter(v => {
      const diff = now.getTime() - v.date;
      return diff <= 30 * 24 * 60 * 60 * 1000;
    });
    
    const previous30Days = ventes.filter(v => {
      const diff = now.getTime() - v.date;
      return diff > 30 * 24 * 60 * 60 * 1000 && diff <= 60 * 24 * 60 * 60 * 1000;
    });
    
    const recentTotal = last30Days.reduce((sum, v) => sum + v.total, 0);
    const previousTotal = previous30Days.reduce((sum, v) => sum + v.total, 0);
    
    if (previousTotal > 0 && recentTotal < previousTotal * 0.7) {
      warnings.push({
        type: 'low_sales',
        message: `Baisse de ${Math.round((1 - recentTotal / previousTotal) * 100)}% vs le mois dernier. Relancez vos clients !`,
        severity: 'high'
      });
    }
    
    // 3. Perte de clients
    const activeClientsLast30 = new Set(last30Days.map(v => v.clientId));
    const activeClientsPrevious30 = new Set(previous30Days.map(v => v.clientId));
    
    const lostClients = [...activeClientsPrevious30].filter(id => !activeClientsLast30.has(id));
    
    if (lostClients.length >= 3) {
      warnings.push({
        type: 'client_loss',
        message: `${lostClients.length} clients réguliers n'ont pas acheté ce mois-ci. Contactez-les !`,
        severity: 'medium'
      });
    }
    
    // Trier les opportunités par priorité
    opportunities.sort((a, b) => b.priority - a.priority);
    
    return {
      dailyTip,
      weeklyInsights: {
        bestDay,
        worstDay,
        topClient
      },
      opportunities: opportunities.slice(0, 5), // Top 5
      warnings
    };
  }
}

// Export singleton
export const aiAssistant = new AIAssistant();