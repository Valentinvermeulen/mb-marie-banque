import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦 MB Marie Banque</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.8 }}>Votre application bancaire moderne</p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Carte de connexion */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🔐 Connexion</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Identifiant
                </label>
                <input 
                  type="text" 
                  placeholder="Votre identifiant"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Mot de passe
                </label>
                <input 
                  type="password" 
                  placeholder="Votre mot de passe"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <button style={{
                width: '100%',
                background: '#2563eb',
                color: 'white',
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Se connecter
              </button>
            </div>
          </div>

          {/* Informations */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>ℹ️ Informations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: '600', opacity: 0.8, marginBottom: '0.5rem' }}>
                  Identifiants de test :
                </h3>
                <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                  <div><strong>Conseiller :</strong> conseiller / password123</div>
                  <div><strong>Client :</strong> client / password123 (PIN: 123456)</div>
                </div>
              </div>
              <div>
                <h3 style={{ fontWeight: '600', opacity: 0.8, marginBottom: '0.5rem' }}>
                  Fonctionnalités :
                </h3>
                <ul style={{ fontSize: '0.875rem', lineHeight: '1.5', margin: 0, paddingLeft: '1rem' }}>
                  <li>Interface conseiller et client</li>
                  <li>Gestion des comptes et cartes</li>
                  <li>Transferts et virements</li>
                  <li>Notifications en temps réel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Statut du déploiement */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '9999px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#22c55e',
              borderRadius: '50%',
              marginRight: '0.5rem',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ color: '#bbf7d0' }}>✅ Déployé avec succès sur Vercel</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default App;
