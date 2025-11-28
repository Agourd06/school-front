import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { companyApi } from '../api/company';
import { applyThemeToDocument, mergeTheme, defaultTheme } from '../theme/colors';

interface Company {
  id: number;
  name: string;
  email?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  company_id?: number | null;
  company?: Company | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, role?: 'user' | 'admin') => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  isLoading: boolean;
  companyId: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const normalizeCompany = (company?: Company | null | Record<string, unknown>): Company | null => {
  if (!company) return null;
  const raw = company as Company & { primary_color?: string | null; secondary_color?: string | null };
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email ?? null,
    primaryColor: raw.primaryColor ?? raw.primary_color ?? null,
    secondaryColor: raw.secondaryColor ?? raw.secondary_color ?? null,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser({
          ...parsedUser,
          company: normalizeCompany(parsedUser.company),
        });
        applyThemeToDocument(
          mergeTheme({
            primary: parsedUser?.company?.primaryColor ?? defaultTheme.primary,
            secondary: parsedUser?.company?.secondaryColor ?? defaultTheme.secondary,
            accent: parsedUser?.company?.secondaryColor ?? defaultTheme.secondary,
          })
        );
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user?.company) {
      applyThemeToDocument(
        mergeTheme({
          primary: user.company.primaryColor ?? defaultTheme.primary,
          secondary: user.company.secondaryColor ?? defaultTheme.secondary,
          accent: user.company.secondaryColor ?? defaultTheme.secondary,
        })
      );
    } else {
      applyThemeToDocument(defaultTheme);
    }
  }, [user?.company]);

  useEffect(() => {
    if (
      !user ||
      !user.company_id ||
      (user.company &&
        user.company.primaryColor &&
        user.company.secondaryColor)
    ) {
      return;
    }

    const fetchCompany = async () => {
      try {
        const company = await companyApi.getById(user.company_id!);
        setUser((prev) => {
          if (!prev) return prev;
          const nextUser = { ...prev, company };
          localStorage.setItem('user', JSON.stringify(nextUser));
          return nextUser;
        });
      } catch (error) {
        // Silently fail - company colors are optional
      }
    };

    fetchCompany();
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authApi.login({ email, password });

      // Handle your backend's response structure: {access_token, user: {id, email, username, role}}
      const token = data.token;
      const userData = data.user;

      if (!token || !userData) {
        throw new Error('Invalid login response: missing token or user data');
      }

      const user: User = {
        id: userData.id!,
        email: userData.email,
        username: userData.username,
        role: userData.role,
        company_id: userData.company_id ?? null,
        company: normalizeCompany(userData.company),
      };


      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      applyThemeToDocument(
        mergeTheme({
          primary: user.company?.primaryColor ?? defaultTheme.primary,
          secondary: user.company?.secondaryColor ?? defaultTheme.secondary,
          accent: user.company?.secondaryColor ?? defaultTheme.secondary,
        })
      );
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, role: 'user' | 'admin' = 'user') => {
    try {
      setIsLoading(true);
      await authApi.register({ username, email, password, role });
      // Note: Registration doesn't return a token, user needs to login
      // setToken(data.token);
      // setUser(data.user);
      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));
      await login(email, password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    applyThemeToDocument(defaultTheme);
  };

  const forgotPassword = async (email: string) => {
    try {
      await authApi.forgotPassword({ email });
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (resetToken: string, password: string) => {
    try {
      await authApi.resetPassword(resetToken, { password });
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword, confirmPassword });
    } catch (error) {
      throw error;
    }
  };

  const companyId = user?.company_id ?? null;

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    isLoading,
    companyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
