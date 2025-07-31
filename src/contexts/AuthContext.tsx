import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_CONFIG, GoogleUser, AuthConfig } from '@/config/auth';
import { API_URL } from '@/config';

interface AuthContextType {
  user: GoogleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authEnabled: boolean;
  apiError: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const fetchAuthConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/dashboard/platform/info`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const platformInfo = await response.json();
      setAuthEnabled(platformInfo.authConfig?.enabled || false);
      setApiError(false); // Clear API error on successful connection

      // If auth is disabled, skip authentication
      if (!platformInfo.authConfig?.enabled) {
        setIsLoading(false);
        return;
      }

      // Check existing session
      await checkExistingSession();
    } catch (error) {
      console.error('Failed to fetch auth config:', error);
      // Secure fallback: when API is down, assume auth is enabled
      setAuthEnabled(true);
      setApiError(true); // Set API error flag
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingSession = async () => {
    try {
      const token = localStorage.getItem('google_token');
      if (token) {
        // Verify token with backend
        const response = await fetch(`${API_URL}/v1/dashboard/platform/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('google_token');
        }
      }
    } catch (error) {
      console.error('Failed to check existing session:', error);
      localStorage.removeItem('google_token');
    }
  };

  const login = async (credential: string) => {
    try {
      // Store token
      localStorage.setItem('google_token', credential);

      // Verify token with backend
      const response = await fetch(`${API_URL}/v1/dashboard/platform/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credential }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        throw new Error('Failed to verify token');
      }
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('google_token');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('google_token');
  };

  useEffect(() => {
    fetchAuthConfig();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authEnabled,
    apiError,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 