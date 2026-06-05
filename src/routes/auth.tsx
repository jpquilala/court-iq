import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/lib/auth";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/MarketingNav";
import { Toaster } from "@/components/ui/sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional().default("signin"),
});

type OAuthProvider = "google" | "facebook";

const providers: Array<{
  id: OAuthProvider;
  label: string;
  eyebrow: string;
  brandClass: string;
}> = [
  {
    id: "google",
    label: "Sign in with Google",
    eyebrow: "G",
    brandClass: "bg-white text-[#1f1f1f]",
  },
  {
    id: "facebook",
    label: "Sign in with Facebook",
    eyebrow: "f",
    brandClass: "bg-[#1877f2] text-white",
  },
];

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — papawisstatsph" },
      {
        name: "description",
        content: "Sign in to papawisstatsph with Google or Facebook.",
      },
    ],
  }),
  component: AuthRoute,
});

function AuthRoute() {
  return (
    <AuthProvider>
      <AuthPage />
      <Toaster richColors theme="dark" position="top-center" />
    </AuthProvider>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-court">
      <div className="absolute inset-0 bg-court-grid opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
        <Link to="/" className="flex items-center gap-2 self-start">
          <Logo />
          <span className="font-display text-lg font-bold">
            Papawis<span className="text-primary">Stats</span>
          </span>
        </Link>

        <div className="my-auto">
          <OAuthCard />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Your stats. Your story. Your edge.
        </p>
      </div>
    </div>
  );
}

function OAuthCard() {
  const [busyProvider, setBusyProvider] = React.useState<OAuthProvider | null>(null);

  async function signInWithProvider(provider: OAuthProvider) {
    setBusyProvider(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setBusyProvider(null);
      toast.error(error.message);
    }
  }

  return (
    <div className="neon-border rounded-2xl">
      <div className="rounded-2xl bg-card p-7">
        <p className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Stat sheet access
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Welcome to PapawisStats</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your social account to create or access your player dashboard. No password to
          remember.
        </p>

        <div className="mt-7 space-y-3">
          {providers.map((provider) => {
            const isBusy = busyProvider === provider.id;
            const isDisabled = busyProvider !== null;

            return (
              <Button
                key={provider.id}
                type="button"
                variant="outline"
                disabled={isDisabled}
                onClick={() => void signInWithProvider(provider.id)}
                className="h-12 w-full justify-start border-border/80 bg-background/50 px-4 text-base text-foreground hover:bg-background/80 hover:text-foreground"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${provider.brandClass}`}
                  aria-hidden
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : provider.eyebrow}
                </span>
                <span>{provider.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-border/70 bg-background/30 p-4 text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to use papawisstatsph responsibly and let the app store your
          basketball profile, games, and stats securely.
        </div>
      </div>
    </div>
  );
}
