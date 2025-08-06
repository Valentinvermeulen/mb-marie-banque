#!/bin/bash

# Script de build SIMPLE pour Vercel
echo "🚀 BUILD SIMPLE - UTILISATION SEULEMENT DU CLIENT"
echo "================================================="

# Aller directement dans le dossier client
echo "📁 Changement vers le dossier client..."
cd client

# Nettoyer le client
echo "🧹 NETTOYAGE DU CLIENT..."
rm -rf node_modules package-lock.json
rm -rf dist

# Installer les dépendances client
echo "📦 INSTALLATION DES DÉPENDANCES CLIENT..."
npm install --no-cache --prefer-offline=false --force

# Vérifier que cmdk est bien installé
echo "🔍 VÉRIFICATION DE L'INSTALLATION DE CMDK..."
if npm list cmdk; then
    echo "✅ CMDK INSTALLÉ AVEC SUCCÈS"
else
    echo "❌ ERREUR: CMDK NON INSTALLÉ"
    exit 1
fi

# Vérifier qu'il n'y a pas de @radix-ui/react-command
echo "🔍 VÉRIFICATION QU'IL N'Y A PAS DE @radix-ui/react-command..."
if npm list | grep "react-command"; then
    echo "❌ ERREUR: @radix-ui/react-command TROUVÉ!"
    exit 1
else
    echo "✅ AUCUNE RÉFÉRENCE À @radix-ui/react-command"
fi

# Build de l'application
echo "🔨 BUILD DE L'APPLICATION..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD TERMINÉ AVEC SUCCÈS!"
    echo "📁 Contenu du dossier dist:"
    ls -la dist/
else
    echo "❌ ERREUR: BUILD ÉCHOUÉ"
    exit 1
fi

echo "🎉 DÉPLOIEMENT RÉUSSI!" 