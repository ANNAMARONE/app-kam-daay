#!/bin/bash

echo "🚀 Installation et Démarrage - Kame Daay Mobile"
echo "================================================"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le dossier racine du projet"
    echo "   (là où se trouve package.json)"
    exit 1
fi

# Étape 1: Nettoyage
echo "1️⃣  Nettoyage des anciens fichiers..."
rm -rf node_modules
rm -rf .expo
rm -rf package-lock.json
echo "   ✅ Nettoyage terminé"
echo ""

# Étape 2: Installation des dépendances
echo "2️⃣  Installation des dépendances..."
npm install
if [ $? -ne 0 ]; then
    echo "   ❌ Erreur lors de l'installation"
    exit 1
fi
echo "   ✅ Dépendances installées"
echo ""

# Étape 3: Vérification des versions
echo "3️⃣  Vérification des versions..."
echo "   Expo: $(npx expo --version 2>/dev/null || echo 'Non installé')"
echo "   Node: $(node --version)"
echo "   npm: $(npm --version)"
echo ""

# Étape 4: Vérifier expo-sqlite
echo "4️⃣  Vérification d'expo-sqlite..."
SQLITE_VERSION=$(npm list expo-sqlite 2>/dev/null | grep expo-sqlite | head -1)
if [ -z "$SQLITE_VERSION" ]; then
    echo "   ⚠️  expo-sqlite non trouvé, installation..."
    npm install expo-sqlite@~15.0.3
else
    echo "   ✅ $SQLITE_VERSION"
fi
echo ""

# Étape 5: Afficher les instructions
echo "✅ Installation terminée !"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Pour lancer l'application:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Démarrage normal"
echo "  npx expo start --clear"
echo ""
echo "Option 2: Avec tunnel (si problèmes réseau)"
echo "  npx expo start --clear --tunnel"
echo ""
echo "Option 3: Android direct"
echo "  npx expo start --android"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Vérifications importantes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Backend MySQL doit tourner sur port 3001"
echo "   cd backend && node server.js"
echo ""
echo "2. IP configurée dans lib/api-config.ts"
echo "   MANUAL_IP = '192.168.1.105'"
echo ""
echo "3. Expo Go installé sur votre téléphone"
echo "   Android: https://play.google.com/store/apps/details?id=host.exp.exponent"
echo "   iOS: https://apps.apple.com/app/expo-go/id982107779"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Proposer de lancer automatiquement
read -p "Voulez-vous lancer l'application maintenant? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
    echo "🚀 Lancement de l'application..."
    npx expo start --clear
fi
