import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, tokenStore } from './api.js';
import { Seo } from './ssr.jsx';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) return setReady(true);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
  }, []);
  const signOut = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export const dashboardPath = (role) => (role === 'admin' ? '/admin' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/parent');

/** Guards a page by role; sends logged-out users to login and back afterwards. */
export function RequireRole({ roles, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  const noindex = <Seo title="My account" description="Account area" noindex />;
  if (!ready) return <div className="wrap page-pad">{noindex}<p className="muted">Loading…</p></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <>{noindex}{children}</>;
}
