
# Neighborhood Hoops — Plan

A premium, mobile-first basketball stats tracker for open-run players. Dark urban court aesthetic with neon blue/orange accents, circuit-line motifs, and a SaaS-grade analytics feel.

## Design system
- **Palette**: deep charcoal background (#0A0E14-ish), concrete gray surfaces, electric neon blue (#00B8FF) and glowing orange (#FF6A00) accents, soft white text. Dark mode by default.
- **Type**: bold sporty sans-serif headings (Space Grotesk / Inter Tight), tabular numerics for stats.
- **Motifs**: circuit-line dividers, glowing edges on cards, subtle court-line backgrounds, glassy translucent panels, progress rings, neon trend arrows.
- **Components**: stat cards with glow accents, gradient-bordered chart cards, floating "Add Game" FAB, segmented filters, performance badges.

## Pages & routes
1. **`/`** — Landing page: hero with neon court mockup, problem/solution, feature grid, dashboard preview, testimonial-style "why it matters", CTA.
2. **`/auth`** — Sign up / login / forgot password (email + password, optional Google).
3. **`/onboarding`** — First-time profile setup (name, nickname, position, hand, optional photo/height/weight/city).
4. **`/dashboard`** — Welcome header, KPI cards (games, avg pts/reb/stl/blk/to, FG%, last-5 avg, best game), recent games list, trend mini-charts, AI insights panel, quick-add FAB.
5. **`/games/new`** — Mobile-optimized game entry form with smart defaults (recent court autocomplete), auto-calculated FG%/PPS/efficiency, instant summary on submit.
6. **`/games`** — Game history: filter by date/court/type, sort by points/efficiency, edit/delete actions.
7. **`/games/$gameId`** — Full game detail: stat highlights, AI-generated summary (overview, strengths, areas to improve, focus for next game), comparison vs lifetime average, auto-tags ("Best Scoring Game", "Defensive Impact", etc.).
8. **`/analytics`** — Trend charts (points/rebounds/steals/blocks/turnovers/FG%/PPS over time), performance by court/location/game type, recent form vs lifetime, consistency score, hot/cold streak detection.
9. **`/insights`** — Plain-language insights ("You're averaging 4.2 more points in your last 5 games...", "Turnover rate spikes at Court X").
10. **`/profile`** — Public-shareable profile: photo, bio, position, lifetime averages, recent form, preferred courts.
11. **`/settings`** — Account, units (cm/in, kg/lb), preferences, export to CSV.

## App shell
- Desktop: left sidebar nav + top header (profile, notifications).
- Mobile: bottom tab nav (Dashboard / Add / History / Analytics / Profile) + sticky FAB for Add Game.

## Backend (Lovable Cloud)
- **Auth**: email/password + Google. Onboarding flow on first sign-in.
- **Tables**: `profiles` (linked to auth.users), `games`, `game_summaries`, `favorite_courts`. RLS so users only see their own data.
- **Auto-calculated stats**: FG%, points-per-shot, simple efficiency rating computed on save.
- **AI summaries**: Lovable AI Gateway generates per-game summary, strengths, improvements, and next-game focus from raw stats. Stored alongside the game.
- **Insights engine**: server-computed trend insights (last-5 vs lifetime, court-level performance, streak detection) surfaced on dashboard and insights page.

## Charts
Recharts with custom dark theme, neon line strokes, subtle gridlines, gradient fills.

## Out of scope for v1
Multiplayer/team features, live scoring, video, social feed. Focus is the personal stat-tracking experience.
