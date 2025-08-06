# Guide d'exportation pour Cursor

## 📋 Fichiers essentiels à copier

### 🏗️ Configuration de base
- `package.json` - Dépendances et scripts
- `package-lock.json` - Versions exactes des packages
- `tsconfig.json` - Configuration TypeScript
- `tailwind.config.ts` - Configuration Tailwind CSS
- `postcss.config.js` - Configuration PostCSS
- `vite.config.ts` - Configuration Vite
- `components.json` - Configuration Shadcn/ui
- `drizzle.config.ts` - Configuration base de données

### 📁 Dossiers principaux
- `client/` - Interface utilisateur React
- `server/` - API Express.js
- `shared/` - Schémas partagés (base de données)

### 🔧 Variables d'environnement nécessaires
```env
DATABASE_URL=postgresql://...
NODE_ENV=development
```

## 🚀 Étapes d'installation sur Cursor

### 1. Créer un nouveau projet
```bash
mkdir banking-app
cd banking-app
```

### 2. Copier tous les fichiers du projet

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configurer la base de données
- Créer une base PostgreSQL (Neon, Supabase, ou locale)
- Ajouter DATABASE_URL dans un fichier .env

### 5. Initialiser la base de données
```bash
npm run db:push
```

### 6. Lancer l'application
```bash
npm run dev
```

## 🔑 Fonctionnalités principales

### Interface Client
- Connexion sécurisée avec PIN
- Gestion des comptes (courant, épargne)
- Virements internes/externes
- Gestion des cartes virtuelles
- Historique des transactions
- Mini-dashboard de santé financière

### Interface Conseiller
- Approbation des nouveaux clients
- Gestion des comptes clients
- Création de cartes et RIB
- Statistiques en temps réel
- Gestion des informations bancaires

### Sécurité
- Authentification multi-niveaux
- Code PIN pour transactions
- Validation des formulaires
- Protection contre découvert

## 📊 Base de données
- PostgreSQL avec Drizzle ORM
- Tables : users, accounts, cards, transactions, userRibs, notifications
- Relations configurées automatiquement

## 🎨 Design
- Dark theme avec glassmorphism
- Animations CSS personnalisées
- Responsive mobile-first
- Logo MB MARIE BANQUE intégré

## 📱 Comptes de test

### Conseiller
- Nom d'utilisateur: `conseiller`
- Mot de passe: `conseiller2024`

### Clients approuvés
- Marie: `mlle.mariiee` / mot de passe personnel
- Valentin: `valentin.vermeulen` / mot de passe personnel
- MAXIME: `ximamoff` / mot de passe personnel

## 🔄 Workflow de développement
- `npm run dev` - Lance le serveur de développement
- `npm run db:push` - Synchronise le schéma avec la base
- Hot reload automatique avec Vite