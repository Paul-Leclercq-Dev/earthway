import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  emailVerified: boolean;
  xp: number;
  level: number;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [refreshToken, setRefreshTokenState] = useState<string | null>(
    localStorage.getItem('refreshToken')
  );
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (accessToken) {
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [accessToken]);

  const setTokens = (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    setAccessToken(access);
    setRefreshTokenState(refresh);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken: access, refreshToken: refresh } = response.data;
      
      setUser(userData);
      setTokens(access, refresh);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      const { user: userData, accessToken: access, refreshToken: refresh } = response.data;
      
      setUser(userData);
      setTokens(access, refresh);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setAccessToken(null);
    setRefreshTokenState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        setUser,
        setTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
