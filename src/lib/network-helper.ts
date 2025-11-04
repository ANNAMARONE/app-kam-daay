/**
 * Helper pour détecter automatiquement l'IP du serveur backend
 * Utilise l'URL du Metro bundler d'Expo pour extraire l'IP
 */

import Constants from 'expo-constants';

/**
 * Extrait l'IP locale depuis l'URL du debugger Expo
 * 
 * Quand tu lances `expo start`, Expo crée un serveur Metro
 * qui tourne sur l'IP de ton ordinateur. On peut extraire cette IP.
 */
export const getLocalIP = (): string => {
  try {
    // Expo fournit l'URL du debugger qui contient l'IP
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
      // Format: "192.168.1.105:8081" ou "192.168.1.105:19000"
      const ip = debuggerHost.split(':')[0];
      console.log('✅ IP détectée automatiquement:', ip);
      return ip;
    }
    
    console.warn('⚠️ Impossible de détecter l\'IP automatiquement');
    return 'localhost';
  } catch (error) {
    console.error('❌ Erreur lors de la détection de l\'IP:', error);
    return 'localhost';
  }
};

/**
 * Construit l'URL du backend en utilisant l'IP détectée
 */
export const getBackendUrl = (port: number = 3001): string => {
  const ip = getLocalIP();
  const url = `http://${ip}:${port}/api`;
  console.log('🌐 URL du backend:', url);
  return url;
};

/**
 * Vérifie si le backend est accessible
 */
export const testBackendConnection = async (url: string): Promise<boolean> => {
  try {
    console.log('🔍 Test de connexion au backend:', url);
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible:', data);
      return true;
    } else {
      console.error('❌ Backend non accessible - Status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion au backend:', error);
    return false;
  }
};
