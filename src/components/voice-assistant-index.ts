/**
 * 🎤 Index pour l'Assistant Vocal Kame Daay
 * Exporte tous les composants et utilitaires liés à l'assistant vocal
 */

// Composants principaux
export { default as VoiceAssistant } from './VoiceAssistant';
export { default as FloatingVoiceButton } from './FloatingVoiceButton';

// Bibliothèque de traitement wolof
export {
  wolofDictionary,
  wolofPhrases,
  normalizeText,
  translateWolofToFrench,
  detectLanguage,
  extractIntent,
  generateResponse,
  audioFeedback,
} from '../lib/wolof-speech';

// Types
export type {
  VoiceCommand,
  VoiceAssistantProps,
} from './VoiceAssistant';
