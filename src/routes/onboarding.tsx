import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/marketing/MarketingNav";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — Neighborhood Hoops" }] }),
  component: OnboardingPage,
});

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const HANDS = ["Right", "Left", "Both"] as const;

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    full_name: "",
    nickname: "",
    position: "" as string,
    dominant_hand: "" as string,
    city: "",
    bio: "",
  });

  React.useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  React.useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name,nickname,onboarded")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarded) {
          navigate({ to: "/dashboard" });
        } else if (data) {
          setForm((f) => ({
            ...f,
            full_name: data.full_name ?? "",
            nickname: data.nickname ?? "",
          }));
        }
      });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        nickname: form.nickname,
        position: form.position || null,
        dominant_hand: form.dominant_hand || null,
        city: form.city || null,
        bio: form.bio || null,
        onboarded: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved. Let's get to the run.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-court">
      <div className="absolute inset-0 bg-court-grid opacity-30" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-4 py-8">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-display font-bold">
            Papawis<span className="text-primary">Stats</span>
          </span>
        </div>

        <div className="my-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Step 01
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Build your player ID.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll personalize your dashboard and AI summaries. You can update this
            anytime.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name" id="full_name">
              <Input
                id="full_name"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="h-11 bg-background/40"
              />
            </Field>
            <Field label="Nickname" id="nickname">
              <Input
                id="nickname"
                placeholder='"Splash"'
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="h-11 bg-background/40"
              />
            </Field>
          </div>

          <Field label="Position">
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((p) => {
                const active = form.position === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setForm({ ...form, position: active ? "" : p })}
                    className={`h-10 min-w-12 rounded-lg border px-3 text-sm font-bold transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary glow-blue"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Dominant hand">
            <div className="flex gap-2">
              {HANDS.map((h) => {
                const active = form.dominant_hand === h;
                return (
                  <button
                    type="button"
                    key={h}
                    onClick={() =>
                      setForm({ ...form, dominant_hand: active ? "" : h })
                    }
                    className={`h-10 flex-1 rounded-lg border text-sm font-bold transition ${
                      active
                        ? "border-accent bg-accent/10 text-accent glow-orange"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Home city / area" id="city">
            <Input
              id="city"
              placeholder="Quezon City, NYC, Berlin..."
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="h-11 bg-background/40"
            />
          </Field>

          <Field label="Bio (optional)" id="bio">
            <textarea
              id="bio"
              rows={3}
              placeholder="One sentence about your game."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </Field>

          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full text-base glow-blue"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter the gym"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
