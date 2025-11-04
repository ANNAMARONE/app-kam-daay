/**
 * Fonctions Utilitaires - Kame Daay
 * Compatible React Native
 */

/**
 * Formate un nombre en devise FCFA
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // Franc CFA
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate une date en format lisible
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formate un numéro de téléphone sénégalais
 */
export function formatPhoneNumber(phone: string): string {
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: +221 XX XXX XX XX ou XX XXX XX XX
  if (cleaned.length === 11 && cleaned.startsWith('221')) {
    // Avec indicatif
    return `+221 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  } else if (cleaned.length === 9) {
    // Sans indicatif
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Alias pour formatPhoneNumber (pour compatibilité)
 */
export function formatPhone(phone: string): string {
  return formatPhoneNumber(phone);
}

/**
 * Calcule le total des ventes du jour
 */
export function calculateDailyTotal(ventes: any[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  return ventes
    .filter(v => {
      const venteDate = new Date(v.date);
      venteDate.setHours(0, 0, 0, 0);
      return venteDate.getTime() === todayTimestamp;
    })
    .reduce((sum, v) => sum + v.total, 0);
}

/**
 * Calcule le total des ventes de la semaine
 */
export function calculateWeeklyTotal(ventes: any[]): number {
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay());
  firstDayOfWeek.setHours(0, 0, 0, 0);
  
  return ventes
    .filter(v => v.date >= firstDayOfWeek.getTime())
    .reduce((sum, v) => sum + v.total, 0);
}

/**
 * Calcule le total des ventes du mois
 */
export function calculateMonthlyTotal(ventes: any[]): number {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return ventes
    .filter(v => v.date >= firstDayOfMonth.getTime())
    .reduce((sum, v) => sum + v.total, 0);
}

/**
 * Obtient le numéro de semaine de l'année
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Obtient le mois et l'année au format YYYY-MM
 */
export function getMonthYear(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Génère un message WhatsApp personnalisé
 */
export function generateWhatsAppMessage(template: string, client: any): string {
  return template
    .replace(/{{nom_client}}/g, `${client.prenom} ${client.nom}`)
    .replace(/{{prenom}}/g, client.prenom)
    .replace(/{{nom}}/g, client.nom)
    .replace(/{{telephone}}/g, client.telephone);
}

/**
 * Valide un numéro de téléphone sénégalais
 */
export function validatePhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  
  // Accepter format local (9 chiffres) ou international (11 chiffres avec 221)
  if (cleaned.length === 9) {
    // Doit commencer par 7 ou 3 (Sonatel/Orange/Expresso)
    return /^[73]/.test(cleaned);
  } else if (cleaned.length === 11) {
    // Doit commencer par 221 puis 7 ou 3
    return /^221[73]/.test(cleaned);
  }
  
  return false;
}

/**
 * Nettoie un numéro de téléphone pour WhatsApp
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Ajouter l'indicatif pays si manquant
  if (cleaned.length === 9 && !cleaned.startsWith('221')) {
    cleaned = '221' + cleaned;
  }
  
  return cleaned;
}

/**
 * Tronque un texte avec ellipse
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalise la première lettre
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Génère un nom de fichier pour l'export CSV
 */
export function generateCSVFilename(prefix: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${dateStr}_${timeStr}.csv`;
}

/**
 * Convertit des données en format CSV
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const csvHeaders = keys.join(',');
  
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Calcule le pourcentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Obtient la couleur du statut
 */
export function getStatusColor(statut: 'Payé' | 'Crédit' | 'Partiel'): string {
  switch (statut) {
    case 'Payé':
      return '#8BC34A';
    case 'Crédit':
      return '#FFD700';
    case 'Partiel':
      return '#FFA726';
    default:
      return '#666666';
  }
}

/**
 * Obtient le label du statut
 */
export function getStatusLabel(statut: 'Payé' | 'Crédit' | 'Partiel'): string {
  switch (statut) {
    case 'Payé':
      return 'Payé';
    case 'Crédit':
      return 'À Crédit';
    case 'Partiel':
      return 'Partiel';
    default:
      return statut;
  }
}

/**
 * Délai (pour debounce, etc.)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Génère un ID unique simple
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
