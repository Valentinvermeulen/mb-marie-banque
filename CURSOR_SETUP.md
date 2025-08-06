# 🚀 Configuration pour Cursor IDE

## 📦 Méthode 1: Copier manuellement les fichiers

### Structure à reproduire:
```
banking-app/
├── client/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── pages/
├── server/
├── shared/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── components.json
└── drizzle.config.ts
```

## 💻 Méthode 2: Cloner depuis GitHub

Si vous avez un repo GitHub, utilisez:
```bash
git clone [votre-repo-url]
cd banking-app
npm install
```

## 🔧 Configuration requise dans Cursor

### 1. Extensions recommandées:
- TypeScript et JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Prettier - Code formatter

### 2. Fichier .env à créer:
```env
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development
```

### 3. Base de données PostgreSQL:
Vous pouvez utiliser:
- **Neon** (gratuit): https://neon.tech
- **Supabase** (gratuit): https://supabase.com
- **Railway** (gratuit): https://railway.app
- Base locale PostgreSQL

### 4. Commandes essentielles:
```bash
# Installation
npm install

# Synchroniser la base de données
npm run db:push

# Lancer en développement
npm run dev
```

## 🎯 Comptes de test préconfiguré:

### Conseiller:
- **Username:** conseiller
- **Password:** conseiller2024

### Clients:
- **Marie:** mlle.mariiee
- **Valentin:** valentin.vermeulen
- **MAXIME:** ximamoff

## 🔍 Points d'attention pour Cursor:

1. **Auto-completion**: Le projet utilise des alias de chemins (@/, @assets/, etc.)
2. **Dark mode**: Thème sombre par défaut avec glassmorphism
3. **Responsive**: Mobile-first design
4. **Hot reload**: Vite configure le rechargement automatique

## 📋 Checklist de migration:

- [ ] Copier tous les fichiers sources
- [ ] Installer les dépendances (`npm install`)
- [ ] Créer un fichier .env avec DATABASE_URL
- [ ] Configurer une base PostgreSQL
- [ ] Exécuter `npm run db:push`
- [ ] Tester avec `npm run dev`
- [ ] Vérifier la connexion à http://localhost:5000

## 🛠️ En cas de problème:

1. **Port occupé**: Modifier le port dans vite.config.ts
2. **Base de données**: Vérifier la chaîne de connexion
3. **Dépendances**: Supprimer node_modules et reinstaller
4. **TypeScript**: Redémarrer le serveur TypeScript dans Cursor