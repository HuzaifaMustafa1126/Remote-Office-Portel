import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { applyTheme, initialPreferences, readPreferences, sanitize, storageKey, themeTokens, DEFAULTS } from '../theme/theme';
const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);
export function ThemeProvider({ children }) {
  const { user, loading } = useAuth();
  const [saved, setSaved] = useState(initialPreferences), [preview, setPreview] = useState(null), [storageError, setStorageError] = useState('');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useLayoutEffect(() => {
    if (loading) return;
    setPreview(null);
    if (user) {
      setSaved(readPreferences(user.id));
      try { localStorage.setItem('remote-office-appearance:last-user', String(user.id)); } catch { /* Preferences remain usable in memory. */ }
    }
  }, [user?.id, loading]);
  const active = preview || saved;
  useLayoutEffect(() => applyTheme(active, systemDark), [active, systemDark]);
  useEffect(() => {
    const sync = (event) => { if (event.key === storageKey(user?.id)) { setSaved(readPreferences(user?.id)); setPreview(null); } };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [user?.id]);
  function persist(next) {
    const value = sanitize(next);
    setSaved(value); setPreview(null); setStorageError('');
    try { localStorage.setItem(storageKey(user?.id), JSON.stringify(value));
      localStorage.setItem(`${storageKey(user?.id)}:paint`, JSON.stringify({ light: themeTokens(value, false), dark: themeTokens(value, true) })); }
    catch { setStorageError('Your browser could not save this preference. It will last until you close or refresh this page.'); }
  }
  const favorite = (id) => {
    const favorites = saved.favorites.includes(id) ? saved.favorites.filter((item) => item !== id) : [...saved.favorites, id];
    const currentPreview = preview;
    persist({ ...saved, favorites });
    if (currentPreview) setPreview({ ...currentPreview, favorites });
  };
  return <ThemeContext.Provider value={{ saved, active, preview, systemDark, storageError, persist, favorite, previewTheme: (next) => setPreview(sanitize(next)), cancelPreview: () => setPreview(null), applyPreview: () => persist(preview || saved), reset: () => persist({ ...DEFAULTS, customs: saved.customs, favorites: saved.favorites }) }}>{children}</ThemeContext.Provider>;
}
