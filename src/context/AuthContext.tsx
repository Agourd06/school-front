import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import { companyApi } from '../api/company';
import { applyThemeToDocument, mergeTheme, defaultTheme } from '../theme/colors';
import type { Profile } from '../types/profile';

interface Company {
  id: number;
  name: string;
  logo?: string | null;
  email?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface User {
  id: number;
  email: string;
  username: string;
  profile: Profile;
  company_id?: number | null;
  company?: Company | null;
  roles?: string[];
  allowedPages?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, profile?: Profile) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshPermissions: () => Promise<void>;
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
    logo: raw.logo ?? null,
    email: raw.email ?? null,
    primaryColor: raw.primaryColor ?? raw.primary_color ?? null,
    secondaryColor: raw.secondaryColor ?? raw.secondary_color ?? null,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SECURITY CRITICAL: Always validate user from server on app init
  // Never trust localStorage for roles/profile - always fetch from database
  useEffect(() => {
    const validateUserFromServer = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Always fetch fresh user data from server - never trust localStorage
        // This prevents role manipulation attacks (e.g., editing localStorage to become admin)
        const profileResponse = await authApi.getProfile();
        const serverUser = profileResponse.user as User & { roles?: string[]; allowedPages?: string[] };
        
        if (!serverUser) {
          // Invalid token or user doesn't exist - clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('allowedPages');
          setIsLoading(false);
          return;
        }

        // Get allowedPages from server (via getMyRoutes endpoint)
        let allowedPages: string[] = [];
        try {
          const { pagesApi } = await import('../api/pages');
          const routesResponse = await pagesApi.getMyRoutes();
          allowedPages = Array.isArray(routesResponse) ? routesResponse : [];
        } catch (error) {
          // Non-critical - permissions will be checked per route
          // Use allowedPages from server user if available
          allowedPages = Array.isArray(serverUser.allowedPages) ? serverUser.allowedPages : [];
        }

        // Use ONLY server-validated data - never modify roles/profile client-side
        const validatedUser: User = {
          id: serverUser.id!,
          email: serverUser.email,
          username: serverUser.username,
          profile: serverUser.profile, // From server DB - cannot be manipulated
          company_id: serverUser.company_id ?? null,
          company: normalizeCompany(serverUser.company),
          roles: Array.isArray(serverUser.roles) ? serverUser.roles : [], // From server DB - cannot be manipulated
          allowedPages: allowedPages, // From server DB - cannot be manipulated
        };

        // SECURITY: Store validated data ONLY for caching/offline detection
        // NEVER use localStorage for auth decisions - always validate from server
        // This cache can be manipulated by attackers, so it's only used for UX, not security
        localStorage.setItem('user', JSON.stringify(validatedUser));
        localStorage.setItem('allowedPages', JSON.stringify(allowedPages));
        
        // Update state with server-validated data
        setToken(storedToken);
        setUser(validatedUser);
        
        applyThemeToDocument(
          mergeTheme({
            primary: validatedUser.company?.primaryColor ?? defaultTheme.primary,
            secondary: validatedUser.company?.secondaryColor ?? defaultTheme.secondary,
            accent: validatedUser.company?.secondaryColor ?? defaultTheme.secondary,
          })
        );
      } catch (error) {
        // Token invalid or server error - clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('allowedPages');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateUserFromServer();
  }, []);

  // Track applied theme colors to prevent unnecessary re-applications
  const appliedThemeRef = useRef<{ primary: string; secondary: string } | null>(null);

  useEffect(() => {
    if (user?.company) {
      const primary = user.company.primaryColor ?? defaultTheme.primary;
      const secondary = user.company.secondaryColor ?? defaultTheme.secondary;
      
      // Only apply theme if colors actually changed
      if (
        appliedThemeRef.current?.primary !== primary ||
        appliedThemeRef.current?.secondary !== secondary
      ) {
        applyThemeToDocument(
          mergeTheme({
            primary,
            secondary,
            accent: secondary,
          })
        );
        appliedThemeRef.current = { primary, secondary };
      }
    } else {
      // Only apply default theme if we haven't already applied it
      if (appliedThemeRef.current !== null) {
        applyThemeToDocument(defaultTheme);
        appliedThemeRef.current = null;
      }
    }
  }, [user?.company?.primaryColor, user?.company?.secondaryColor]);

