#!/bin/bash

# Script de test de la synchronisation - Kame Daay
# Vérifie que la synchronisation automatique fonctionne correctement

echo "🔧 Test de la Synchronisation Automatique - Kame Daay"
echo "======================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que le backend tourne
echo "1️⃣ Vérification du backend MySQL..."
if curl -s http://192.168.1.120:3001/api > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend accessible${NC}"
else
    echo -e "${RED}❌ Backend non accessible${NC}"
    echo "   Assurez-vous que le backend tourne: cd backend && npm start"
    exit 1
fi

# 2. Vérifier la connexion MySQL
echo ""
echo "2️⃣ Vérification de MySQL..."
if command -v mysql &> /dev/null; then
    if mysql -u root -p -e "USE kame_daay; SHOW TABLES;" 2>/dev/null | grep -q "clients"; then
        echo -e "${GREEN}✅ Base de données kame_daay accessible${NC}"
    else
        echo -e "${RED}❌ Base de données kame_daay non accessible${NC}"
        echo "   Vérifiez vos credentials MySQL"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Client MySQL non installé, impossible de vérifier${NC}"
fi

# 3. Vérifier que les fichiers critiques existent
echo ""
echo "3️⃣ Vérification des fichiers critiques..."

FILES=(
    "BackgroundSync.tsx"
    "lib/store.ts"
    "lib/sync.ts"
    "lib/sync-mapper.ts"
    "lib/database.ts"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (MANQUANT)"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo -e "${RED}❌ Certains fichiers critiques sont manquants${NC}"
    exit 1
fi

# 4. Vérifier que SyncStatusBar n'existe plus
echo ""
echo "4️⃣ Vérification du nettoyage..."
if [ ! -f "SyncStatusBar.tsx" ]; then
    echo -e "${GREEN}✅ SyncStatusBar.tsx supprimé (correct)${NC}"
else
    echo -e "${YELLOW}⚠️  SyncStatusBar.tsx existe encore${NC}"
fi

# 5. Vérifier que BackgroundSync est importé dans App.tsx
echo ""
echo "5️⃣ Vérification de l'intégration..."
if grep -q "import BackgroundSync" App.tsx; then
    echo -e "${GREEN}✅ BackgroundSync importé dans App.tsx${NC}"
else
    echo -e "${RED}❌ BackgroundSync NON importé dans App.tsx${NC}"
    exit 1
fi

if grep -q "<BackgroundSync" App.tsx; then
    echo -e "${GREEN}✅ BackgroundSync utilisé dans App.tsx${NC}"
else
    echo -e "${RED}❌ BackgroundSync NON utilisé dans App.tsx${NC}"
    exit 1
fi

# 6. Vérifier la fonction triggerAutoSync dans store.ts
echo ""
echo "6️⃣ Vérification de triggerAutoSync..."
if grep -q "triggerAutoSync" lib/store.ts; then
    echo -e "${GREEN}✅ triggerAutoSync défini dans store.ts${NC}"
else
    echo -e "${RED}❌ triggerAutoSync NON défini dans store.ts${NC}"
    exit 1
fi

# Compter combien de fois triggerAutoSync est appelé
TRIGGER_COUNT=$(grep -c "triggerAutoSync()" lib/store.ts)
echo -e "${GREEN}✅ triggerAutoSync() appelé $TRIGGER_COUNT fois${NC}"

if [ $TRIGGER_COUNT -lt 10 ]; then
    echo -e "${YELLOW}⚠️  triggerAutoSync() devrait être appelé après chaque modification (addClient, updateClient, etc.)${NC}"
fi

# 7. Vérifier la fonction generateUuidFromId
echo ""
echo "7️⃣ Vérification de generateUuidFromId..."
if grep -q "generateUuidFromId" lib/sync-mapper.ts; then
    echo -e "${GREEN}✅ generateUuidFromId défini dans sync-mapper.ts${NC}"
else
    echo -e "${RED}❌ generateUuidFromId NON défini dans sync-mapper.ts${NC}"
    exit 1
fi

# Vérifier qu'il n'utilise pas substr (déprécié)
if grep -q "\.substr(" lib/sync-mapper.ts; then
    echo -e "${RED}❌ sync-mapper.ts utilise encore .substr() (déprécié)${NC}"
    echo "   Remplacez par .substring()"
    exit 1
else
    echo -e "${GREEN}✅ sync-mapper.ts n'utilise pas .substr() (correct)${NC}"
fi

# 8. Résumé final
echo ""
echo "======================================================"
echo -e "${GREEN}✅ Tous les tests passent avec succès !${NC}"
echo ""
echo "📋 Instructions de test manuel:"
echo "   1. Lancez le backend: cd ../backend && npm start"
echo "   2. Lancez l'app: npx expo start"
echo "   3. Ajoutez un nouveau client"
echo "   4. Attendez 2 secondes"
echo "   5. Vérifiez les logs Expo pour voir la sync automatique"
echo "   6. Vérifiez dans MySQL:"
echo "      mysql -u root -p kame_daay -e 'SELECT * FROM clients ORDER BY created_at DESC LIMIT 5;'"
echo ""
echo "🔍 Logs à surveiller:"
echo "   📱 Expo: '🔄 Déclenchement de la synchronisation automatique...'"
echo "   📱 Expo: '✅ Synchronisation réussie'"
echo "   💾 Backend: '📊 Synchronisation de X clients...'"
echo "   💾 Backend: '✅ Nouveau client inséré' ou '🔄 Client existant mis à jour'"
echo ""
echo "======================================================"
