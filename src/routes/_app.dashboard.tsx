import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Award,
  Flame,
  PlusCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { aggregate, fmt, fmtPct, gameTypeLabel, efficiency } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, StatCard } from "@/components/app/AppShell";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Neighborhood Hoops" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", userId!)
        .order("game_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const all = aggregate(games);
  const last5 = aggregate(games.slice(0, 5));
  const bestGame = [...games].sort((a, b) => b.points - a.points)[0];
  const mostEfficient = [...games].sort(
    (a, b) => efficiency(b) - efficiency(a),
  )[0];

  const greeting = profile?.nickname || profile?.full_name?.split(" ")[0] || "Hooper";

  return (
    <div>
      <PageHeader
        eyebrow="Welcome back"
        title={`Let's run it, ${greeting}.`}
        subtitle="Your latest stats, trends, and AI insights — all in one place."
        actions={
          <Button asChild className="glow-blue">
            <Link to="/games/new">
              <PlusCircle className="h-4 w-4" /> Add game
            </Link>
          </Button>
        }
      />

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Games played" value={String(all.games)} glow="none" icon={Activity} />
        <StatCard label="Avg points" value={fmt(all.avgPoints)} glow="blue" icon={Target} />
        <StatCard label="FG%" value={fmtPct(all.fgPct)} glow="orange" />
        <StatCard label="Efficiency" value={fmt(all.efficiency, 1)} glow="orange" icon={TrendingUp} />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Avg rebounds" value={fmt(all.avgRebounds)} glow="blue" />
        <StatCard label="Avg steals" value={fmt(all.avgSteals)} glow="orange" />
        <StatCard label="Avg blocks" value={fmt(all.avgBlocks)} glow="orange" />
        <StatCard label="Avg turnovers" value={fmt(all.avgTurnovers)} glow="none" />
      </section>

      {/* Form snapshot */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Recent form</h2>
            <span className="font-mono text-xs text-muted-foreground">
              Last 5 vs lifetime
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormCompare label="PTS" recent={last5.avgPoints} lifetime={all.avgPoints} />
            <FormCompare label="REB" recent={last5.avgRebounds} lifetime={all.avgRebounds} />
            <FormCompare label="FG%" recent={last5.fgPct} lifetime={all.fgPct} suffix="%" />
          </div>
          <PointsTrend games={games.slice(0, 10).map((g) => g.points).reverse()} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-display text-lg font-bold">AI insights</h2>
          </div>
          <Insights games={games} />
        </div>
      </section>

      {/* Records */}
      {games.length > 0 && (
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {bestGame && (
            <RecordCard
              icon={Flame}
              tone="orange"
              tag="Best scoring game"
              title={`${bestGame.points} pts`}
              sub={`${bestGame.court_name || bestGame.location || "Unknown court"} · ${gameTypeLabel(bestGame.game_type)}`}
              gameId={bestGame.id}
            />
          )}
          {mostEfficient && (
            <RecordCard
              icon={Award}
              tone="blue"
              tag="Most efficient"
              title={`+${efficiency(mostEfficient)} EFF`}
              sub={`${mostEfficient.court_name || mostEfficient.location || "Unknown court"} · ${mostEfficient.points}/${mostEfficient.shots_taken} from the field`}
              gameId={mostEfficient.id}
            />
          )}
        </section>
      )}

      {/* Recent games */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent games</h2>
          <Link
            to="/games"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
        ) : games.length === 0 ? (
          <EmptyState
            icon={PlusCircle}
            title="Log your first game"
            body="Drop your stats from your last run and we'll start tracking your trends instantly."
            action={
              <Button asChild className="glow-blue">
                <Link to="/games/new">Add my first game</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {games.slice(0, 5).map((g) => (
              <li key={g.id}>
                <Link
                  to="/games/$gameId"
                  params={{ gameId: g.id }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-display font-bold">
                      {g.court_name || g.location || "Untitled court"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(g.game_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {gameTypeLabel(g.game_type)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Stat tiny label="PTS" value={String(g.points)} tone="blue" />
                    <Stat tiny label="REB" value={String(g.rebounds)} tone="blue" />
                    <Stat
                      tiny
                      label="FG%"
                      value={
                        g.shots_taken
                          ? `${Math.round((g.shots_made / g.shots_taken) * 100)}`
                          : "—"
                      }
                      tone="orange"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FormCompare({
  label,
  recent,
  lifetime,
  suffix = "",
}: {
  label: string;
  recent: number;
  lifetime: number;
  suffix?: string;
}) {
  const diff = recent - lifetime;
  const up = diff > 0.05;
  const down = diff < -0.05;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="stat-num mt-1 font-display text-2xl font-bold">
        {fmt(recent)}
        {suffix}
      </p>
      <p
        className={`mt-0.5 text-[11px] ${up ? "text-primary" : down ? "text-destructive" : "text-muted-foreground"}`}
      >
        {up ? "▲" : down ? "▼" : "•"} {fmt(Math.abs(diff))}
        {suffix} vs lifetime
      </p>
    </div>
  );
}

function PointsTrend({ games }: { games: number[] }) {
  if (games.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Add games to see your trend chart.
      </p>
    );
  }
  const max = Math.max(...games, 1);
  const w = 320;
  const h = 80;
  const stepX = games.length > 1 ? w / (games.length - 1) : w;
  const points = games
    .map((p, i) => `${i * stepX},${h - (p / max) * (h - 10) - 5}`)
    .join(" L");
  return (
    <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">
          Points · last {games.length} games
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-20 w-full">
        <defs>
          <linearGradient id="dash-line" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.18 230)" />
            <stop offset="100%" stopColor="oklch(0.74 0.19 50)" />
          </linearGradient>
        </defs>
        <path
          d={`M${points}`}
          fill="none"
          stroke="url(#dash-line)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

import type { GameStats } from "@/lib/stats";

function Insights({ games }: { games: GameStats[] }) {
  if (games.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Log a few games to unlock smart insights about your trends.
      </p>
    );
  }
  const last5 = aggregate(games.slice(0, 5));
  const all = aggregate(games);
  const items: string[] = [];

  const ptsDiff = last5.avgPoints - all.avgPoints;
  if (Math.abs(ptsDiff) >= 1.5) {
    items.push(
      ptsDiff > 0
        ? `You're averaging ${fmt(ptsDiff)} more points in your last 5 than your lifetime average.`
        : `Your scoring is down ${fmt(Math.abs(ptsDiff))} pts vs lifetime — time to get the touch back.`,
    );
  }
  if (Math.abs(last5.fgPct - all.fgPct) >= 3) {
    items.push(
      last5.fgPct > all.fgPct
        ? `Shooting efficiency is up to ${fmtPct(last5.fgPct)} recently.`
        : `Recent shooting (${fmtPct(last5.fgPct)}) is below your lifetime ${fmtPct(all.fgPct)}.`,
    );
  }
  if (last5.avgTurnovers <= 1.5 && all.games >= 5) {
    items.push("Ball security has been excellent — keep protecting the rock.");
  }
  if (items.length === 0) {
    items.push("Your stats are steady. Keep stacking runs to find your edge.");
  }

  return (
    <ul className="space-y-3">
      {items.map((t, i) => (
        <li
          key={i}
          className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm leading-snug text-foreground/90"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

function Stat({
  label,
  value,
  tone,
  tiny,
}: {
  label: string;
  value: string;
  tone: "blue" | "orange";
  tiny?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`stat-num font-display font-bold ${tiny ? "text-base" : "text-2xl"} ${
          tone === "blue" ? "text-primary" : "text-accent"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function RecordCard({
  icon: Icon,
  tone,
  tag,
  title,
  sub,
  gameId,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "orange";
  tag: string;
  title: string;
  sub: string;
  gameId: string;
}) {
  return (
    <Link
      to="/games/$gameId"
      params={{ gameId }}
      className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            tone === "orange"
              ? "bg-accent/10 text-accent"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-3 w-3" />
          {tag}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p
        className={`stat-num mt-3 font-display text-3xl font-bold ${
          tone === "orange" ? "text-accent text-glow-orange" : "text-primary text-glow-blue"
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