  // Track if we've fetched company to prevent infinite loops
  const companyFetchedRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !user ||
      !user.company_id ||
      (user.company &&
        user.company.primaryColor &&
        user.company.secondaryColor)
    ) {
      // Reset ref if user changes or company already has colors
      if (!user || !user.company_id) {
        companyFetchedRef.current = null;
      }
      return;
    }

    // Prevent fetching if we've already fetched for this company_id
    if (companyFetchedRef.current === user.company_id) {
      return;
    }

    // Mark that we're fetching for this company_id
    companyFetchedRef.current = user.company_id;

    const fetchCompany = async () => {
      try {
        const company = await companyApi.getById(user.company_id!);
        
        // Only update if the company data actually changed
        setUser((prev) => {
          if (!prev || prev.company_id !== user.company_id) {
            // User changed while fetching, don't update
            return prev;
          }
          
          // Check if company data is different before updating
          const currentCompany = prev.company;
          if (
            currentCompany?.id === company.id &&
            currentCompany?.primaryColor === company.primaryColor &&
            currentCompany?.secondaryColor === company.secondaryColor
          ) {
            // No change needed, return previous to prevent re-render
            return prev;
          }
          
          const nextUser = { ...prev, company };
          localStorage.setItem('user', JSON.stringify(nextUser));
          return nextUser;
        });
      } catch (error) {
        // Reset ref on error so we can retry if needed
        companyFetchedRef.current = null;
        // Silently fail - company colors are optional
      }
    };

    fetchCompany();
  }, [user?.company_id, user?.company?.id, user?.company?.primaryColor, user?.company?.secondaryColor]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authApi.login({ email, password });

      // Handle your backend's response structure: {token, user: {id, email, username, profile, roles, allowedPages}}
      const token = data.token;
      const userData = data.user;

      if (!token || !userData) {
        throw new Error('Invalid login response: missing token or user data');
      }

      // SECURITY: Use ONLY server-provided roles - never modify client-side
      // Roles come from database and cannot be manipulated
      let allowedPages = userData.allowedPages || [];
      let roles = Array.isArray(userData.roles) ? userData.roles : [];
      
      // NEVER modify roles client-side - always trust server response
      
      // Save token FIRST so axios interceptor can use it for subsequent API calls
      localStorage.setItem('token', token);
      
      // IMPORTANT: All users (including admins) need allowedPages from server
      // The backend sets allowedPages based on role-page assignments
      // New admins only have /settings and /users in allowedPages
      // Only fetch if allowedPages is not in the login response
      if (!allowedPages.length) {
        try {
          // Token is now in localStorage, axios interceptor will pick it up
          const { pagesApi } = await import('../api/pages');
          const routesResponse = await pagesApi.getMyRoutes();
          allowedPages = Array.isArray(routesResponse) ? routesResponse : [];
        } catch (error: unknown) {
          // Silently fail - non-critical, permissions will be checked per route
          // This can fail if:
          // - Token isn't valid yet (timing issue)
          // - Backend doesn't support the endpoint
          // - User doesn't have permission
          // We catch it here so it doesn't block login
        }
      }

      const user: User = {
        id: userData.id!,
        email: userData.email,
        username: userData.username,
        profile: userData.profile,
        company_id: userData.company_id ?? null,
        company: normalizeCompany(userData.company),
        roles,
        allowedPages,
      };

      // SECURITY: Store server-validated user data (only for caching - never used for auth)
      // Roles and profile come directly from server response - never modified client-side
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('allowedPages', JSON.stringify(allowedPages));
      
      // Then update React state - this ensures both are in sync
      setToken(token);
      setUser(user);
      
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

  const register = async (username: string, email: string, _password: string, _profile: Profile = 'admin') => {
    try {
      setIsLoading(true);
      // Note: RegisterRequest only accepts username, email, and company_id
      // Password and profile are not accepted - backend sends password setup email
      await authApi.register({ username, email, company_id: 1 });
      // Note: Registration doesn't return a token, user needs to login
      // setToken(data.token);
      // setUser(data.user);
      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));
      // Note: User cannot login immediately after registration since backend sends password setup email
      // User must click the link in the email to set their password first
      // await login(email, _password);
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
    localStorage.removeItem('allowedPages');
    applyThemeToDocument(defaultTheme);
  };

  // SECURITY: Refresh permissions from server - never modify roles/profile
  const refreshPermissions = async () => {
    try {
      const { pagesApi } = await import('../api/pages');
      const routesResponse = await pagesApi.getMyRoutes();
      const routes = Array.isArray(routesResponse) ? routesResponse : [];
      
      // Update only allowedPages from server - never modify roles/profile
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, allowedPages: routes };
        // Store updated data (only for caching - never used for auth)
        localStorage.setItem('user', JSON.stringify(updated));
        localStorage.setItem('allowedPages', JSON.stringify(routes));
        return updated;
      });
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
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
    refreshPermissions,
    isLoading,
    companyId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
