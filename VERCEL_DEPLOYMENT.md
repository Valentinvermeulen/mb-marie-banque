# 🚀 Déploiement sur Vercel

Ce guide vous explique comment déployer votre application Vinted sur Vercel.

## 📋 Prérequis

- Un compte GitHub
- Un compte Vercel (gratuit)
- Node.js installé localement

## 🔧 Étapes de déploiement

### 1. Préparer le repository

Assurez-vous que votre code est sur GitHub :

```bash
# Initialiser Git si ce n'est pas déjà fait
git init
git add .
git commit -m "Initial commit - Vinted clone app"

# Créer un repository sur GitHub et pousser le code
git remote add origin https://github.com/votre-username/votre-repo.git
git push -u origin main
```

### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec votre compte GitHub
3. Cliquez sur "New Project"
4. Importez votre repository GitHub
5. Vercel détectera automatiquement que c'est un projet Node.js

### 3. Configuration Vercel

Dans les paramètres du projet Vercel :

#### Variables d'environnement
Ajoutez ces variables d'environnement :
```
NODE_ENV=production
SESSION_SECRET=votre-secret-session-tres-securise
```

#### Build Settings
- **Framework Preset**: Node.js
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/dist`
- **Install Command**: `npm install`

### 4. Déploiement

1. Cliquez sur "Deploy"
2. Vercel va automatiquement :
   - Installer les dépendances
   - Construire l'application
   - Déployer sur leur infrastructure

## 🔧 Configuration avancée

### Fichier vercel.json

Le fichier `vercel.json` est déjà configuré pour :
- Router les requêtes API vers le serveur Express
- Servir les fichiers statiques du client React
- Gérer les routes SPA

### Base de données

⚠️ **Important** : Cette version utilise une base de données en mémoire pour Vercel.
Pour une production réelle, vous devriez :

1. **Utiliser PostgreSQL** avec Vercel Postgres
2. **Ou utiliser Supabase** (gratuit)
3. **Ou utiliser PlanetScale** (gratuit)

### Exemple avec PostgreSQL

```bash
# Installer les dépendances PostgreSQL
npm install @neondatabase/serverless drizzle-orm

# Configurer la base de données
# Voir la documentation de Vercel Postgres
```

## 🐛 Dépannage

### Erreurs courantes

**Build failed**
- Vérifiez que toutes les dépendances sont dans `package.json`
- Assurez-vous que le script `vercel-build` fonctionne localement

**API routes not working**
- Vérifiez que les routes commencent par `/api/`
- Assurez-vous que le serveur Express écoute sur le bon port

**Database errors**
- En production, SQLite n'est pas supporté
- Utilisez une base de données compatible Vercel

### Logs de déploiement

1. Allez dans votre dashboard Vercel
2. Cliquez sur votre projet
3. Allez dans "Deployments"
4. Cliquez sur le dernier déploiement
5. Vérifiez les logs pour identifier les erreurs

## 🔄 Mises à jour

Pour mettre à jour votre application :

1. Poussez vos changements sur GitHub
2. Vercel détectera automatiquement les changements
3. Un nouveau déploiement sera déclenché
4. L'ancienne version reste active pendant le déploiement

## 📱 URLs

Après le déploiement, vous aurez :
- **Production URL** : `https://votre-app.vercel.app`
- **Preview URLs** : Pour chaque pull request

## 🔒 Sécurité

### Variables d'environnement sensibles
- Ne committez jamais les clés secrètes
- Utilisez les variables d'environnement Vercel
- Régénérez les secrets régulièrement

### CORS
- Configurez CORS pour votre domaine de production
- Limitez les origines autorisées

## 📊 Monitoring

Vercel fournit :
- **Analytics** : Visites, performance
- **Functions** : Logs des API routes
- **Speed Insights** : Performance de l'application

## 🆘 Support

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Community** : [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Support** : Via le dashboard Vercel

---

**Votre application Vinted est maintenant déployée sur Vercel ! 🎉** 