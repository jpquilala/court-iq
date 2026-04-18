import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/marketing/MarketingNav";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional().default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Neighborhood Hoops" },
      { name: "description", content: "Sign in or create your free account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
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
          {mode === "forgot" ? (
            <ForgotForm />
          ) : mode === "signup" ? (
            <SignUpForm />
          ) : (
            <SignInForm />
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Your stats. Your story. Your edge.
        </p>
      </div>
    </div>
  );
}

function FormShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="neon-border rounded-2xl">
      <div className="rounded-2xl bg-card p-7">
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back.");
    navigate({ to: "/dashboard" });
  }

  return (
    <FormShell title="Welcome back" subtitle="Sign in to keep your streak alive.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-background/40"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth"
              search={{ mode: "forgot" }}
              className="text-xs text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-background/40"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full text-base glow-blue"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-1 h-4 w-4" /></>}
        </Button>

        <p className="pt-2 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </FormShell>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = React.useState("");
  const [nickname, setNickname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName, nickname },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Let's set up your profile.");
    navigate({ to: "/onboarding" });
  }

  return (
    <FormShell title="Start your stat sheet" subtitle="Free. 60 seconds. No team needed.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 bg-background/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              placeholder='e.g. "Splash"'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-11 bg-background/40"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 bg-background/40"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 bg-background/40"
          />
          <p className="text-xs text-muted-foreground">At least 6 characters.</p>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full text-base glow-blue"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="ml-1 h-4 w-4" /></>}
        </Button>

        <p className="pt-2 text-center text-sm text-muted-foreground">
          Already on the team?{" "}
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </FormShell>
  );
}

function ForgotForm() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Check your email for a reset link.");
  }

  return (
    <FormShell
      title="Reset password"
      subtitle="We'll send a reset link to your email."
    >
      {sent ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground/90">
          Reset link sent. Check your email.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-background/40"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-11 w-full glow-blue">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/auth" search={{ mode: "signin" }} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </FormShell>
  );
}
