import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// 🚨 MODIFICATIONS MAJEURES ICI :
import { useStore, setDatabaseInstance } from './src/lib/store';
import { KameDaayDatabase } from './src/lib/database'; // Importer la CLASSE de la DB

import Colors from './src/constants/Colors';

// Importez vos composants (à créer)
import Dashboard from './src/components/Dashboard';
import ClientsList from './src/components/ClientsList';
import VentesPage from './src/components/VentesPage';
import CreditsPage from './src/components/CreditsPage';
import StatistiquesPage from './src/components/StatistiquesPage';
import DepensesPage from './src/components/DepensesPage';
import RappelsPage from './src/components/RappelsPage';
import ParametresPage from './src/components/ParametresPage';


const Tab = createBottomTabNavigator();

export default function App() {
  // 🚨 NOUVEL ÉTAT LOCAL pour suivre l'initialisation de la DB
  const [dbInitialized, setDbInitialized] = useState(false);
  
  // Récupérer loadData et l'état de chargement des données de l'application
  const { loadData, isLoading, rappels } = useStore();
  
  // Utiliser useCallback pour stabiliser la fonction
  const initializeDatabaseAndLoadData = useCallback(async () => {
    try {
      // 1. INITIALISATION ASYNCHRONE DE LA BASE DE DONNÉES
      const dbInstance = await KameDaayDatabase.initialize();
      
      // 2. INJECTION DE L'INSTANCE DANS LE STORE ZUSTAND
      setDatabaseInstance(dbInstance);
      
      // 3. MARQUER LA DB COMME INITIALISÉE
      setDbInitialized(true);

      // 4. CHARGEMENT DES DONNÉES VIA ZUSTAND (maintenant que la DB est prête)
      await loadData();

    } catch (error) {
      console.error("Erreur critique lors de l'initialisation de la DB:", error);
      // Gérer l'échec (ex: afficher une erreur fatale)
    }
  }, [loadData]);


  useEffect(() => {
    // Exécuter l'initialisation uniquement si ce n'est pas déjà fait
    if (!dbInitialized) {
      initializeDatabaseAndLoadData();
    }
  }, [dbInitialized, initializeDatabaseAndLoadData]);


  // Utiliser dbInitialized ET isLoading pour l'écran de chargement
  if (!dbInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          {/* Double spinner */}
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <View style={styles.spinnerPulse} />
          </View>
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>💼</Text>
          </View>
          
          {/* Texte */}
          <Text style={styles.loadingTitle}>Kame Daay</Text>
          <Text style={styles.loadingSubtitle}>
            {dbInitialized ? 'Chargement de vos données...' : 'Initialisation de la base de données...'}
          </Text>
        </View>
      </View>
    );
  }

  // Calculer les rappels actifs
  const rappelsActifs = rappels.filter(r => !r.resolu).length;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;
              let badge = 0;

              switch (route.name) {
                case 'Dashboard':
                  iconName = focused ? 'home' : 'home-outline';
                  break;
                case 'Clients':
                  iconName = focused ? 'people' : 'people-outline';
                  break;
                case 'Ventes':
                  iconName = focused ? 'cart' : 'cart-outline';
                  break;
                case 'Credits':
                  iconName = focused ? 'card' : 'card-outline';
                  break;
                case 'Statistiques':
                  iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                  break;
                case 'Depenses':
                  iconName = focused ? 'trending-down' : 'trending-down-outline';
                  break;
                case 'Rappels':
                  iconName = focused ? 'notifications' : 'notifications-outline';
                  badge = rappelsActifs;
                  break;
                case 'Parametres':
                  iconName = focused ? 'settings' : 'settings-outline';
                  break;
                default:
                  iconName = 'home-outline';
              }

              // Rendu personnalisé avec effet et badge
              return (
                <View style={styles.tabIconContainer}>
                  {focused && <View style={styles.tabIndicator} />}
                  <View style={[
                    styles.tabIconWrapper,
                    focused && styles.tabIconWrapperActive
                  ]}>
                    <Ionicons name={iconName} size={size} color={color} />
                    {badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.grayDark,
            tabBarStyle: {
              height: 80,
              paddingBottom: 10,
              paddingTop: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderTopWidth: 1,
              borderTopColor: 'rgba(0, 77, 64, 0.1)',
              // 🚨 CORRECTION D'AVERTISSEMENT: shadow* style props sont pour iOS, pas de boxShadow pour React Native Web.
              // Laisser comme ça pour une meilleure compatibilité mobile.
              shadowColor: Colors.black,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '600',
            },
            headerStyle: {
              backgroundColor: Colors.secondary,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: Colors.white,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
            },
            headerShown: false, // Caché car chaque page a son propre header
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={Dashboard}
            options={{ title: 'Accueil' }}
          />
          <Tab.Screen
            name="Clients"
            component={ClientsList}
            options={{ title: 'Clients' }}
          />
          <Tab.Screen
            name="Ventes"
            component={VentesPage}
            options={{ title: 'Ventes' }}
          />
          <Tab.Screen
            name="Credits"
            component={CreditsPage}
            options={{ title: 'Crédits' }}
          />
          <Tab.Screen
            name="Statistiques"
            component={StatistiquesPage}
            options={{ title: 'Stats' }}
          />
          <Tab.Screen
            name="Depenses"
            component={DepensesPage}
            options={{ title: 'Dépenses' }}
          />
          <Tab.Screen
            name="Rappels"
            component={RappelsPage}
            options={{ title: 'Rappels' }}
          />
          <Tab.Screen
            name="Parametres"
            component={ParametresPage}
            options={{ title: 'Paramètres' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Loading Screen
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    marginBottom: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.primary,
    opacity: 0.3,
  },
  logoContainer: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // 🚨 AVERTISSEMENT: shadow* style props sont dépréciés sur le web.
    // Dans React Native, ces styles fonctionnent pour iOS et Android (via elevation).
    // Si vous visez seulement le mobile, c'est acceptable.
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 28,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // Tab Bar
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: -10,
    width: 48,
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  tabIconWrapper: {
    padding: 8,
    borderRadius: 16,
  },
  tabIconWrapperActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    backgroundColor: Colors.error,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
});