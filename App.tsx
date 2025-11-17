import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useStore, setDatabaseInstance } from './src/lib/store';
import { KameDaayDatabase } from './src/lib/database';
import { syncService } from './src/lib/sync';

import Colors from './src/constants/Colors';

// Importez vos composants
import Dashboard from './src/components/Dashboard';
import ClientsList from './src/components/ClientsList';
import VentesPage from './src/components/VentesPage';
import CreditsPage from './src/components/CreditsPage';
import StatistiquesPage from './src/components/StatistiquesPage';
import DepensesPage from './src/components/DepensesPage';
import RappelsPage from './src/components/RappelsPage';
import ParametresPage from './src/components/ParametresPage';
import AIAssistant from './src/components/AIAssistant';
import HistoriqueVentes from './src/components/HistoriqueVentes';
import DetailVente from './src/components/DetailVente';
import WelcomeScreen from './src/components/WelcomeScreen';
import LoginScreen from './src/components/LoginScreen';
import SignupScreen from './src/components/SignupScreen';
import NetworkDebugScreen from './src/components/NetworkDebugScreen';
import BackgroundSync from './src/components/BackgroundSync';
import FloatingVoiceButton from './src/components/FloatingVoiceButton';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Composant Menu Burger
function MenuBurger({ visible, onClose, onNavigate, rappelsActifs = 0 }: { 
  visible: boolean; 
  onClose: () => void; 
  onNavigate: (screen: string) => void;
  rappelsActifs?: number;
}) {
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  
  const menuItems = [
    { 
      name: 'Statistiques', 
      icon: 'bar-chart', 
      description: 'Visualisez vos performances',
      color: Colors.primary 
    },
    { 
      name: 'Depenses', 
      icon: 'trending-down', 
      description: 'Gérez vos dépenses',
      color: '#FF6B6B' 
    },
    { 
      name: 'Rappels', 
      icon: 'notifications', 
      description: 'Vos notifications',
      color: '#FFA726',
      badge: rappelsActifs 
    },
    { 
      name: 'Parametres', 
      icon: 'settings', 
      description: 'Configuration de l\'app',
      color: '#666666' 
    },
    { 
      name: 'AIAssistant', 
      icon: 'chatbubble-ellipses', 
      description: 'Assistant IA',
      color: '#4CAF50' 
    },
  ];

  const headerHeight = 88;
  const footerHeight = 56;
  const maxMenuHeight = screenHeight * 0.8;
  const contentHeight = maxMenuHeight - headerHeight - footerHeight;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[
          styles.menuContainer,
          { maxHeight: maxMenuHeight }
        ]}>
          <View style={styles.menuHeader}>
            <View style={styles.menuHeaderLeft}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>💼</Text>
              </View>
              <View>
                <Text style={styles.menuTitle}>Menu</Text>
                <Text style={styles.menuSubtitle}>Plus d'options</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={[styles.menuContent, { maxHeight: contentHeight }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingVertical: 16,
              paddingHorizontal: 16,
              paddingBottom: 24,
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && { marginBottom: 0 }
                ]}
                onPress={() => {
                  onNavigate(item.name);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuItemIconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <View style={styles.menuItemBadge}>
                      <Text style={styles.menuItemBadgeText}>
                        {item.badge > 99 ? '99+' : String(item.badge)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{String(item.name)}</Text>
                  <Text style={styles.menuItemDescription}>{String(item.description)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.grayDark} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[
            styles.menuFooter,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }
          ]}>
            <Text style={styles.menuFooterText}>Kame Daay • Version 1.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Composant placeholder pour l'onglet Menu
function MenuScreen() {
  return <View style={{ flex: 1, backgroundColor: Colors.white }} />;
}

// ✅ Tab Navigator avec SEULEMENT les 5 onglets visibles
function MainTabs({ navigationRef, setMenuVisible, rappelsActifs }: any) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

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
            case 'Menu':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={iconName} size={26} color={color} />
              {route.name === 'Menu' && rappelsActifs > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {rappelsActifs > 99 ? '99+' : String(rappelsActifs)}
                  </Text>
                </View>
              )}
            </View>
          );
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grayDark,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          paddingVertical: 6,
        },
        headerShown: false,
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
        name="Menu"
        component={MenuScreen}
        options={{ title: 'Menu' }}
        listeners={({ navigation: nav }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigationRef.current = nav;
            setMenuVisible(true);
          },
        })}
      />
    </Tab.Navigator>
  );
}

