// Configuration for different environments
const config = {
  development: {
    BACKEND_URL: 'http://localhost:5000',
    FRONTEND_URL: 'http://localhost:3000'
  },
  production: {
    BACKEND_URL: 'https://zingchat-backend.onrender.com',
    FRONTEND_URL: 'https://zingchat-s06a.onrender.com'
  }
};

// Determine environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const environment = isDevelopment ? 'development' : 'production';

// Export configuration
window.APP_CONFIG = config[environment];

// Backward compatibility
const API_BASE_URL = window.APP_CONFIG.BACKEND_URL;

function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}