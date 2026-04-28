// ZelpStore API Service
const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('zelpstore_token');
}

function getRefreshToken() {
  return localStorage.getItem('zelpstore_refresh_token');
}

function getAdminToken() {
  return localStorage.getItem('_admin_token');
}

export function setToken(token, refreshToken) {
  if (token) localStorage.setItem('zelpstore_token', token);
  if (refreshToken) localStorage.setItem('zelpstore_refresh_token', refreshToken);
}

export function removeToken() {
  localStorage.removeItem('zelpstore_token');
  localStorage.removeItem('zelpstore_refresh_token');
}

export function getUser() {
  try {
    const data = localStorage.getItem('zelpstore_user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function setUser(user) {
  localStorage.setItem('zelpstore_user', JSON.stringify(user));
}

export function removeUser() {
  localStorage.removeItem('zelpstore_user');
}

export function isLoggedIn() {
  return !!getToken();
}

export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}

export function logout() {
  const refreshToken = getRefreshToken();
  // Optional: call logout on backend to revoke token
  if (refreshToken) {
    fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    }).catch(() => {});
  }
  
  removeToken();
  removeUser();
  localStorage.removeItem('_admin_token');
  localStorage.removeItem('_admin_user');
  window.location.href = '/login';
}

export function returnToAdmin() {
  const adminToken = getAdminToken();
  const adminUser = localStorage.getItem('_admin_user');
  if (!adminToken) return;
  
  setToken(adminToken);
  if (adminUser) {
    localStorage.setItem('zelpstore_user', adminUser);
  }
  
  localStorage.removeItem('_admin_token');
  localStorage.removeItem('_admin_user');
  window.location.href = '/admin';
}

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, { ...options, headers });
    
    // Handle 401 - Unauthorized (Token Expired)
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              setToken(refreshData.token, refreshData.refreshToken);
              isRefreshing = false;
              onRefreshed(refreshData.token);
            } else {
              // Refresh failed
              isRefreshing = false;
              logout();
              throw new Error('Sesi berakhir');
            }
          } catch (err) {
            isRefreshing = false;
            logout();
            throw err;
          }
        }

        // Wait for refresh to complete
        const newToken = await new Promise(resolve => {
          subscribeTokenRefresh(token => resolve(token));
        });

        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, { ...options, headers });
        return await retryRes.json();
      } else {
        // No refresh token, just logout
        logout();
      }
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || (response.status === 404 && endpoint === '/auth/me')) {
        // Logic handled above or fallback
        if (!isRefreshing) logout();
      }
      throw new Error(data.error || 'Terjadi kesalahan');
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Tidak bisa terhubung ke server. Pastikan backend sudah berjalan.');
    }
    throw err;
  }
}

const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: isFormData ? body : JSON.stringify(body) 
    });
  },
  put: (endpoint, body, options) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: isFormData ? body : JSON.stringify(body) 
    });
  },
  patch: (endpoint, body, options) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: isFormData ? body : JSON.stringify(body) 
    });
  },
  del: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  getToken, setToken, removeToken,
  getUser, setUser, removeUser,
  isLoggedIn, isAdmin, logout, returnToAdmin,
};

export default api;
