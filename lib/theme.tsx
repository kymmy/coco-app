"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("tribu_theme") as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mq.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  function setTheme(t: ThemeMode) {
    setThemeState(t);
    localStorage.setItem("tribu_theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
