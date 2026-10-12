import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AdminUser } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  userToken: string | null;
  adminToken: string | null;
  isLoading: boolean;
  loginUser: (token: string, user: User) => void;
  logoutUser: () => void;
  loginAdmin: (token: string, admin: AdminUser) => void;
  logoutAdmin: () => void;
  refreshUser: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [userToken, setUserToken] = useState<string | null>(() => localStorage.getItem('takaearn_user_token'));
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('takaearn_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!userToken) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token expired
        logoutUser();
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  const refreshAdmin = async () => {
    if (!adminToken) {
      setAdmin(null);
      return;
    }
    try {
      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
      } else {
        logoutAdmin();
      }
    } catch (e) {
      console.error('Failed to refresh admin:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await Promise.all([refreshUser(), refreshAdmin()]);
      setIsLoading(false);
    };
    initAuth();
  }, [userToken, adminToken]);

  const loginUser = (token: string, userData: User) => {
    localStorage.setItem('takaearn_user_token', token);
    setUserToken(token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('takaearn_user_token');
    setUserToken(null);
    setUser(null);
  };

  const loginAdmin = (token: string, adminData: AdminUser) => {
    localStorage.setItem('takaearn_admin_token', token);
    setAdminToken(token);
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('takaearn_admin_token');
    setAdminToken(null);
    setAdmin(null);
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        userToken,
        adminToken,
        isLoading,
        loginUser,
        logoutUser,
        loginAdmin,
        logoutAdmin,
        refreshUser,
        updateUserBalance,
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
