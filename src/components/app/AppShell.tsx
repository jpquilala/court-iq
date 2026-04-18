import * as React from "react";
import { Link, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  History,
  Home,
  LogOut,
  PlusCircle,
  Sparkles,
  User as UserIcon,
  Settings,
  Lightbulb,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/marketing/MarketingNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/games", label: "Games", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/games", label: "History", icon: History },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-court">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-court text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar md:flex md:flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5">
          <Logo />
          <span className="font-display text-lg font-bold">
            Papawis<span className="text-primary">Stats</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary glow-blue" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-sm font-bold">
            Papawis<span className="text-primary">Stats</span>
          </span>
        </Link>
        <Link to="/settings" className="text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      {/* Main content */}
      <main className="md:pl-64 pb-24 md:pb-10">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Floating "Add Game" FAB (mobile + desktop) */}
      <Link
        to="/games/new"
        className="fixed bottom-20 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-lg glow-orange animate-pulse-glow md:bottom-8 md:right-8"
      >
        <PlusCircle className="h-5 w-5" />
        Add game
      </Link>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {MOBILE_NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[10px] font-medium uppercase tracking-wider transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "text-glow-blue")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  glow = "blue",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  glow?: "blue" | "orange" | "none";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const glowText =
    glow === "blue"
      ? "text-primary text-glow-blue"
      : glow === "orange"
        ? "text-accent text-glow-orange"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className={cn("stat-num mt-2 font-display text-3xl font-bold md:text-4xl", glowText)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  body,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export { Button };
