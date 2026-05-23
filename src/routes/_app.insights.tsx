import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { aggregate, efficiency, fmt, fmtPct } from "@/lib/stats";
import { EmptyState, PageHeader } from "@/components/app/AppShell";

export const Route = createFileRoute("/_app/insights")({
  head: () => ({ meta: [{ title: "Insights — papawisstatsph" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const { user } = useAuth();

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

  const insights = generateInsights(games);

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="What the numbers say."
        subtitle="Pattern detection across all your games — in plain language."
      />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-xl bg-card" />
      ) : insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Not enough data yet"
          body="Log at least 3 games to start unlocking trend insights."
        />
      ) : (
        <ul className="space-y-3">
          {insights.map((i, idx) => (
            <li
              key={idx}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  i.tone === "good"
                    ? "bg-primary/10 text-primary"
                    : i.tone === "warn"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent/10 text-accent"
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {i.title}
                </p>
                <p className="mt-1 text-base text-foreground/95">{i.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface Insight {
  title: string;
  body: string;
  tone: "good" | "neutral" | "warn";
}

function generateInsights(
  games: {
    points: number;
    rebounds: number;
    steals: number;
    blocks: number;
    turnovers: number;
    shots_made: number;
    shots_taken: number;
    court_name: string | null;
    location: string | null;
    game_time: string | null;
    game_type: string;
  }[],
): Insight[] {
  if (games.length < 3) return [];

  const all = aggregate(games);
  const last5 = aggregate(games.slice(-5));
  const previous5 = aggregate(games.slice(-10, -5));
  const out: Insight[] = [];

  // Recent vs lifetime
  const ptsDiff = last5.avgPoints - all.avgPoints;
  if (Math.abs(ptsDiff) >= 1.5) {
    out.push({
      title: "Recent scoring",
      body:
        ptsDiff > 0
          ? `You're averaging ${fmt(ptsDiff)} more points in your last 5 games than your lifetime average of ${fmt(all.avgPoints)}.`
          : `Recent scoring is down ${fmt(Math.abs(ptsDiff))} pts vs your lifetime average — touch may need work.`,
      tone: ptsDiff > 0 ? "good" : "warn",
    });
  }

  // FG%
  if (Math.abs(last5.fgPct - all.fgPct) >= 3) {
    out.push({
      title: "Shooting efficiency",
      body:
        last5.fgPct > all.fgPct
          ? `Your shooting is hot — ${fmtPct(last5.fgPct)} in last 5 vs ${fmtPct(all.fgPct)} lifetime.`
          : `Recent shooting (${fmtPct(last5.fgPct)}) is below your lifetime mark (${fmtPct(all.fgPct)}).`,
      tone: last5.fgPct > all.fgPct ? "good" : "warn",
    });
  }

  // Most consistent stat
  const variances = {
    PTS: variance(games.map((g) => g.points)),
    REB: variance(games.map((g) => g.rebounds)),
    STL: variance(games.map((g) => g.steals)),
    BLK: variance(games.map((g) => g.blocks)),
  };
  const mostConsistent = Object.entries(variances).sort((a, b) => a[1] - b[1])[0][0];
  out.push({
    title: "Most consistent stat",
    body: `Your most consistent stat across all games is ${mostConsistent}.`,
    tone: "neutral",
  });

  // Best court
  const byCourt = new Map<string, number[]>();
  games.forEach((g) => {
    const key = g.court_name || g.location;
    if (!key) return;
    const arr = byCourt.get(key) ?? [];
    arr.push(g.points);
    byCourt.set(key, arr);
  });
  const courtPicks = Array.from(byCourt.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([court, arr]) => ({
      court,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    }))
    .sort((a, b) => b.avg - a.avg);
  if (courtPicks.length > 0) {
    out.push({
      title: "Best court",
      body: `You score the most at ${courtPicks[0].court} — ${fmt(courtPicks[0].avg)} pts per game on average.`,
      tone: "good",
    });
  }

  // Turnover spike at a court
  const turnoversByCourt = new Map<string, number[]>();
  games.forEach((g) => {
    const key = g.court_name || g.location;
    if (!key) return;
    const arr = turnoversByCourt.get(key) ?? [];
    arr.push(g.turnovers);
    turnoversByCourt.set(key, arr);
  });
  const allTOAvg = all.avgTurnovers;
  const toSpike = Array.from(turnoversByCourt.entries())
    .filter(([, arr]) => arr.length >= 2)
    .map(([court, arr]) => ({
      court,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    }))
    .filter((c) => c.avg - allTOAvg >= 1.5)
    .sort((a, b) => b.avg - a.avg)[0];
  if (toSpike) {
    out.push({
      title: "Turnover spike",
      body: `Your turnover rate jumps at ${toSpike.court} — ${fmt(toSpike.avg)} per game vs your average ${fmt(allTOAvg)}.`,
      tone: "warn",
    });
  }

  // Trend last 5 vs previous 5
  if (previous5.games >= 3 && last5.games >= 3) {
    const effDiff = last5.efficiency - previous5.efficiency;
    if (Math.abs(effDiff) >= 2) {
      out.push({
        title: "Trending",
        body:
          effDiff > 0
            ? `Last 5 games efficiency is up ${fmt(effDiff)} compared to the 5 before. You're trending up.`
            : `Last 5 games efficiency is down ${fmt(Math.abs(effDiff))} from the 5 before. Time to reset.`,
        tone: effDiff > 0 ? "good" : "warn",
      });
    }
  }

  // Time-of-day pattern (if game_time present)
  const evening = games.filter((g) => {
    if (!g.game_time) return false;
    const hour = parseInt(g.game_time.slice(0, 2), 10);
    return hour >= 17;
  });
  const day = games.filter((g) => {
    if (!g.game_time) return false;
    const hour = parseInt(g.game_time.slice(0, 2), 10);
    return hour < 17;
  });
  if (evening.length >= 2 && day.length >= 2) {
    const e = aggregate(evening).avgPoints;
    const d = aggregate(day).avgPoints;
    if (Math.abs(e - d) >= 2) {
      out.push({
        title: "Time of day",
        body:
          e > d
            ? `You score ${fmt(e - d)} more points in evening games on average. Stack your runs after sundown.`
            : `Day games bring out your best — you score ${fmt(d - e)} more pts than at night.`,
        tone: "good",
      });
    }
  }

  // Recent best efficiency game
  const bestRecent = games.slice(-5).sort((a, b) => efficiency(b) - efficiency(a))[0];
  if (bestRecent && efficiency(bestRecent) > all.efficiency) {
    out.push({
      title: "Standout recent game",
      body: `Your best recent performance scored ${bestRecent.points} pts with +${efficiency(bestRecent)} efficiency.`,
      tone: "good",
    });
  }

  return out;
}

function variance(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  return nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
}
