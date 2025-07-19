// src/config/api.config.js

// Base server URL (without any path)
const BASE_URL = 'https://dus-backend-production.up.railway.app';

// API endpoints URL (with /api path)
const API_URL = `${BASE_URL}/api`;

// Socket.IO URL (root server URL, no /api path)
const SOCKET_URL = BASE_URL;

// Export both configurations
export { API_URL, SOCKET_URL, BASE_URL };

// Keep default export for backward compatibility
export default API_URL;
