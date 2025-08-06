#!/bin/bash

echo "🔥🔥🔥 BUILD ULTRA RADICAL - FORÇAGE COMPLET 🔥🔥🔥"
echo "=================================================="

# Nettoyer COMPLÈTEMENT tout
echo "🧹 NETTOYAGE COMPLET DE L'ENVIRONNEMENT..."
rm -rf node_modules package-lock.json
rm -rf dist
rm -rf .npm
rm -rf .cache
rm -rf .vercel

# Nettoyer le cache npm global
echo "🧹 NETTOYAGE DU CACHE NPM GLOBAL..."
npm cache clean --force

# Aller dans le dossier client
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

# Build de l'application
echo "🔨 BUILD DE L'APPLICATION..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ BUILD TERMINÉ AVEC SUCCÈS!"
else
    echo "❌ ERREUR: BUILD ÉCHOUÉ"
    exit 1
fi

echo "🎉 DÉPLOIEMENT RÉUSSI!" 