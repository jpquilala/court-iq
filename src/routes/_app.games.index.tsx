import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Filter, PlusCircle, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { GAME_TYPES, gameTypeLabel, fmtPct, efficiency } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/app/AppShell";

export const Route = createFileRoute("/_app/games/")({
  head: () => ({ meta: [{ title: "Game history — papawisstatsph" }] }),
  component: GameHistoryPage,
});

type SortKey = "date" | "points" | "efficiency";

function GameHistoryPage() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("date");

  const { data: games = [], isLoading } = useQuery({
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

  const filtered = React.useMemo(() => {
    let list = games;
    if (type !== "all") list = list.filter((g) => g.game_type === type);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.court_name?.toLowerCase().includes(q) ||
          g.location?.toLowerCase().includes(q) ||
          g.opponent_name?.toLowerCase().includes(q),
      );
    }
    if (sort === "points") {
      list = [...list].sort((a, b) => b.points - a.points);
    } else if (sort === "efficiency") {
      list = [...list].sort((a, b) => efficiency(b) - efficiency(a));
    }
    return list;
  }, [games, type, search, sort]);

  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Every run, recorded."
        subtitle="Filter, sort, and dive into any past game."
        actions={
          <Button asChild className="glow-blue">
            <Link to="/games/new">
              <PlusCircle className="h-4 w-4" /> Add game
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by court, opponent, location"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          <button onClick={() => setType("all")} className={chip(type === "all")}>
            All
          </button>
          {GAME_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={chip(type === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Sort by:</span>
        {(
          [
            ["date", "Most recent"],
            ["points", "Best scoring"],
            ["efficiency", "Most efficient"],
          ] as [SortKey, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`rounded-full border px-3 py-1 transition ${
              sort === k
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PlusCircle}
          title={games.length === 0 ? "No games yet" : "No games match"}
          body={
            games.length === 0
              ? "Add your first game and we'll start building your history."
              : "Try a different filter or clear your search."
          }
          action={
            games.length === 0 ? (
              <Button asChild className="glow-blue">
                <Link to="/games/new">Add game</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setType("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((g) => {
            const fg = g.shots_taken ? (g.shots_made / g.shots_taken) * 100 : null;
            return (
              <li key={g.id}>
                <Link
                  to="/games/$gameId"
                  params={{ gameId: g.id }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold truncate">
                      {g.court_name || g.location || "Untitled court"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(g.game_date).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {gameTypeLabel(g.game_type)}
                      {g.opponent_name ? ` · vs ${g.opponent_name}` : ""}
                    </p>
                  </div>
                  <div className="hidden md:flex md:items-center md:gap-5">
                    <Mini label="PTS" value={g.points} tone="blue" />
                    <Mini label="REB" value={g.rebounds} tone="blue" />
                    <Mini label="STL" value={g.steals} tone="orange" />
                    <Mini label="BLK" value={g.blocks} tone="orange" />
                    <Mini label="FG%" value={fg !== null ? Math.round(fg) : "—"} tone="orange" />
                  </div>
                  <div className="flex flex-col items-end gap-1 md:hidden">
                    <p className="stat-num font-display text-2xl font-bold text-primary">
                      {g.points}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      pts · {fg !== null ? fmtPct(fg) : "—"}
                    </p>
                  </div>
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function chip(active: boolean) {
  return `shrink-0 rounded-full border px-3 py-1 text-xs transition ${
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-card text-muted-foreground hover:text-foreground"
  }`;
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "blue" | "orange";
}) {
  return (
    <div className="text-center">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`stat-num font-display text-base font-bold ${
          tone === "blue" ? "text-primary" : "text-accent"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
