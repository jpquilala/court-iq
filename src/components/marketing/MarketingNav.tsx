import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Activity, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/**
 * Top-bar logo + nav for public pages.
 */
export function MarketingNav() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-lg font-bold tracking-tight">
            Papawis<span className="text-primary">Stats</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">
            How it works
          </a>
          <a href="#why" className="text-sm text-muted-foreground hover:text-foreground">
            Why it matters
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="glow-blue">
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="glow-blue">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start tracking
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-neon ${className ?? ""}`}
    >
      <Activity className="h-5 w-5 text-background" strokeWidth={2.5} />
      <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-accent" />
    </div>
  );
}
