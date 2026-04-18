import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GAME_TYPES, fmt, fmtPct } from "@/lib/stats";
import { generateAndSaveSummary } from "@/lib/summary";

export const Route = createFileRoute("/_app/games/new")({
  head: () => ({ meta: [{ title: "Add game — Neighborhood Hoops" }] }),
  component: NewGamePage,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function NewGamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);

  // Pull recent court names for autocomplete
  const { data: recentCourts = [] } = useQuery({
    queryKey: ["recent-courts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("games")
        .select("court_name,location")
        .eq("user_id", user!.id)
        .order("game_date", { ascending: false })
        .limit(20);
      const names = new Set<string>();
      data?.forEach((g) => g.court_name && names.add(g.court_name));
      return Array.from(names);
    },
  });

  const [form, setForm] = React.useState({
    game_date: todayISO(),
    game_time: "",
    location: "",
    court_name: "",
    opponent_name: "",
    game_type: "pickup",
    minutes_played: "",
    points: 0,
    rebounds: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    shots_made: 0,
    shots_taken: 0,
    notes: "",
  });

  const fg = form.shots_taken
    ? (form.shots_made / form.shots_taken) * 100
    : 0;
  const pps = form.shots_taken ? form.points / form.shots_taken : 0;
  const eff =
    form.points +
    form.rebounds +
    form.steals +
    form.blocks -
    form.turnovers -
    Math.max(0, form.shots_taken - form.shots_made);

  function setNum(key: keyof typeof form) {
    return (val: number) =>
      setForm((f) => ({ ...f, [key]: Math.max(0, val) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (form.shots_made > form.shots_taken) {
      toast.error("Shots made can't exceed shots taken.");
      return;
    }
    setBusy(true);

    const insertRow = {
      user_id: user.id,
      game_date: form.game_date,
      game_time: form.game_time || null,
      location: form.location || null,
      court_name: form.court_name || null,
      opponent_name: form.opponent_name || null,
      game_type: form.game_type,
      minutes_played: form.minutes_played ? Number(form.minutes_played) : null,
      points: form.points,
      rebounds: form.rebounds,
      steals: form.steals,
      blocks: form.blocks,
      turnovers: form.turnovers,
      shots_made: form.shots_made,
      shots_taken: form.shots_taken,
      notes: form.notes || null,
    };

    const { data, error } = await supabase
      .from("games")
      .insert(insertRow)
      .select("*")
      .single();

    if (error || !data) {
      setBusy(false);
      toast.error(error?.message || "Couldn't save the game.");
      return;
    }

    // Fire-and-forget AI summary; don't block navigation
    void generateAndSaveSummary(data);

    qc.invalidateQueries({ queryKey: ["games"] });
    qc.invalidateQueries({ queryKey: ["recent-courts"] });
    toast.success("Game saved. Generating breakdown…");
    navigate({ to: "/games/$gameId", params: { gameId: data.id } });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Add game
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Drop your stats.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll compute your efficiency and generate an AI breakdown automatically.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-border bg-card p-5 md:p-6"
      >
        {/* When + Where */}
        <section>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            When & where
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" id="game_date">
              <Input
                id="game_date"
                type="date"
                required
                value={form.game_date}
                onChange={(e) => setForm({ ...form, game_date: e.target.value })}
                className="h-11 bg-background/40"
              />
            </Field>
            <Field label="Time (optional)" id="game_time">
              <Input
                id="game_time"
                type="time"
                value={form.game_time}
                onChange={(e) => setForm({ ...form, game_time: e.target.value })}
                className="h-11 bg-background/40"
              />
            </Field>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Court" id="court_name">
              <Input
                id="court_name"
                list="recent-courts"
                placeholder="e.g. Cubao Court 4"
                value={form.court_name}
                onChange={(e) => setForm({ ...form, court_name: e.target.value })}
                className="h-11 bg-background/40"
              />
              <datalist id="recent-courts">
                {recentCourts.map((c) => (
                  <option value={c} key={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Location / city" id="location">
              <Input
                id="location"
                placeholder="QC, NYC..."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="h-11 bg-background/40"
              />
            </Field>
          </div>

          <div className="mt-3">
            <Label className="mb-2 block">Game type</Label>
            <div className="flex flex-wrap gap-2">
              {GAME_TYPES.map((t) => {
                const active = form.game_type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, game_type: t.value })}
                    className={`h-9 rounded-md border px-3 text-sm transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Box score */}
        <section>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Box score
          </h2>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-3">
            <Stepper
              label="PTS"
              tone="blue"
              value={form.points}
              onChange={setNum("points")}
            />
            <Stepper
              label="REB"
              tone="blue"
              value={form.rebounds}
              onChange={setNum("rebounds")}
            />
            <Stepper
              label="TO"
              tone="orange"
              value={form.turnovers}
              onChange={setNum("turnovers")}
            />
            <Stepper
              label="STL"
              tone="orange"
              value={form.steals}
              onChange={setNum("steals")}
            />
            <Stepper
              label="BLK"
              tone="orange"
              value={form.blocks}
              onChange={setNum("blocks")}
            />
            <Stepper
              label="MIN"
              tone="blue"
              value={Number(form.minutes_played) || 0}
              onChange={(v) =>
                setForm({ ...form, minutes_played: String(Math.max(0, v)) })
              }
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stepper
              label="Shots made"
              tone="blue"
              value={form.shots_made}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  shots_made: Math.max(0, Math.min(v, f.shots_taken)),
                }))
              }
            />
            <Stepper
              label="Shots taken"
              tone="orange"
              value={form.shots_taken}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  shots_taken: Math.max(0, v),
                  shots_made: Math.min(f.shots_made, Math.max(0, v)),
                }))
              }
            />
          </div>
        </section>

        {/* Live calculations */}
        <section className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-background/40 p-3">
          <Calc label="FG%" value={fmtPct(fg)} tone="blue" />
          <Calc label="PPS" value={fmt(pps, 2)} tone="orange" />
          <Calc
            label="EFF"
            value={(eff >= 0 ? "+" : "") + eff}
            tone={eff >= 0 ? "blue" : "orange"}
          />
        </section>

        {/* Optional details */}
        <section>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Optional
          </h2>
          <Field label="Opponent / team (optional)" id="opponent_name">
            <Input
              id="opponent_name"
              value={form.opponent_name}
              onChange={(e) => setForm({ ...form, opponent_name: e.target.value })}
              className="h-11 bg-background/40"
            />
          </Field>
          <div className="mt-3">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Anything to remember about this run."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-2 w-full rounded-md border border-input bg-background/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </section>

        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full text-base glow-orange"
          variant="default"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" /> Save & generate breakdown
            </>
          )}
        </Button>
      </form>
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

function Stepper({
  label,
  value,
  onChange,
  tone,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  tone: "blue" | "orange";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          className="h-8 w-8 rounded-md border border-border bg-background text-lg font-bold text-foreground hover:bg-muted active:scale-95"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className={`stat-num w-full bg-transparent text-center font-display text-2xl font-bold focus:outline-none ${
            tone === "blue" ? "text-primary" : "text-accent"
          }`}
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-md border border-border bg-background text-lg font-bold text-foreground hover:bg-muted active:scale-95"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Calc({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "orange";
}) {
  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`stat-num font-display text-xl font-bold ${
          tone === "blue" ? "text-primary" : "text-accent"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
