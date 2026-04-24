// ZelpStore API Service
const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('zelpstore_token');
}

function getAdminToken() {
  return localStorage.getItem('_admin_token');
}

export function setToken(token) {
  localStorage.setItem('zelpstore_token', token);
}

export function removeToken() {
  localStorage.removeItem('zelpstore_token');
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
  removeToken();
  removeUser();
  window.location.href = '/login';
}

export function returnToAdmin() {
  const adminToken = getAdminToken();
  if (!adminToken) return;
  setToken(adminToken);
  localStorage.removeItem('_admin_token');
  localStorage.removeItem('_admin_user');
  window.location.href = '/admin';
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // If body is FormData, let the browser set Content-Type with boundary
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || (response.status === 404 && endpoint === '/auth/me')) {
        removeToken();
        removeUser();
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
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
