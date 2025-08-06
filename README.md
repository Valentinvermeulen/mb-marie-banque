# 🏦 MB Marie Banque - Application Bancaire

Une application bancaire moderne développée avec React, TypeScript, et Node.js.

## 🚀 Fonctionnalités

### 👤 Interface Client
- **Tableau de bord** avec vue d'ensemble des comptes
- **Gestion des cartes** virtuelles et physiques
- **Système de virements** entre comptes
- **Communication** avec le conseiller
- **Gestion des RIB/IBAN**
- **Paramètres biométriques**

### 👨‍💼 Interface Conseiller
- **Gestion des clients** et approbation de comptes
- **Création de cartes** et comptes
- **Tableau de bord** avec statistiques
- **Gestion des informations** bancaires
- **Support client**

## 🛠️ Technologies

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Shadcn/ui
- **Backend**: Express.js + TypeScript
- **Base de données**: SQLite (développement) / PostgreSQL (production)
- **ORM**: Drizzle ORM
- **Authentification**: Session-based avec PIN

## 🔑 Identifiants de test

### Conseiller
- **Username**: `conseiller`
- **Password**: `password123`

### Client
- **Username**: `client`
- **Password**: `password123`
- **PIN**: `123456`

## 🚀 Installation

1. **Cloner le repository**
```bash
git clone <votre-repo-url>
cd mb-marie-banque
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Initialiser la base de données**
```bash
npm run init-db
```

4. **Lancer l'application**
```bash
npm run dev
```

5. **Accéder à l'application**
- Local: http://localhost:8080
- Réseau: http://VOTRE_IP:8080

## 📱 Déploiement

### Vercel (Recommandé)
1. Connectez votre repository GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez automatiquement

### Autres options
- Railway
- Heroku
- DigitalOcean

## 🎨 Interface

L'application propose une interface moderne et responsive avec :
- Design adaptatif (mobile/desktop)
- Thème sombre/clair
- Animations fluides
- Navigation intuitive

## 🔒 Sécurité

- Authentification par session
- Validation des données côté serveur
- Protection CSRF
- Chiffrement des mots de passe
- Gestion des permissions

## 📊 Base de données

L'application utilise SQLite en développement avec les tables suivantes :
- `users` - Utilisateurs et conseillers
- `accounts` - Comptes bancaires
- `cards` - Cartes de crédit/débit
- `transactions` - Historique des transactions
- `user_ribs` - Informations RIB

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Développeur

Développé avec ❤️ pour démontrer les capacités d'une application bancaire moderne.

---

**Note**: Cette application est un projet de démonstration et ne doit pas être utilisée pour de vraies transactions bancaires. 