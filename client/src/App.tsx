import React from 'react';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🏦 MB Marie Banque</h1>
          <p className="text-xl text-blue-200">Votre application bancaire moderne</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Carte de connexion */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4">🔐 Connexion</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Identifiant</label>
                  <input 
                    type="text" 
                    placeholder="Votre identifiant"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe</label>
                  <input 
                    type="password" 
                    placeholder="Votre mot de passe"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50"
                  />
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  Se connecter
                </button>
              </div>
            </div>

            {/* Informations */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-semibold mb-4">ℹ️ Informations</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-200">Identifiants de test :</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <div>
                      <strong>Conseiller :</strong> conseiller / password123
                    </div>
                    <div>
                      <strong>Client :</strong> client / password123 (PIN: 123456)
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-200">Fonctionnalités :</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Interface conseiller et client</li>
                    <li>• Gestion des comptes et cartes</li>
                    <li>• Transferts et virements</li>
                    <li>• Notifications en temps réel</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Statut du déploiement */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-200">✅ Déployé avec succès sur Vercel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
