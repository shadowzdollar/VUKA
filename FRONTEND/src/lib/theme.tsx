import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type ThemePreference = "dark" | "light";

/**
 * Ensures the document is always in dark mode before first paint, matching the shadcn-fintech black & white palette.
 */
export const themeInitScript = `(function(){try{document.documentElement.classList.add("dark");}catch(e){}})();`;

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: "dark";
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const setPreference = useCallback(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const value = useMemo(
    () => ({ preference: "dark" as const, resolved: "dark" as const, setPreference }),
    [setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