// Composant interne pour accéder aux Safe Area Insets
function AppContent() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const navigationRef = useRef<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authScreen, setAuthScreen] = useState<'welcome' | 'login' | 'signup' | 'debug'>('welcome');
  
  const { loadData, isLoading, rappels } = useStore();

  const initializeDatabaseAndLoadData = useCallback(async () => {
    try {
      const dbInstance = await KameDaayDatabase.initialize();
      setDatabaseInstance(dbInstance);
      setDbInitialized(true);
      await loadData();
    } catch (error) {
      console.error("Erreur critique lors de l'initialisation de la DB:", error);
    }
  }, [loadData]);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await syncService.isAuthenticated();
      setIsAuthenticated(isAuth);
      setAuthChecking(false);
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (!dbInitialized && isAuthenticated) {
      initializeDatabaseAndLoadData();
    }
  }, [dbInitialized, isAuthenticated, initializeDatabaseAndLoadData]);

  useEffect(() => {
    if (dbInitialized && isAuthenticated) {
      console.log('✅ DB initialisée, démarrage de la synchronisation automatique...');
      
      syncService.startAutoSync(5);
      
      const timer = setTimeout(async () => {
        console.log('🔄 Téléchargement des données du serveur au démarrage...');
        await syncService.syncFromServer();
      }, 2000);
      
      return () => {
        clearTimeout(timer);
        syncService.stopAutoSync();
      };
    }
  }, [dbInitialized, isAuthenticated]);

  const handleAuthSuccess = async (token: string, user: any, isNewAccount: boolean = false) => {
    await syncService.setAccessToken(token);
    setIsAuthenticated(true);
  };

  if (authChecking) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <View style={styles.spinnerPulse} />
          </View>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>💼</Text>
          </View>
          <Text style={styles.loadingTitle}>Kame Daay</Text>
          <Text style={styles.loadingSubtitle}>Vérification...</Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onLogin={() => setAuthScreen('login')}
          onSignup={() => setAuthScreen('signup')}
          onDebug={() => setAuthScreen('debug')}
        />
      );
    } else if (authScreen === 'login') {
      return (
        <LoginScreen
          onLoginSuccess={handleAuthSuccess}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    } else if (authScreen === 'signup') {
      return (
        <SignupScreen
          onSignupSuccess={handleAuthSuccess}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    } else if (authScreen === 'debug') {
      return (
        <NetworkDebugScreen
          onBack={() => setAuthScreen('welcome')}
        />
      );
    }
  }

  if (!dbInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <View style={styles.spinnerPulse} />
          </View>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>💼</Text>
          </View>
          
          <Text style={styles.loadingTitle}>Kame Daay</Text>
          <Text style={styles.loadingSubtitle}>
            {dbInitialized ? 'Chargement de vos données...' : 'Initialisation de la base de données...'}
          </Text>
        </View>
      </View>
    );
  }

  const rappelsActifs = (rappels || []).filter(r => !r.resolu).length;

  // ✅ Navigation directe vers les écrans du Stack
  const handleNavigateFromMenu = (screenName: string) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(screenName);
    }
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <BackgroundSync />
        
        {/* ✅ Stack Navigator contenant les Tabs + écrans additionnels */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Écran principal avec les 5 tabs */}
          <Stack.Screen name="MainTabs">
            {() => (
              <MainTabs 
                navigationRef={navigationRef}
                setMenuVisible={setMenuVisible}
                rappelsActifs={rappelsActifs}
              />
            )}
          </Stack.Screen>
          
          {/* ✅ Écrans additionnels (accessibles via Menu Burger) */}
          <Stack.Screen 
            name="Statistiques" 
            component={StatistiquesPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Depenses" 
            component={DepensesPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Rappels" 
            component={RappelsPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Parametres" 
            component={ParametresPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AIAssistant" 
            component={AIAssistant}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="HistoriqueVentes" 
            component={HistoriqueVentes}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="DetailVente" 
            component={DetailVente}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        
        <FloatingVoiceButton />
      </NavigationContainer>

      <MenuBurger
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={handleNavigateFromMenu}
        rappelsActifs={rappelsActifs}
      />
      
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 77, 64, 0.1)',
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.secondary,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.grayDark,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 77, 64, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 77, 64, 0.08)',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  menuItemBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    backgroundColor: Colors.error,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  menuItemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 13,
    color: Colors.grayDark,
  },
  menuFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 77, 64, 0.1)',
    alignItems: 'center',
  },
  menuFooterText: {
    fontSize: 12,
    color: Colors.grayDark,
  },
});
