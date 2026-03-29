"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type Dialect = "central" | "isan" | "northern" | "southern";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
  dialect: Dialect;
  setDialect: (d: Dialect) => void;
}>({ theme: "light", toggle: () => {}, dialect: "central", setDialect: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [dialect, setDialectState] = useState<Dialect>("central");

  useEffect(() => {
    const saved = localStorage.getItem("thaiclaw-theme") as Theme;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
    const savedDialect = localStorage.getItem("thaiclaw-dialect") as Dialect;
    if (savedDialect) setDialectState(savedDialect);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("thaiclaw-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  function setDialect(d: Dialect) {
    setDialectState(d);
    localStorage.setItem("thaiclaw-dialect", d);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, dialect, setDialect }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
