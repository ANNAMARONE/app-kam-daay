/**
 * Configuration de l'API MySQL pour Kame Daay Mobile
 * 
 * Ce fichier remplace supabase-config.ts pour utiliser MySQL
 */

import { getBackendUrl } from './network-helper';

// ⚠️ IMPORTANT : Configuration manuelle de l'IP
// Remplace cette IP par l'IP de ton ordinateur
// Pour trouver ton IP : hostname -I | awk '{print $1}'
const MANUAL_IP = '192.168.1.105'; // ⬅️ CHANGE MOI !

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
  // Port du backend
  PORT: 3001,
  
  // Timeout pour les requêtes (en millisecondes)
  TIMEOUT: 30000, // 30 secondes
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

/**
 * Obtenir l'URL de base de l'API
 * 
 * Cette fonction détecte automatiquement l'IP en mode dev,
 * avec fallback sur MANUAL_IP si la détection échoue
 */
export const getApiUrl = (): string => {
  if (__DEV__) {
    // Essayer la détection auto
    const autoUrl = getBackendUrl(API_CONFIG.PORT);
    
    // Si la détection a réussi (pas localhost), utiliser autoUrl
    if (!autoUrl.includes('localhost')) {
      console.log('✅ URL auto-détectée:', autoUrl);
      return autoUrl;
    }
    
    // Sinon, utiliser l'IP manuelle
    const manualUrl = `http://${MANUAL_IP}:${API_CONFIG.PORT}/api`;
    console.log('⚠️ Utilisation de l\'IP manuelle:', manualUrl);
    return manualUrl;
  }
  
  // En production
  return PROD_API_URL;
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
