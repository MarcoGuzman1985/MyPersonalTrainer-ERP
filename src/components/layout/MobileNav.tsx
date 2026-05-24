"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, X } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useUiStore } from "@/store/useUiStore";
import { cn } from "@/lib/utils";

/** Drawer de navegación para móvil; el Sidebar de escritorio se oculta < lg. */
export function MobileNav() {
  const pathname = usePathname();
  const can = useSessionStore((s) => s.can);
  const tenant = useSessionStore((s) => s.tenant);
  const open = useUiStore((s) => s.mobileNavOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNav);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
      <div className="absolute left-0 top-0 flex h-full w-72 animate-fade-in flex-col bg-surface-elevated shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800 text-white">
              <Dumbbell className="h-5 w-5" />
            </span>
            <p className="text-sm font-bold text-content">{tenant?.name ?? "MyPersonalTrainer"}</p>
          </div>
          <button onClick={() => setMobileNav(false)} className="p-1 text-content-subtle hover:text-content" aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navigation.map((group) => {
            const items = group.items.filter((i) => can(i.permission));
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-content-subtle">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileNav(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                            active ? "bg-brand-800 text-white" : "text-content-muted hover:bg-surface-muted hover:text-content",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
