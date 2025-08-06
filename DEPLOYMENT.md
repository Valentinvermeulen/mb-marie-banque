# Guide de Déploiement Vercel

## Configuration Actuelle

Cette application est configurée pour être déployée sur Vercel avec les paramètres suivants :

### Structure du Projet
```
APP/
├── client/           # Application React
├── server/           # Serveur Express (optionnel)
├── shared/           # Code partagé
├── vercel.json       # Configuration Vercel
└── package.json      # Scripts de build
```

### Configuration Vercel

Le fichier `vercel.json` est configuré pour :
- Construire l'application React depuis le dossier `client/`
- Servir les fichiers statiques depuis `dist/public/`
- Gérer les routes pour le SPA (Single Page Application)
- Optimiser le cache pour les assets

### Scripts de Build

- `npm run build` : Construit l'application client
- `npm run vercel-build` : Script spécifique pour Vercel

## Déploiement

1. **Connectez votre repository à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Importez votre repository GitHub/GitLab
   - Vercel détectera automatiquement la configuration

2. **Variables d'environnement (si nécessaire)**
   - Ajoutez vos variables d'environnement dans les paramètres Vercel
   - Exemple : `NODE_ENV=production`

3. **Déploiement automatique**
   - Chaque push sur la branche principale déclenche un déploiement
   - Les pull requests créent des previews automatiques

## Résolution des Problèmes

### Erreur de Build
- Vérifiez que tous les packages sont installés : `npm install`
- Assurez-vous que TypeScript compile sans erreurs
- Vérifiez les logs de build dans Vercel

### Erreur de Routing
- L'application utilise le routing SPA
- Toutes les routes non-assets redirigent vers `index.html`
- Vérifiez que `vercel.json` est correctement configuré

### Assets non trouvés
- Les assets doivent être dans le dossier `public/`
- Vérifiez les chemins dans le code
- Assurez-vous que les assets sont copiés lors du build

## Optimisations

- Les assets sont mis en cache avec des headers appropriés
- L'application est optimisée pour les performances
- Le code est minifié et optimisé automatiquement

## Support

Pour toute question ou problème :
1. Vérifiez les logs de déploiement dans Vercel
2. Testez localement avec `npm run build`
3. Consultez la documentation Vercel 