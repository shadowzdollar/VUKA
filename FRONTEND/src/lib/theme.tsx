import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type ThemePreference = "light";

/**
 * Ensures the document is always in light mode before first paint, clearing any legacy dark state.
 */
export const themeInitScript = `(function(){try{document.documentElement.classList.remove("dark");localStorage.removeItem("vuka.theme")}catch(e){}})();`;

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "light";
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      window.localStorage.removeItem("vuka.theme");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setPreference = useCallback(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const value = useMemo(
    () => ({ preference: "light" as const, resolved: "light" as const, setPreference }),
    [setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
