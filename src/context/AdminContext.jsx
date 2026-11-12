import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AdminAPI, getAdminKey, setAdminKey } from '../lib/adminApi';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [authorized, setAuthorized] = useState(() => !!getAdminKey());
  const [verifying, setVerifying] = useState(false);

  const login = useCallback(async (key) => {
    setVerifying(true);
    setAdminKey(key);
    try {
      // /admin/stats doubles as a "does this key work" check — the backend
      // returns 403 immediately if X-Admin-Key doesn't match SECRET_KEY.
      await AdminAPI.stats();
      setAuthorized(true);
      return true;
    } catch (err) {
      setAdminKey('');
      setAuthorized(false);
      throw err;
    } finally {
      setVerifying(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAdminKey('');
    setAuthorized(false);
  }, []);

  const value = useMemo(
    () => ({ authorized, verifying, login, logout }),
    [authorized, verifying, login, logout]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}