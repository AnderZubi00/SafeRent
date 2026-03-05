"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function TopBar({ title, subtitle, showSearch = false }: TopBarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm px-6 gap-4">
      <div className="min-w-0">
        <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-400 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Buscar..."
              className="pl-8 h-8 w-52 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        )}

        <p className="hidden lg:block text-xs text-slate-400 font-medium">
          {dateCapitalized}
        </p>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-slate-500 hover:text-slate-900"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
        </Button>
      </div>
    </header>
  );
}
