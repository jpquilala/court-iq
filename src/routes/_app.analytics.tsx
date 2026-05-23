import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { aggregate, efficiency, fgPct, fmt, fmtPct, gameTypeLabel } from "@/lib/stats";
import { EmptyState, PageHeader, StatCard } from "@/components/app/AppShell";

const AnalyticsTrendChart = React.lazy(() => import("@/components/app/AnalyticsTrendChart"));

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — papawisstatsph" }] }),
  component: AnalyticsPage,
});

type Metric = "points" | "rebounds" | "steals" | "blocks" | "turnovers" | "fg" | "pps";

const METRICS: { key: Metric; label: string; color: string }[] = [
  { key: "points", label: "Points", color: "var(--neon-blue)" },
  { key: "rebounds", label: "Rebounds", color: "var(--neon-blue)" },
  { key: "steals", label: "Steals", color: "var(--neon-orange)" },
  { key: "blocks", label: "Blocks", color: "var(--neon-orange)" },
  { key: "turnovers", label: "Turnovers", color: "var(--neon-orange)" },
  { key: "fg", label: "FG%", color: "var(--neon-blue)" },
  { key: "pps", label: "Pts/shot", color: "var(--neon-orange)" },
];

function AnalyticsPage() {
  const { user } = useAuth();
  const [metric, setMetric] = React.useState<Metric>("points");

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", user!.id)
        .order("game_date", { ascending: true });
      return data ?? [];
    },
  });

  const lifetime = aggregate(games);
  const last5 = aggregate([...games].slice(-5));

  const chartData = games.map((g, i) => ({
    idx: i + 1,
    label: new Date(g.game_date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    points: g.points,
    rebounds: g.rebounds,
    steals: g.steals,
    blocks: g.blocks,
    turnovers: g.turnovers,
    fg: g.shots_taken ? Math.round((g.shots_made / g.shots_taken) * 100) : 0,
    pps: g.shots_taken ? Number((g.points / g.shots_taken).toFixed(2)) : 0,
  }));

  const selectedMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  // Performance by court
  const byCourt = React.useMemo(() => {
    const map = new Map<string, typeof games>();
    games.forEach((g) => {
      const key = g.court_name || g.location || "Unknown";
      const existing = map.get(key) ?? [];
      existing.push(g);
      map.set(key, existing);
    });
    return Array.from(map.entries())
      .map(([court, gs]) => ({
        court,
        games: gs.length,
        avgPoints: aggregate(gs).avgPoints,
        fgPct: aggregate(gs).fgPct,
        efficiency: aggregate(gs).efficiency,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints);
  }, [games]);

  // Performance by game type
  const byType = React.useMemo(() => {
    const map = new Map<string, typeof games>();
    games.forEach((g) => {
      const list = map.get(g.game_type) ?? [];
      list.push(g);
      map.set(g.game_type, list);
    });
    return Array.from(map.entries())
      .map(([type, gs]) => ({
        type,
        games: gs.length,
        avgPoints: aggregate(gs).avgPoints,
        fgPct: aggregate(gs).fgPct,
      }))
      .sort((a, b) => b.avgPoints - a.avgPoints);
  }, [games]);

  // Streak detection
  const streak = React.useMemo(() => {
    if (games.length < 2) return null;
    let hot = 0;
    for (let i = games.length - 1; i >= 0; i--) {
      if (efficiency(games[i]) > lifetime.efficiency) hot++;
      else break;
    }
    let cold = 0;
    for (let i = games.length - 1; i >= 0; i--) {
      if (efficiency(games[i]) < lifetime.efficiency) cold++;
      else break;
    }
    if (hot >= 2) return { type: "hot" as const, count: hot };
    if (cold >= 2) return { type: "cold" as const, count: cold };
    return null;
  }, [games, lifetime.efficiency]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-card" />
        <div className="h-72 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Charts unlock once you log games." />
        <EmptyState
          title="No data yet"
          body="Add a few games to see trend charts, court breakdowns, and streak detection."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Trend lines, broken down."
        subtitle="See how every part of your game moves over time."
      />

      {/* Form snapshot */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Lifetime PTS" value={fmt(lifetime.avgPoints)} glow="blue" />
        <StatCard label="Lifetime FG%" value={fmtPct(lifetime.fgPct)} glow="orange" />
        <StatCard label="Last 5 PTS" value={fmt(last5.avgPoints)} glow="blue" />
        <StatCard label="Last 5 EFF" value={fmt(last5.efficiency)} glow="orange" />
      </section>

      {/* Metric selector */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Trend over time</h2>
          {streak && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                streak.type === "hot"
                  ? "bg-accent/15 text-accent"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {streak.type === "hot" ? "🔥" : "❄️"} {streak.count}-game {streak.type} streak
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`h-8 rounded-full border px-3 text-xs transition ${
                metric === m.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="h-72 w-full">
          <React.Suspense
            fallback={<div className="h-full w-full animate-pulse rounded-xl bg-background/40" />}
          >
            <AnalyticsTrendChart data={chartData} metric={metric} color={selectedMetric.color} />
          </React.Suspense>
        </div>
      </section>

      {/* Performance by court */}
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Performance by court</h2>
          {byCourt.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add courts to see splits.</p>
          ) : (
            <ul className="space-y-2">
              {byCourt.slice(0, 6).map((c) => (
                <li
                  key={c.court}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold">{c.court}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.games} games · {fmtPct(c.fgPct)} FG
                    </p>
                  </div>
                  <p className="stat-num font-display text-xl font-bold text-primary">
                    {fmt(c.avgPoints)} <span className="text-xs text-muted-foreground">pts</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Performance by game type</h2>
          <ul className="space-y-2">
            {byType.map((t) => (
              <li
                key={t.type}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2"
              >
                <div>
                  <p className="font-display font-bold">{gameTypeLabel(t.type)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.games} games · {fmtPct(t.fgPct)} FG
                  </p>
                </div>
                <p className="stat-num font-display text-xl font-bold text-accent">
                  {fmt(t.avgPoints)} <span className="text-xs text-muted-foreground">pts</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
