import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vibesafe_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('vibesafe_token');
      const storedUser = localStorage.getItem('vibesafe_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Verify with backend silently
          const res = await api.auth.me().catch(() => null);
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('vibesafe_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification fallback:', err);
        }
      } else {
        // Pre-fill demo user if first time
        const defaultDemoUser = {
          id: 'usr_admin_1',
          email: 'admin@vibesafe.io',
          name: 'Chief Commander Sarah Vance',
          role: 'admin',
          phone: '+1 (555) 911-0199',
        };
        // Auto-login demo user for immediate testing convenience
        login('admin@vibesafe.io', 'vibesafe123').catch(() => {
          setUser(defaultDemoUser);
          setToken('demo_token_admin');
        });
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.auth.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('vibesafe_token', data.token);
      localStorage.setItem('vibesafe_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      // In case server is in demo/offline mode
      if (email === 'admin@vibesafe.io') {
        const demoUser = {
          id: 'usr_admin_1',
          email: 'admin@vibesafe.io',
          name: 'Chief Commander Sarah Vance',
          role: 'admin',
          phone: '+1 (555) 911-0199',
        };
        setUser(demoUser);
        setToken('demo_token_admin');
        localStorage.setItem('vibesafe_token', 'demo_token_admin');
        localStorage.setItem('vibesafe_user', JSON.stringify(demoUser));
        return { user: demoUser, token: 'demo_token_admin' };
      }
      throw err;
    }
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('vibesafe_token', data.token);
    localStorage.setItem('vibesafe_user', JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vibesafe_token');
    localStorage.removeItem('vibesafe_user');
  };

  const quickLoginAs = async (role) => {
    if (role === 'admin') {
      return login('admin@vibesafe.io', 'vibesafe123');
    } else if (role === 'responder') {
      return login('responder@vibesafe.io', 'responder123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
