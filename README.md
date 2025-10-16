### Étape 1: Créer le Projet

```bash
npx create-expo-app kame-daay-mobile --template blank-typescript
cd kame-daay-mobile
```

### Étape 2: Installer les Dépendances

```bash
# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Base de données
npx expo install expo-sqlite

# État
npm install zustand

# Graphiques
npm install react-native-chart-kit react-native-svg

# WhatsApp & Fichiers
npx expo install expo-linking expo-sharing expo-file-system

# Toast
npm install react-native-toast-message

# Icons (déjà inclus avec Expo)
```

### Étape 3: Créer la Structure

```bash
mkdir -p src/components/ui src/lib src/constants
```
