"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useSessionStore } from "@/store/useSessionStore";
import { useUiStore } from "@/store/useUiStore";
import { allNavItems } from "@/lib/navigation";

export function Topbar() {
  const pathname = usePathname();
  const user = useSessionStore((s) => s.user);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  const current = allNavItems.find((i) => pathname.startsWith(i.href));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface-elevated/80 px-4 backdrop-blur lg:px-6">
      <button
        onClick={() => setMobileNav(true)}
        className="rounded-lg p-2 text-content-muted hover:bg-surface-muted lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden flex-1 items-center md:flex">
        <h2 className="text-sm font-semibold text-content">{current?.label ?? "Panel"}</h2>
      </div>

      {/* Búsqueda global -> TODO(backend): GET /api/search?q= */}
      <div className="relative ml-auto hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
        <input
          placeholder="Buscar socios, productos…"
          className="h-9 w-full rounded-lg border border-line bg-surface-muted pl-9 pr-3 text-sm text-content placeholder:text-content-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <button onClick={toggleTheme} className="rounded-lg p-2 text-content-muted hover:bg-surface-muted" aria-label="Cambiar tema">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
        <button className="relative rounded-lg p-2 text-content-muted hover:bg-surface-muted" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-surface-elevated" />
        </button>
        <div className="ml-2 flex items-center gap-2.5">
          <Avatar name={user?.name ?? "?"} src={user?.avatarUrl} size="sm" />
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-medium text-content">{user?.name}</p>
            <p className="text-xs text-content-subtle">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
