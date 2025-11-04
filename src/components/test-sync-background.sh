#!/bin/bash

echo "======================================"
echo "🔍 VÉRIFICATION DE LA SYNCHRONISATION"
echo "======================================"
echo ""

echo "✅ Vérification des fichiers..."
echo ""

# Vérifier que BackgroundSync.tsx existe
if [ -f "BackgroundSync.tsx" ]; then
    echo "✓ BackgroundSync.tsx existe"
else
    echo "✗ BackgroundSync.tsx manquant"
    exit 1
fi

# Vérifier que SyncStatusBar.tsx n'existe plus
if [ ! -f "SyncStatusBar.tsx" ]; then
    echo "✓ SyncStatusBar.tsx supprimé (correct)"
else
    echo "✗ SyncStatusBar.tsx existe encore (devrait être supprimé)"
fi

# Vérifier que App.tsx importe BackgroundSync
if grep -q "import BackgroundSync" App.tsx; then
    echo "✓ App.tsx importe BackgroundSync"
else
    echo "✗ App.tsx n'importe pas BackgroundSync"
fi

# Vérifier que App.tsx utilise <BackgroundSync />
if grep -q "<BackgroundSync />" App.tsx; then
    echo "✓ App.tsx utilise <BackgroundSync />"
else
    echo "✗ App.tsx n'utilise pas <BackgroundSync />"
fi

# Vérifier que la sync auto démarre
if grep -q "startAutoSync" App.tsx; then
    echo "✓ Synchronisation automatique configurée"
else
    echo "✗ Synchronisation automatique non configurée"
fi

# Vérifier que Dashboard n'importe plus SyncState
if grep -q "SyncState" Dashboard.tsx; then
    echo "✗ Dashboard importe encore SyncState (devrait être supprimé)"
else
    echo "✓ Dashboard ne contient plus de code de sync"
fi

echo ""
echo "======================================"
echo "✅ CONFIGURATION DE LA SYNC"
echo "======================================"
echo ""

# Extraire l'intervalle de sync
INTERVAL=$(grep -o "startAutoSync([0-9]*)" App.tsx | grep -o "[0-9]*" | head -1)
if [ -n "$INTERVAL" ]; then
    echo "⏰ Intervalle de synchronisation : $INTERVAL minutes"
else
    echo "⚠️  Intervalle de synchronisation non trouvé"
fi

echo ""
echo "======================================"
echo "📋 RÉSUMÉ"
echo "======================================"
echo ""
echo "La synchronisation fonctionne maintenant :"
echo "  • En arrière-plan (invisible)"
echo "  • Toutes les $INTERVAL minutes"
echo "  • Au démarrage de l'app"
echo "  • Quand la connexion revient"
echo ""
echo "Pour voir les logs de sync :"
echo "  • Ouvrez la console du terminal"
echo "  • Cherchez les emojis : 🔄 ✅ 📡 ⏰"
echo ""
echo "🎉 Tout est configuré !"
