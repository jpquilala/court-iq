import { createServerFn } from "@tanstack/react-start";

interface InGame {
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

interface PastGame {
  points: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  shots_made: number;
  shots_taken: number;
}

export interface SummaryResult {
  overview: string;
  strengths: string[];
  improvements: string[];
  next_focus: string;
  tags: string[];
}

const SUMMARY_TOOL = {
  type: "function",
  function: {
    name: "summarize_game",
    description:
      "Generate a basketball performance summary for a non-professional player.",
    parameters: {
      type: "object",
      properties: {
        overview: {
          type: "string",
          description:
            "2-3 sentence overall assessment of the game in a confident, coach-like tone. No clichés.",
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "1-3 specific strengths grounded in the stats.",
        },
        improvements: {
          type: "array",
          items: { type: "string" },
          description: "1-3 specific areas to improve, grounded in the stats.",
        },
        next_focus: {
          type: "string",
          description: "One concrete focus area for next game.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            'Up to 3 short tags like "Best Scoring Game", "Defensive Impact", "Efficient Night", "Ball-Security Issue", "Hustle Game".',
        },
      },
      required: ["overview", "strengths", "improvements", "next_focus", "tags"],
      additionalProperties: false,
    },
  },
};

function ruleBasedFallback(g: InGame): SummaryResult {
  const fg = g.shots_taken ? (g.shots_made / g.shots_taken) * 100 : 0;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const tags: string[] = [];

  if (g.points >= 20) {
    strengths.push("Scored at a high volume.");
    tags.push("Scoring Night");
  }
  if (fg >= 50 && g.shots_taken >= 5) {
    strengths.push(`Efficient from the field at ${fg.toFixed(0)}%.`);
    tags.push("Efficient Night");
  }
  if (g.steals + g.blocks >= 4) {
    strengths.push("Disruptive on defense with steals and blocks.");
    tags.push("Defensive Impact");
  }
  if (g.rebounds >= 8) strengths.push("Crashed the glass and won possessions.");
  if (g.turnovers <= 1) strengths.push("Took care of the ball.");
  if (g.turnovers >= 4) {
    improvements.push("Cut down turnovers — protect the rock.");
    tags.push("Ball-Security Issue");
  }
  if (fg < 35 && g.shots_taken >= 8) {
    improvements.push("Look for higher-percentage shots next time.");
  }
  if (g.points < 8 && g.shots_taken >= 8) {
    improvements.push("Shot volume was high but efficiency was low.");
  }
  if (strengths.length === 0) strengths.push("Showed up and put in the work.");
  if (improvements.length === 0)
    improvements.push("Stay aggressive while keeping your shot selection clean.");

  return {
    overview: `${g.points} pts, ${g.rebounds} reb, ${g.steals} stl, ${g.blocks} blk on ${g.shots_made}/${g.shots_taken} shooting. Solid contribution at the ${g.court_name || g.location || "court"}.`,
    strengths,
    improvements,
    next_focus: improvements[0] ?? "Keep stacking consistent runs.",
    tags: tags.slice(0, 3),
  };
}

export const generateGameSummary = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { game: InGame; pastGames: PastGame[] }) => input,
  )
  .handler(async ({ data }) => {
    const { game, pastGames } = data;
    const apiKey = process.env.LOVABLE_API_KEY;

    if (!apiKey) {
      console.warn("LOVABLE_API_KEY missing — using rule-based summary.");
      return ruleBasedFallback(game);
    }

    const lifetime = pastGames.length
      ? {
          games: pastGames.length,
          avg_points: avg(pastGames.map((g) => g.points)),
          avg_rebounds: avg(pastGames.map((g) => g.rebounds)),
          avg_steals: avg(pastGames.map((g) => g.steals)),
          avg_blocks: avg(pastGames.map((g) => g.blocks)),
          avg_turnovers: avg(pastGames.map((g) => g.turnovers)),
          fg_pct:
            pastGames.reduce((s, g) => s + g.shots_taken, 0) > 0
              ? (pastGames.reduce((s, g) => s + g.shots_made, 0) /
                  pastGames.reduce((s, g) => s + g.shots_taken, 0)) *
                100
              : 0,
        }
      : null;

    const systemPrompt = [
      "You are an experienced basketball performance analyst speaking to a non-professional pickup-league player.",
      "Be specific, honest, motivating but never robotic. Reference the actual stats.",
      "Avoid generic clichés. Keep language tight and clear.",
      "Always call the summarize_game tool.",
    ].join(" ");

    const userPrompt =
      `Game stats:\n${JSON.stringify(game, null, 2)}\n\n` +
      (lifetime
        ? `Player's lifetime averages over ${lifetime.games} games:\n${JSON.stringify(lifetime, null, 2)}`
        : "This is the player's first logged game.");

    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            tools: [SUMMARY_TOOL],
            tool_choice: {
              type: "function",
              function: { name: "summarize_game" },
            },
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("AI gateway error:", res.status, text);
        return ruleBasedFallback(game);
      }

      const json = await res.json();
      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) {
        return ruleBasedFallback(game);
      }
      const parsed = JSON.parse(call.function.arguments) as SummaryResult;
      return {
        overview: String(parsed.overview ?? "").trim(),
        strengths: (parsed.strengths ?? []).slice(0, 3).map(String),
        improvements: (parsed.improvements ?? []).slice(0, 3).map(String),
        next_focus: String(parsed.next_focus ?? "").trim(),
        tags: (parsed.tags ?? []).slice(0, 3).map(String),
      };
    } catch (e) {
      console.error("AI summary failed:", e);
      return ruleBasedFallback(game);
    }
  });

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
