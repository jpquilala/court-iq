import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Pencil, User as UserIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { aggregate, fmt, fmtPct } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/app/AppShell";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — papawisstatsph" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: games = [] } = useQuery({
    queryKey: ["games", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", user!.id)
        .order("game_date", { ascending: false });
      return data ?? [];
    },
  });

  const lifetime = aggregate(games);
  const last5 = aggregate(games.slice(0, 5));

  // Top courts
  const topCourts = React.useMemo(() => {
    const map = new Map<string, number>();
    games.forEach((g) => {
      const k = g.court_name || g.location;
      if (!k) return;
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([court, count]) => ({ court, count }));
  }, [games]);

  return (
    <div>
      <PageHeader
        eyebrow="Player ID"
        title="Your basketball identity."
        subtitle="Your stat sheet, made shareable."
        actions={
          <Button asChild variant="outline">
            <Link to="/onboarding">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        }
      />

      {/* Identity card */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute inset-0 bg-court-grid opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-neon text-2xl font-bold text-background glow-blue">
            {(profile?.nickname || profile?.full_name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              {profile?.position ?? "Position TBD"} ·{" "}
              {profile?.dominant_hand ? `${profile.dominant_hand}-handed` : "—"}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">
              {profile?.nickname || profile?.full_name || "Set up your profile"}
            </h2>
            {profile?.full_name && profile?.nickname && (
              <p className="text-sm text-muted-foreground">{profile.full_name}</p>
            )}
            {profile?.city && (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {profile.city}
              </p>
            )}
            {profile?.bio && (
              <p className="mt-3 max-w-xl text-sm text-foreground/90">{profile.bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* Lifetime stats */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold">Lifetime stats</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Games" value={String(lifetime.games)} glow="none" />
          <StatCard label="Avg PTS" value={fmt(lifetime.avgPoints)} glow="blue" />
          <StatCard label="Avg REB" value={fmt(lifetime.avgRebounds)} glow="blue" />
          <StatCard label="FG%" value={fmtPct(lifetime.fgPct)} glow="orange" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Avg STL" value={fmt(lifetime.avgSteals)} glow="orange" />
          <StatCard label="Avg BLK" value={fmt(lifetime.avgBlocks)} glow="orange" />
          <StatCard label="Avg TO" value={fmt(lifetime.avgTurnovers)} glow="none" />
          <StatCard label="Last 5 PTS" value={fmt(last5.avgPoints)} glow="blue" />
        </div>
      </section>

      {topCourts.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Home courts</h2>
          <ul className="space-y-2">
            {topCourts.map((c) => (
              <li
                key={c.court}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">{c.court}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">{c.count} games</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!profile?.onboarded && (
        <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <div className="flex items-start gap-3">
            <UserIcon className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <p className="font-display font-bold">Finish setting up your profile</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your position, hand, and city to make your profile shareable.
              </p>
              <Button asChild className="mt-3 glow-orange">
                <Link to="/onboarding">Complete profile</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
