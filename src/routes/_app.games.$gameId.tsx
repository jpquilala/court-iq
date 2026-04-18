import * as React from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  aggregate,
  efficiency,
  fgPct,
  fmt,
  fmtPct,
  gameTypeLabel,
  pointsPerShot,
} from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { generateAndSaveSummary } from "@/lib/summary";

export const Route = createFileRoute("/_app/games/$gameId")({
  head: () => ({ meta: [{ title: "Game detail — Papawis Stats" }] }),
  component: GameDetailPage,
});

function GameDetailPage() {
  const { gameId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: game, isLoading } = useQuery({
    queryKey: ["game", gameId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ["game-summary", gameId],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("game_summaries")
        .select("*")
        .eq("game_id", gameId)
        .maybeSingle();
      return data;
    },
    refetchInterval: (q) => (q.state.data ? false : 3000),
  });

  const { data: allGames = [] } = useQuery({
    queryKey: ["games", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const lifetime = aggregate(allGames);

  if (isLoading || !game) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const fg = fgPct(game);
  const pps = pointsPerShot(game);
  const eff = efficiency(game);

  async function onDelete() {
    if (!confirm("Delete this game? This can't be undone.")) return;
    await supabase.from("games").delete().eq("id", gameId);
    qc.invalidateQueries({ queryKey: ["games"] });
    toast.success("Game deleted.");
    navigate({ to: "/games" });
  }

  async function onRegenerate() {
    if (!game) return;
    toast.info("Re-generating breakdown…");
    await generateAndSaveSummary(game);
    refetchSummary();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={() => navigate({ to: "/games" })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All games
      </button>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            {gameTypeLabel(game.game_type)}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {game.court_name || game.location || "Untitled court"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(game.game_date).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {game.game_time ? ` · ${game.game_time.slice(0, 5)}` : ""}
            {game.opponent_name ? ` · vs ${game.opponent_name}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={onDelete}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>

      {/* Tags */}
      {summary?.tags && summary.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {summary.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent"
            >
              <Trophy className="h-3 w-3" /> {t}
            </span>
          ))}
        </div>
      )}

      {/* Stat highlights */}
      <section className="grid grid-cols-3 gap-3 md:grid-cols-6">
        <Big label="PTS" value={String(game.points)} tone="blue" />
        <Big label="REB" value={String(game.rebounds)} tone="blue" />
        <Big label="STL" value={String(game.steals)} tone="orange" />
        <Big label="BLK" value={String(game.blocks)} tone="orange" />
        <Big label="TO" value={String(game.turnovers)} tone="orange" />
        <Big
          label="FG"
          value={`${game.shots_made}/${game.shots_taken}`}
          tone="blue"
        />
      </section>

      <section className="mt-3 grid grid-cols-3 gap-3">
        <Big label="FG%" value={fmtPct(fg)} tone="blue" />
        <Big label="PPS" value={fmt(pps, 2)} tone="orange" />
        <Big
          label="Efficiency"
          value={(eff >= 0 ? "+" : "") + eff}
          tone={eff >= 0 ? "blue" : "orange"}
        />
      </section>

      {/* AI summary */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-display text-lg font-bold">AI breakdown</h2>
          </div>
          {summary && (
            <button
              onClick={onRegenerate}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Regenerate
            </button>
          )}
        </div>

        {!summary ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Generating your breakdown…
          </div>
        ) : (
          <div className="space-y-5">
            {summary.overview && (
              <p className="text-base leading-relaxed text-foreground/95">
                {summary.overview}
              </p>
            )}

            {summary.strengths && summary.strengths.length > 0 && (
              <Block title="Strengths" tone="blue" items={summary.strengths} />
            )}

            {summary.improvements && summary.improvements.length > 0 && (
              <Block
                title="Areas for improvement"
                tone="orange"
                items={summary.improvements}
              />
            )}

            {summary.next_focus && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                  Suggested focus next game
                </p>
                <p className="mt-2 text-sm text-foreground/95">
                  {summary.next_focus}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Comparison vs lifetime */}
      {lifetime.games > 1 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold">vs your lifetime average</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Compare label="PTS" g={game.points} avg={lifetime.avgPoints} />
            <Compare label="REB" g={game.rebounds} avg={lifetime.avgRebounds} />
            <Compare label="STL" g={game.steals} avg={lifetime.avgSteals} />
            <Compare label="BLK" g={game.blocks} avg={lifetime.avgBlocks} />
          </div>
        </section>
      )}

      {game.notes && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 font-display text-lg font-bold">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {game.notes}
          </p>
        </section>
      )}

      <div className="mt-8 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/games">Back to history</Link>
        </Button>
        <Button asChild className="flex-1 glow-blue">
          <Link to="/games/new">Log next game</Link>
        </Button>
      </div>
    </div>
  );
}

function Big({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "orange";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center md:p-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`stat-num mt-1 font-display text-2xl font-bold md:text-3xl ${
          tone === "blue" ? "text-primary text-glow-blue" : "text-accent text-glow-orange"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Block({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "blue" | "orange";
  items: string[];
}) {
  const dotClass = tone === "blue" ? "bg-primary" : "bg-accent";
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground/95">
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
            />
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Compare({
  label,
  g,
  avg,
}: {
  label: string;
  g: number;
  avg: number;
}) {
  const diff = g - avg;
  const up = diff > 0.05;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="stat-num mt-1 font-display text-2xl font-bold">{g}</p>
      <p
        className={`mt-0.5 text-[11px] ${up ? "text-primary" : diff < -0.05 ? "text-destructive" : "text-muted-foreground"}`}
      >
        {up ? "▲" : diff < -0.05 ? "▼" : "•"} {fmt(Math.abs(diff))} vs avg{" "}
        {fmt(avg)}
      </p>
    </div>
  );
}
