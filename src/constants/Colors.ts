/**
 * Palette de Couleurs Kame Daay
 * 
 * Couleurs professionnelles adaptées au contexte sénégalais
 * et optimisées pour la lisibilité sur mobile
 */

export const Colors = {
  // Couleurs Principales
  primary: '#FFD700',        // Jaune Solaire - Actions principales
  primaryDark: '#FFC700',    // Jaune foncé - Hover states
  primaryLight: '#FFED4E',   // Jaune clair - Backgrounds
  
  secondary: '#004D40',      // Bleu Confiance - Headers, navigation
  secondaryDark: '#00332E',  // Bleu très foncé
  secondaryLight: '#00695C', // Bleu clair
  
  accent: '#8BC34A',         // Vert Succès - Indicateurs positifs
  accentDark: '#7CB342',     // Vert foncé
  accentLight: '#AED581',    // Vert clair
  
  // Couleurs de Base
  white: '#FFFFFF',
  black: '#000000',
  gray: '#F5F5F5',
  grayDark: '#666666',
  grayLight: '#E0E0E0',
  
  // Couleurs Sémantiques
  success: '#8BC34A',
  warning: '#FFA726',
  error: '#FF4444',
  info: '#29B6F6',
  
  // Couleurs de Status
  paid: '#8BC34A',           // Vert pour payé
  credit: '#FFD700',         // Jaune pour crédit
  partial: '#FFA726',        // Orange pour partiel
  
  // Backgrounds
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#FAFAFA',
  
  // Texte
  text: '#000000',
  textSecondary: '#666666',
  textLight: '#999999',
  textInverse: '#FFFFFF',
  
  // Bordures et Séparateurs
  border: 'rgba(0, 77, 64, 0.15)',
  borderDark: 'rgba(0, 77, 64, 0.3)',
  separator: '#E0E0E0',
  
  // Ombres
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Graphiques
  chart1: '#FFD700',
  chart2: '#8BC34A',
  chart3: '#004D40',
  chart4: '#FFA726',
  chart5: '#26A69A',
};

// Styles de couleurs réutilisables
export const ColorStyles = {
  primaryButton: {
    backgroundColor: Colors.primary,
    color: Colors.secondary,
  },
  secondaryButton: {
    backgroundColor: Colors.secondary,
    color: Colors.white,
  },
  successButton: {
    backgroundColor: Colors.accent,
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  header: {
    backgroundColor: Colors.secondary,
    color: Colors.white,
  },
};

export default Colors;
