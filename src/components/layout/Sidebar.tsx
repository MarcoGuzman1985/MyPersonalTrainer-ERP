"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, PanelLeftClose, PanelLeft } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { useSessionStore } from "@/store/useSessionStore";
import { useUiStore } from "@/store/useUiStore";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const can = useSessionStore((s) => s.can);
  const tenant = useSessionStore((s) => s.tenant);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-line bg-surface-elevated transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Marca del tenant (marca blanca configurable en bloque 14). */}
      <div className="flex h-16 items-center gap-3 border-b border-line px-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-800 text-white">
          <Dumbbell className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-content">{tenant?.name ?? "MyPersonalTrainer"}</p>
            <p className="truncate text-xs capitalize text-content-subtle">Plan {tenant?.plan}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navigation.map((group) => {
          const items = group.items.filter((i) => can(i.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-content-subtle">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-800 text-white"
                            : "text-content-muted hover:bg-surface-muted hover:text-content",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex h-12 items-center gap-3 border-t border-line px-4 text-sm text-content-muted hover:text-content"
      >
        {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        {!collapsed && <span>Colapsar</span>}
      </button>
    </aside>
  );
}
