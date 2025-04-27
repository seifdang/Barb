// Fichier de configuration pour l'application mobile
// Ce fichier centralise toutes les configurations de l'application

// Configuration des environnements
const ENV = {
  development: {
    API_URL: 'https://barb-kq5v.onrender.com/api', // Pour les émulateurs Android
    API_URL_ALTERNATIVES: [
      'http://localhost:5000/api',
      'http://127.0.0.1:5000/api'
    ],
    DEBUG: true,
    TIMEOUT: 10000, // 10 secondes
    MAX_RETRIES: 3
  },
  staging: {
    API_URL: 'https://barb-kq5v.onrender.com/api',
    DEBUG: true,
    TIMEOUT: 15000, // 15 secondes
    MAX_RETRIES: 2
  },
  production: {
    API_URL: 'https://barb-kq5v.onrender.com/api',
    DEBUG: false,
    TIMEOUT: 20000, // 20 secondes
    MAX_RETRIES: 1
  }
};

// Déterminer l'environnement actuel
// Dans un vrai projet, cela pourrait être défini par une variable d'environnement
const currentEnv = process.env.NODE_ENV || 'development';

// Exporter la configuration pour l'environnement actuel
export default ENV[currentEnv];
