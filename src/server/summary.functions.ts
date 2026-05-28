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
    description: "Generate a basketball performance summary for a non-professional player.",
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

export const generateGameSummary = createServerFn({ method: "POST" })
  .inputValidator((input: { game: InGame; pastGames: PastGame[] }) => input)
  .handler(async ({ data }) => {
    const { game, pastGames } = data;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";

    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is not configured. Add it to .env to enable real AI breakdowns.",
      );
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
      "Be specific, honest, motivating, and never robotic. Reference the actual stats and context.",
      "Avoid generic clichés. Keep language tight, useful, and clear.",
      "Always call the summarize_game tool with original analysis. Do not produce template or rule-based language.",
    ].join(" ");

    const userPrompt =
      `Game stats:\n${JSON.stringify(game, null, 2)}\n\n` +
      (lifetime
        ? `Player's lifetime averages over ${lifetime.games} games:\n${JSON.stringify(lifetime, null, 2)}`
        : "This is the player's first logged game.");

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
          "X-Title": process.env.OPENROUTER_APP_NAME || "Papawis Stats",
        },
        body: JSON.stringify({
          model,
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
      });

      if (!res.ok) {
        console.error("OpenRouter error status:", res.status);
        throw new Error(`OpenRouter returned ${res.status}.`);
      }

      const json = await res.json();
      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) {
        throw new Error("OpenRouter response did not include summarize_game tool arguments.");
      }

      const rawArguments = call.function.arguments;
      const parsed =
        typeof rawArguments === "string"
          ? (JSON.parse(rawArguments) as SummaryResult)
          : (rawArguments as SummaryResult);
      const result = normalizeSummary(parsed);

      if (!result.overview || !result.next_focus) {
        throw new Error("OpenRouter returned an incomplete breakdown.");
      }

      return result;
    } catch (error) {
      console.error("AI summary generation failed:", error);
      throw error;
    }
  });

function normalizeSummary(parsed: Partial<SummaryResult>): SummaryResult {
  return {
    overview: String(parsed.overview ?? "").trim(),
    strengths: (parsed.strengths ?? [])
      .slice(0, 3)
      .map((item) => String(item).trim())
      .filter(Boolean),
    improvements: (parsed.improvements ?? [])
      .slice(0, 3)
      .map((item) => String(item).trim())
      .filter(Boolean),
    next_focus: String(parsed.next_focus ?? "").trim(),
    tags: (parsed.tags ?? [])
      .slice(0, 3)
      .map((item) => String(item).trim())
      .filter(Boolean),
  };
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
