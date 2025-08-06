// Configuration pour l'API
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://mb-marie-banque-api.vercel.app' // URL de votre API déployée
  : 'http://localhost:8080'; // URL locale pour le développement

export const config = {
  apiUrl: API_BASE_URL,
  appName: 'MB Marie Banque',
  version: '1.0.0'
}; 