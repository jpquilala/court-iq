/**
 * Client wrapper that calls the AI summary server function and saves the
 * result. We do this client-side after the game insert so the edge logic
 * lives in a TanStack server function (see src/server/summary.functions.ts).
 */
import { supabase } from "@/integrations/supabase/client";
import { generateGameSummary } from "@/server/summary.functions";

interface GameRow {
  id: string;
  user_id: string;
  game_date: string;
  court_name: string | null;
  location: string | null;
  game_type: string;
  points: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  shots_made: number;
  shots_taken: number;
  minutes_played: number | null;
  notes: string | null;
}

export async function generateAndSaveSummary(game: GameRow): Promise<void> {
  try {
    // Pull lifetime averages for context
    const { data: pastGames } = await supabase
      .from("games")
      .select("points,rebounds,steals,blocks,turnovers,shots_made,shots_taken")
      .eq("user_id", game.user_id);

    const result = await generateGameSummary({
      data: { game, pastGames: pastGames ?? [] },
    });

    await supabase.from("game_summaries").upsert(
      {
        game_id: game.id,
        user_id: game.user_id,
        overview: result.overview,
        strengths: result.strengths,
        improvements: result.improvements,
        next_focus: result.next_focus,
        tags: result.tags,
      },
      { onConflict: "game_id" },
    );
  } catch (e) {
    console.error("Failed to generate AI summary:", e);
  }
}
