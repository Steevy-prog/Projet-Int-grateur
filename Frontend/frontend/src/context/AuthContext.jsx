import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, logout as apiLogout, tryRefresh } from '../services/auth';
import { clearToken } from '../services/api';

const USER_KEY = 'agrismart_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                     = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]               = useState(true);
  const navigate = useNavigate();

  // On mount: try to restore session from httpOnly refresh cookie.
  // ignored ref prevents the StrictMode double-invoke from sending two
  // simultaneous refresh requests (which would rotate the token twice
  // and leave the cookie holding a revoked token).
  useEffect(() => {
    let ignored = false;
    const restore = async () => {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) { setLoading(false); return; }
      const token = await tryRefresh();
      if (ignored) return;
      if (token) {
        setUser(JSON.parse(stored));
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(USER_KEY);
      }
      setLoading(false);
    };
    restore();
    return () => { ignored = true; };
  }, []);

  // Listen for session expiry triggered by api.js auto-refresh failure
  useEffect(() => {
    const handler = () => _clearSession();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const _clearSession = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const login = async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      _clearSession();
    }
  };

  const value = { user, isAuthenticated, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
