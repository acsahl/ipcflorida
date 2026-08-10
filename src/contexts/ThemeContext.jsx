import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "bbr.theme";

// `swatch` is what the picker shows: [ground, accent].
export const THEMES = [
  { id: "evergreen", label: "Evergreen", swatch: ["#e9ede4", "#2f6b4f"] },
  { id: "autumn",    label: "Autumn",    swatch: ["#fbf0e0", "#b4531f"] },
  { id: "oxblood",   label: "Oxblood",   swatch: ["#f4e8e3", "#8c2f39"] },
  { id: "midnight",  label: "Midnight",  swatch: ["#e4e8f0", "#1f3d7a"] },
  { id: "cobalt",    label: "Cobalt",    swatch: ["#e6e5e2", "#2f4fd0"] },
  { id: "clay",      label: "Clay",      swatch: ["#f0e2d5", "#1f6f6b"] },
];

const IDS = THEMES.map((t) => t.id);
const DEFAULT = "evergreen";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return IDS.includes(saved) ? saved : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!IDS.includes(next)) return;
    setThemeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
