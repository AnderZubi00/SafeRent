"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, LayoutDashboard, CalendarCheck, ShoppingCart, FolderOpen,
  CreditCard, Building2, PlusCircle, Inbox, FileText, Wallet,
  CheckSquare, AlertTriangle, LogOut, Search, LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

export type Rol = "inquilino" | "propietario" | "admin";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarProps {
  role: Rol;
  userName: string;
  userEmail: string;
  solicitudesPendientes?: number;
}

const NAV_ITEMS: Record<Rol, NavItem[]> = {
  inquilino: [
    { label: "Inicio",           href: "/inquilino",              icon: LayoutDashboard },
    { label: "Buscar alojamiento", href: "/buscar",               icon: Search },
    { label: "Mis Reservas",     href: "/inquilino/reservas",    icon: CalendarCheck, badge: 1 },
    { label: "Checkout",     href: "/inquilino/checkout",     icon: ShoppingCart },
    { label: "Documentos",   href: "/inquilino/documentos",   icon: FolderOpen },
    { label: "Pagos",        href: "/inquilino/pagos",        icon: CreditCard },
  ],
  propietario: [
    { label: "Mis Viviendas",   href: "/propietario",               icon: Building2 },
    { label: "Publicar",        href: "/propietario/publicar",      icon: PlusCircle },
    { label: "Solicitudes",     href: "/propietario/solicitudes",   icon: Inbox },
    { label: "Contratos",       href: "/propietario/contratos",     icon: FileText },
    { label: "Liquidaciones",   href: "/propietario/liquidaciones", icon: Wallet },
  ],
  admin: [
    { label: "Gestión Global",  href: "/admin",                icon: LayoutDashboard },
    { label: "Verificación",    href: "/admin/verificacion",   icon: CheckSquare, badge: 5 },
    { label: "Disputas",        href: "/admin/disputas",       icon: AlertTriangle, badge: 2 },
  ],
};

const ROLE_CONFIG = {
  inquilino: {
    label: "Inquilino",
    activeBg: "bg-emerald-500/15",
    activeText: "text-emerald-400",
    activeBorder: "border-l-2 border-emerald-500",
    badgeBg: "bg-emerald-500/20 text-emerald-400",
    avatarBg: "bg-emerald-500/20 text-emerald-300",
    dotColor: "bg-emerald-400",
    roleTagBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  propietario: {
    label: "Propietario",
    activeBg: "bg-indigo-500/15",
    activeText: "text-indigo-400",
    activeBorder: "border-l-2 border-indigo-500",
    badgeBg: "bg-indigo-500/20 text-indigo-400",
    avatarBg: "bg-indigo-500/20 text-indigo-300",
    dotColor: "bg-indigo-400",
    roleTagBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  },
  admin: {
    label: "Administrador",
    activeBg: "bg-rose-500/15",
    activeText: "text-rose-400",
    activeBorder: "border-l-2 border-rose-500",
    badgeBg: "bg-rose-500/20 text-rose-400",
    avatarBg: "bg-rose-500/20 text-rose-300",
    dotColor: "bg-rose-400",
    roleTagBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  },
};

export function Sidebar({ role, userName, userEmail, solicitudesPendientes }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const config = ROLE_CONFIG[role];
  const items = NAV_ITEMS[role].map((item) => {
    if (role === "propietario" && item.href === "/propietario/solicitudes") {
      return { ...item, badge: solicitudesPendientes && solicitudesPendientes > 0 ? solicitudesPendientes : undefined };
    }
    return item;
  });

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    await cerrarSesion();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-slate-950 border-r border-slate-800/60">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-5 border-b border-slate-800/60">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
            <Home className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">
            Safe<span className="text-indigo-400">Rent</span>
          </span>
        </Link>
      </div>

      {/* Label sección */}
      <div className="px-5 pt-5 pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Menú principal
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? cn(config.activeBg, config.activeText, "shadow-sm")
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? config.activeText : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    config.badgeBg
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-800/60" />

      {/* Usuario */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800/60 p-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback
              className={cn("text-xs font-bold", config.avatarBg)}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-100">{userName}</p>
            <p className="truncate text-[10px] text-slate-500">{userEmail}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", config.roleTagBg)}>
            {config.label}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-rose-400 transition-colors"
          >
            <LogOut className="h-3 w-3" /> Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
