import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthUser, clearToken, fetchMe, getToken, loginRequest, setToken } from "../utils/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe(token)
      .then((me) => setUser(me))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const token = await loginRequest(username, password);
      setToken(token);
      const me = await fetchMe(token);
      setUser(me);
    } catch (err) {
      clearToken();
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return (user.permissions || []).includes(permission);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, hasPermission }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
};
