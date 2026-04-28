import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => api.getUser());
  const [token, setTokenState] = useState(() => api.getToken());

  const login = (tokenVal, refreshTokenVal, userData) => {
    api.setToken(tokenVal, refreshTokenVal);
    api.setUser(userData);
    setTokenState(tokenVal);
    setUserState(userData);
  };

  const logout = () => {
    api.removeToken();
    api.removeUser();
    setTokenState(null);
    setUserState(null);
  };

  const updateUser = (userData) => {
    api.setUser(userData);
    setUserState(userData);
  };

  const isLoggedIn = !!token;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, isAdmin, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
