import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, LogOut } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/AppShell";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — papawisstatsph" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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

  function exportCSV() {
    if (games.length === 0) {
      toast.error("No games to export yet.");
      return;
    }
    const headers = [
      "date",
      "time",
      "court",
      "location",
      "type",
      "opponent",
      "minutes",
      "points",
      "rebounds",
      "steals",
      "blocks",
      "turnovers",
      "shots_made",
      "shots_taken",
      "fg_pct",
      "notes",
    ];
    const rows = games.map((g) => [
      g.game_date,
      g.game_time ?? "",
      g.court_name ?? "",
      g.location ?? "",
      g.game_type,
      g.opponent_name ?? "",
      g.minutes_played ?? "",
      g.points,
      g.rebounds,
      g.steals,
      g.blocks,
      g.turnovers,
      g.shots_made,
      g.shots_taken,
      g.shots_taken ? ((g.shots_made / g.shots_taken) * 100).toFixed(1) : "",
      (g.notes ?? "").replace(/[\n,]/g, " "),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neighborhood-hoops-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Account & data."
        subtitle="Manage your account and export your stats."
      />

      <div className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{user?.email}</span>
          </p>
          <Button variant="outline" onClick={onSignOut} className="mt-4">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">Export your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download all your games as CSV. Your data, always portable.
          </p>
          <Button onClick={exportCSV} className="mt-4 glow-blue">
            <Download className="h-4 w-4" /> Export {games.length} games
          </Button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold">About</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            papawisstatsph · Built for the run. v1.0
          </p>
        </section>
      </div>
    </div>
  );
}
