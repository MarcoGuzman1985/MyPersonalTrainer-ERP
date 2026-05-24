"use client";

import { create } from "zustand";

interface UiState {
  /** Sidebar móvil abierto/cerrado. */
  mobileNavOpen: boolean;
  setMobileNav: (open: boolean) => void;
  /** Sidebar de escritorio colapsado a iconos. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  /** Tema visual. */
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  theme: "light",
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", theme === "dark");
      }
      return { theme };
    }),
}));
