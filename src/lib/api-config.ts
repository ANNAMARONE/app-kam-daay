/**
 * Configuration de l'API MySQL pour Kame Daay Mobile
 * 
 * Ce fichier remplace supabase-config.ts pour utiliser MySQL
 */

import { getBackendUrl } from './network-helper';

// ⚠️ IMPORTANT : L'IP est détectée automatiquement via Expo
// Si ça ne fonctionne pas, remplace DEV_API_URL par ton IP manuellement
// Exemple : const DEV_API_URL = 'http://192.168.1.105:3001/api';

/**
 * URL de développement - Détection automatique de l'IP
 */
const DEV_API_URL = __DEV__ ? getBackendUrl(3001) : 'http://localhost:3001/api/';

/**
 * URL de production
 * 
 * À modifier quand vous déployez en production
 * Exemple : https://api.kamedaay.com/api
 */
const PROD_API_URL = 'https://votre-domaine.com/api';

/**
 * Configuration de l'API
 */
export const API_CONFIG = {
  // URL de développement (localhost ou IP locale)
  DEV_URL: DEV_API_URL,
  
  // URL de production
  PROD_URL: PROD_API_URL,
  
  // URL active basée sur l'environnement
  BASE_URL: __DEV__ ? DEV_API_URL : PROD_API_URL,
  
  // Timeout pour les requêtes (en millisecondes)
  TIMEOUT: 30000, // 30 secondes
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

/**
 * Obtenir l'URL de base de l'API
 */
export const getApiUrl = (): string => {
  return API_CONFIG.BASE_URL;
};

/**
 * Obtenir les headers par défaut
 */
export const getDefaultHeaders = (): Record<string, string> => {
  return API_CONFIG.DEFAULT_HEADERS;
};

/**
 * Obtenir les headers avec authentification
 */
export const getAuthHeaders = (token: string): Record<string, string> => {
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Vérifier si l'API est accessible
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiUrl()}/health`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

/**
 * Helper pour faire des requêtes API
 */
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> => {
  const url = `${getApiUrl()}${endpoint}`;
  const headers = token ? getAuthHeaders(token) : getDefaultHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Export de compatibilité pour faciliter la migration depuis Supabase
export const SERVER_URL = getApiUrl();
