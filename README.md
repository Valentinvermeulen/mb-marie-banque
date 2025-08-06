# 🛍️ Application Vinted-like

Une marketplace de vêtements d'occasion inspirée de Vinted, construite avec React, TypeScript, Express et SQLite.

## 🚀 Fonctionnalités

- **Authentification** : Inscription et connexion utilisateurs
- **Catalogue de produits** : Affichage des vêtements avec filtres et recherche
- **Système de favoris** : Ajouter/retirer des articles des favoris
- **Messagerie** : Communication entre acheteurs et vendeurs
- **Gestion des commandes** : Suivi des achats et ventes
- **Profils utilisateurs** : Gestion des informations personnelles
- **Interface responsive** : Optimisée pour mobile et desktop

## 🛠️ Technologies utilisées

### Backend
- **Node.js** avec Express
- **TypeScript** pour le typage statique
- **SQLite** avec Drizzle ORM
- **bcrypt** pour le hachage des mots de passe
- **express-session** pour la gestion des sessions

### Frontend
- **React 18** avec TypeScript
- **React Router** pour la navigation
- **TanStack Query** pour la gestion d'état serveur
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **Radix UI** pour les composants d'interface

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn

## 🔧 Installation

### 1. Installer Node.js

Si Node.js n'est pas installé sur votre système :

**macOS (avec Homebrew) :**
```bash
# Installer Homebrew (si pas déjà installé)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js
brew install node
```

**Windows :**
- Télécharger et installer depuis [nodejs.org](https://nodejs.org/)

**Linux (Ubuntu/Debian) :**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Cloner et installer les dépendances

```bash
# Installer les dépendances du serveur
npm install

# Installer les dépendances du client
cd client
npm install
cd ..
```

### 3. Initialiser la base de données

```bash
npm run init-db
```

Cette commande va :
- Créer toutes les tables nécessaires
- Insérer des données de test (utilisateurs, catégories, marques, produits)
- Configurer la base de données SQLite

## 🚀 Démarrage

### Mode développement

```bash
# Démarrer le serveur backend
npm run dev

# Dans un autre terminal, démarrer le client frontend
cd client
npm run dev
```

### Mode production

```bash
# Construire l'application
npm run build

# Démarrer en production
npm start
```

## 🔐 Identifiants de test

Une fois l'application démarrée, vous pouvez vous connecter avec ces comptes de test :

| Utilisateur | Nom d'utilisateur | Mot de passe |
|-------------|-------------------|--------------|
| Sarah | `sarah_fashion` | `password123` |
| Marc | `marc_style` | `password123` |
| Emma | `emma_vintage` | `password123` |

## 📱 Utilisation

### 1. Connexion
- Accédez à l'application via `http://localhost:3000`
- Cliquez sur "Se connecter" et utilisez un des identifiants de test

### 2. Parcourir les produits
- La page d'accueil affiche tous les produits disponibles
- Utilisez les filtres pour affiner votre recherche
- Cliquez sur un produit pour voir ses détails

### 3. Ajouter aux favoris
- Cliquez sur l'icône cœur sur un produit pour l'ajouter aux favoris
- Accédez à vos favoris via le menu utilisateur

### 4. Vendre un article
- Cliquez sur "Vendre" dans la navigation
- Remplissez le formulaire avec les détails de votre article

## 🗂️ Structure du projet

```
APP/
├── client/                 # Application React frontend
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── pages/         # Pages de l'application
│   │   └── ...
│   └── ...
├── server/                # Serveur Express backend
│   ├── routes.ts          # Routes API
│   ├── index.ts           # Point d'entrée du serveur
│   └── init-db.ts         # Initialisation de la base de données
├── shared/                # Code partagé
│   └── schema.ts          # Schéma de base de données
└── ...
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

### Produits
- `GET /api/products` - Liste des produits (avec filtres)
- `GET /api/products/:id` - Détail d'un produit
- `POST /api/products` - Créer un produit
- `PUT /api/products/:id` - Modifier un produit
- `POST /api/products/:id/favorite` - Ajouter/retirer des favoris

### Autres
- `GET /api/categories` - Liste des catégories
- `GET /api/brands` - Liste des marques
- `GET /api/favorites` - Favoris de l'utilisateur
- `GET /api/orders` - Commandes de l'utilisateur
- `GET /api/messages` - Messages de l'utilisateur

## 🎨 Personnalisation

### Couleurs
L'application utilise une palette de couleurs teal/bleu. Pour modifier :
- Modifiez les classes Tailwind dans les composants
- Ajustez les variables CSS dans `client/src/index.css`

### Données de test
Pour ajouter plus de données de test, modifiez le fichier `server/init-db.ts` et relancez l'initialisation.

## 🐛 Dépannage

### Problèmes courants

**Erreur "command not found: npm"**
- Vérifiez que Node.js est installé : `node --version`
- Réinstallez Node.js si nécessaire

**Erreur de base de données**
- Supprimez le fichier `local.db` et relancez `npm run init-db`

**Erreur de port déjà utilisé**
- Changez le port dans `server/index.ts` ou arrêtez le processus qui utilise le port

**Erreur de dépendances**
- Supprimez `node_modules` et `package-lock.json`
- Relancez `npm install`

## 📄 Licence

Ce projet est créé à des fins éducatives.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Ajouter de nouvelles fonctionnalités

---

**Bon développement ! 🚀** 