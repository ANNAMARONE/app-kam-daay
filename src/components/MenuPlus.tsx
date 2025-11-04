import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';
import DepensesPage from './DepensesPage';
import RappelsPage from './RappelsPage';
import ParametresPage from './ParametresPage';

const Stack = createStackNavigator();

// Écran principal de l'onglet 'Plus'
function MoreScreen({ navigation, rappelsActifs }) {
  const menuItems = [
    { name: 'Dépenses', icon: 'trending-down-outline', target: 'DepensesPage' },
    { name: 'Rappels', icon: 'notifications-outline', target: 'RappelsPage', badge: rappelsActifs },
    { name: 'Paramètres', icon: 'settings-outline', target: 'ParametresPage' },
  ];

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.target)}
        >
          <Ionicons name={item.icon} size={24} color={Colors.primary} />
          <Text style={styles.menuItemText}>{item.name}</Text>
          {item.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Navigation Stack pour l'onglet 'Plus'
export default function MenuPlus({ rappelsActifs }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.secondary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="MoreHome"
        options={{ title: 'Plus' }}
      >
        {props => <MoreScreen {...props} rappelsActifs={rappelsActifs} />}
      </Stack.Screen>
      <Stack.Screen name="DepensesPage" component={DepensesPage} options={{ title: 'Dépenses' }} />
      <Stack.Screen name="RappelsPage" component={RappelsPage} options={{ title: 'Rappels' }} />
      <Stack.Screen name="ParametresPage" component={ParametresPage} options={{ title: 'Paramètres' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: Colors.black,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    backgroundColor: Colors.error,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});