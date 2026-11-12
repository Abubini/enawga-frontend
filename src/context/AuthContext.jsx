import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthAPI, UsersAPI } from '../lib/api';
import { setAccessToken, getAccessToken, registerUnauthorizedHandler, refreshAccessToken } from '../lib/http';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (getAccessToken()) {
          const { data } = await UsersAPI.me();
          setUser(data);
        } else {
          // Try silent refresh via the httpOnly cookie (page reload case)
          await refreshAccessToken();
          const { data } = await UsersAPI.me();
          setUser(data);
        }
      } catch {
        clearSession();
      } finally {
        setBooting(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await AuthAPI.login({ email, password });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, name) => {
    const { data } = await AuthAPI.register({ email, password, name });
    return data; // { user_id, email, message }
  }, []);

  const verifyEmail = useCallback(async (userId, otp) => {
    const { data } = await AuthAPI.verifyEmail({ user_id: userId, otp });
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthAPI.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const { data } = await UsersAPI.me();
    setUser(data);
    return data;
  }, []);

  const setTokenFromOAuth = useCallback(async (token) => {
    setAccessToken(token);
    const { data } = await UsersAPI.me();
    setUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      booting,
      login,
      register,
      verifyEmail,
      logout,
      refreshUser,
      setTokenFromOAuth,
    }),
    [user, booting, login, register, verifyEmail, logout, refreshUser, setTokenFromOAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
