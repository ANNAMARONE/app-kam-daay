/**
 * 🇸🇳 Bibliothèque de Reconnaissance Vocale Wolof
 * Système intelligent de compréhension vocale Wolof + Français
 * Fonctionne 100% hors ligne avec matching intelligent
 */

// Dictionnaire Wolof -> Français pour les commandes
export const wolofDictionary: Record<string, string[]> = {
    // Vente / Commerce
    jaay: ['vendre', 'vente', 'vends'],
    dund: ['acheter', 'achat'],
    xaalis: ['argent', 'montant', 'prix'],
    ñaata: ['combien', 'total'],
    bàyyi: ['acheter'],
    
    // Clients
    kiliyaan: ['client', 'clients'],
    kiliyaane: ['clients'],
    nit: ['personne', 'gens'],
    
    // Crédit / Dette
    kreedi: ['crédit', 'crédits'],
    dette: ['dette'],
    fey: ['payer', 'payé'],
    noyu: ['donner'],
    jël: ['recevoir', 'prendre'],
    
    // Actions
    woote: ['appeler', 'téléphoner', 'relancer'],
    wax: ['parler', 'dire'],
    gis: ['voir', 'regarder'],
    xayma: ['calculer', 'compter'],
    bind: ['écrire', 'noter'],
    
    // Navigation
    dem: ['aller', 'partir'],
    dellu: ['retourner', 'revenir'],
    
    // Temps
    tay: ['aujourd\'hui'],
    léegi: ['maintenant', 'actuellement'],
    'bi mu jot': ['aujourd\'hui'],
    démb: ['hier'],
    suba: ['demain'],
    
    // Aide
    ndimbal: ['aide', 'aider', 'aidez-moi'],
    yallah: ['s\'il te plaît', 's\'il vous plaît'],
    dimbalima: ['aide-moi', 'aidez-moi'],
    
    // Fermer
    taxaw: ['arrêter', 'stop'],
    dindi: ['fermer', 'fermé'],
    
    // Quantités
    benn: ['un', 'une', '1'],
    ñaar: ['deux', '2'],
    ñett: ['trois', '3'],
    ñeent: ['quatre', '4'],
    juróom: ['cinq', '5'],
    
    // Affirmations
    waaw: ['oui', 'ok', 'd\'accord'],
    déedéet: ['non'],
    
    // Gratitude
    jërëjëf: ['merci'],
    bàgg: ['vouloir', 'aimer'],
    
    // Statut
    baax: ['bien', 'bon'],
    bon: ['bien', 'bon'],
    mu: ['il', 'elle', 'c\'est'],
  };
  
  // Expressions wolof courantes -> Intention
  export const wolofPhrases: Record<string, {
    intent: string;
    keywords: string[];
    confidence: number;
  }> = {
    'dama bëgg jaay': {
      intent: 'nouvelle_vente',
      keywords: ['vente', 'vendre', 'nouvelle'],
      confidence: 0.95,
    },
    'waa bi jaay': {
      intent: 'nouvelle_vente',
      keywords: ['vente', 'vendre'],
      confidence: 0.9,
    },
    'man laa bëgg gis kiliyaane yi': {
      intent: 'liste_clients',
      keywords: ['clients', 'voir', 'liste'],
      confidence: 0.95,
    },
    'ñaata la kreedi': {
      intent: 'total_credits',
      keywords: ['combien', 'crédit', 'total'],
      confidence: 0.9,
    },
    'nga wara woote kiliyaan': {
      intent: 'relances',
      keywords: ['appeler', 'client', 'relancer'],
      confidence: 0.9,
    },
    'jërëjëf': {
      intent: 'merci',
      keywords: ['merci'],
      confidence: 1.0,
    },
    'yallah ma ndimbal': {
      intent: 'aide',
      keywords: ['aide', 'aider'],
      confidence: 0.95,
    },
    'bi mu jot jaay': {
      intent: 'ventes_aujourdhui',
      keywords: ['aujourd\'hui', 'vente'],
      confidence: 0.9,
    },
  };
  
  /**
   * Normalise le texte pour la comparaison
   */
  export function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9\s]/g, ''); // Garder seulement lettres, chiffres et espaces
  }
  
  /**
   * Traduit les mots wolof en français
   */
  export function translateWolofToFrench(text: string): string {
    let translated = text;
    const normalizedText = normalizeText(text);
    
    // Remplacer chaque mot wolof par son équivalent français
    for (const [wolof, french] of Object.entries(wolofDictionary)) {
      const normalizedWolof = normalizeText(wolof);
      const regex = new RegExp(`\\b${normalizedWolof}\\b`, 'gi');
      if (regex.test(normalizedText)) {
        // Utiliser le premier synonyme français
        translated = translated.replace(regex, french[0]);
      }
    }
    
    return translated;
  }
  
  /**
   * Détecte la langue du texte (wolof, français, ou mixte)
   */
  export function detectLanguage(text: string): 'wolof' | 'french' | 'mixed' {
    const normalizedText = normalizeText(text);
    const words = normalizedText.split(/\s+/);
    
    let wolofWordCount = 0;
    let frenchWordCount = 0;
    
    for (const word of words) {
      // Vérifier si c'est un mot wolof
      if (Object.keys(wolofDictionary).some(w => normalizeText(w) === word)) {
        wolofWordCount++;
      } else {
        frenchWordCount++;
      }
    }
    
    if (wolofWordCount === 0 && frenchWordCount > 0) return 'french';
    if (wolofWordCount > 0 && frenchWordCount === 0) return 'wolof';
    return 'mixed';
  }
  
  /**
   * Extrait l'intention de la commande vocale
   */
  export function extractIntent(text: string): {
    intent: string | null;
    confidence: number;
    keywords: string[];
    language: 'wolof' | 'french' | 'mixed';
  } {
    const normalizedText = normalizeText(text);
    const language = detectLanguage(text);
    
    // 1. Chercher dans les phrases wolof prédéfinies
    for (const [phrase, data] of Object.entries(wolofPhrases)) {
      if (normalizedText.includes(normalizeText(phrase))) {
        return {
          intent: data.intent,
          confidence: data.confidence,
          keywords: data.keywords,
          language,
        };
      }
    }
    
    // 2. Traduire le wolof en français et analyser
    const translatedText = translateWolofToFrench(normalizedText);
    
    // 3. Matching par mots-clés
    const intents: Record<string, { keywords: string[]; weight: number }> = {
      nouvelle_vente: {
        keywords: ['vendre', 'vente', 'nouvelle', 'vends', 'jaay', 'dund'],
        weight: 1.0,
      },
      liste_clients: {
        keywords: ['client', 'clients', 'kiliyaan', 'kiliyaane', 'personne', 'nit'],
        weight: 1.0,
      },
      liste_credits: {
        keywords: ['crédit', 'crédits', 'dette', 'kreedi', 'xaalis'],
        weight: 1.0,
      },
      statistiques: {
        keywords: ['statistique', 'statistiques', 'rapport', 'chiffres', 'stats'],
        weight: 1.0,
      },
      relances: {
        keywords: ['relance', 'relancer', 'appeler', 'téléphoner', 'woote'],
        weight: 1.0,
      },
      assistant_ia: {
        keywords: ['assistant', 'aide', 'conseil', 'ndimbal', 'yallah'],
        weight: 0.9,
      },
      total_credits: {
        keywords: ['combien', 'total', 'montant', 'ñaata', 'xaalis'],
        weight: 0.8,
      },
      ventes_aujourdhui: {
        keywords: ['aujourd\'hui', 'tay', 'léegi', 'jour'],
        weight: 0.8,
      },
      aide: {
        keywords: ['aide', 'ndimbal', 'dimbalima', 'help'],
        weight: 0.9,
      },
      fermer: {
        keywords: ['fermer', 'arrêter', 'stop', 'taxaw', 'dindi'],
        weight: 1.0,
      },
    };
    
    // Calculer le score pour chaque intention
    const scores: Record<string, number> = {};
    
    for (const [intent, data] of Object.entries(intents)) {
      let score = 0;
      const matchedKeywords: string[] = [];
      
      for (const keyword of data.keywords) {
        if (translatedText.includes(keyword) || normalizedText.includes(keyword)) {
          score += data.weight;
          matchedKeywords.push(keyword);
        }
      }
      
      if (score > 0) {
        scores[intent] = score;
      }
    }
    
    // Trouver l'intention avec le meilleur score
    const sortedIntents = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    if (sortedIntents.length === 0) {
      return {
        intent: null,
        confidence: 0,
        keywords: [],
        language,
      };
    }
    
    const [bestIntent, bestScore] = sortedIntents[0];
    const confidence = Math.min(1.0, bestScore / 2); // Normaliser entre 0 et 1
    
    return {
      intent: bestIntent,
      confidence,
      keywords: intents[bestIntent].keywords,
      language,
    };
  }
  
  /**
   * Génère une réponse vocale en wolof/français mixte
   */
  export function generateResponse(intent: string, language: 'wolof' | 'french' | 'mixed'): {
    text: string;
    ttsLanguage: string;
  } {
    const responses: Record<string, { wolof: string; french: string; mixed: string }> = {
      nouvelle_vente: {
        wolof: 'Waaw, daal sa jaay bi!',
        french: 'D\'accord, ajoutons une nouvelle vente !',
        mixed: 'Waaw, daal sa nouvelle vente !',
      },
      liste_clients: {
        wolof: 'Kiliyaane yi fi nañu ko!',
        french: 'Voici vos clients !',
        mixed: 'Voici tes kiliyaane yi !',
      },
      liste_credits: {
        wolof: 'Li ame kreedi fi nañu ko!',
        french: 'Voici les crédits !',
        mixed: 'Voici li ame kreedi !',
      },
      statistiques: {
        wolof: 'Statistiques yi fi nañu ko!',
        french: 'Voici vos statistiques !',
        mixed: 'Voici tes stats !',
      },
      relances: {
        wolof: 'Kiliyaane yi nga wara woote!',
        french: 'Clients à relancer !',
        mixed: 'Kiliyaane yi à relancer !',
      },
      assistant_ia: {
        wolof: 'Man ngi fi ci ndimbal!',
        french: 'Je suis là pour vous aider !',
        mixed: 'Man ngi fi pour aider !',
      },
      aide: {
        wolof: 'Ndimbal bu góor nga bëgg?',
        french: 'Quelle aide voulez-vous ?',
        mixed: 'Quelle aide nga bëgg ?',
      },
      fermer: {
        wolof: 'Yalla naa fi! Alhamdulilah!',
        french: 'Au revoir ! À bientôt !',
        mixed: 'Yalla naa fi! À bientôt !',
      },
      merci: {
        wolof: 'Amul solo! Jërëjëf ba ci kanam!',
        french: 'De rien ! Merci à vous aussi !',
        mixed: 'Amul solo! Merci ba ci kanam!',
      },
      unknown: {
        wolof: 'Xam naa ko wax, waaye damay jéem. Wax "ndimbal" pour voir les commandes.',
        french: 'Je n\'ai pas compris. Dites "aide" pour voir les commandes.',
        mixed: 'Xam naa ko wax. Dites "ndimbal" pour l\'aide.',
      },
    };
    
    const response = responses[intent] || responses.unknown;
    
    // Choisir la réponse selon la langue
    let text: string;
    if (language === 'wolof') {
      text = response.wolof;
    } else if (language === 'french') {
      text = response.french;
    } else {
      text = response.mixed;
    }
    
    return {
      text,
      ttsLanguage: 'fr-FR', // Expo Speech ne supporte pas le wolof, on utilise français
    };
  }
  
  /**
   * Système de feedback audio pour les actions
   */
  export const audioFeedback = {
    success: '✅ Waaw! Mu ngi ci!', // Oui ! C'est fait !
    error: '❌ Damay jàmm, problem bu am', // Désolé, il y a un problème
    processing: '⏳ Dama tegal...', // Je travaille dessus...
    listening: '👂 Dama dégg...', // J'écoute...
    thinking: '🤔 Dama xalaat...', // Je réfléchis...
  };
  