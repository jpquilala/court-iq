import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronRight,
  Dumbbell,
  Flame,
  LineChart,
  MapPin,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo, MarketingNav } from "@/components/marketing/MarketingNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Papawis Stats — Bawat laro, may resibo." },
      {
        name: "description",
        content:
          "Track your pickup games, barangay runs, and weekend leagues. Log every stat, see your progress, and get AI-powered breakdowns after every performance.",
      },
      { property: "og:title", content: "Papawis Stats — Bawat laro, may resibo" },
      {
        property: "og:description",
        content:
          "Track your pickup games, barangay runs, and weekend leagues. Log every stat, see your progress, and get AI-powered breakdowns after every performance.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-court text-foreground">
      <MarketingNav />
      <Hero />
      <SocialStrip />
      <FeatureGrid />
      <DashboardPreview />
      <WhyItMatters />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Court grid background */}
      <div className="absolute inset-0 bg-court-grid opacity-40" aria-hidden />
      {/* Glowing orbs */}
      <div
        className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pt-16 pb-24 md:px-8 md:pt-24 md:pb-32 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative rounded-full bg-accent h-2 w-2" />
            </span>
            Built for open-run hoopers
          </div>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Bawat laro, <span className="text-primary text-glow-blue">may</span>{" "}
            <span className="text-accent text-glow-orange">resibo.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
            Track your pickup games, barangay runs, and weekend leagues. Log every stat, see your
            progress, and get AI-powered breakdowns after every performance.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base glow-blue">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start tracking free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <a href="#features">See how it works</a>
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Mobile-first entry</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" />
              <span>AI breakdowns</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Free to start</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroStatCard />
        </div>
      </div>
    </section>
  );
}

function HeroStatCard() {
  const stats = [
    { label: "PTS", value: "27", glow: "blue" as const },
    { label: "REB", value: "9", glow: "blue" as const },
    { label: "AST", value: "—", glow: "blue" as const, muted: true },
    { label: "STL", value: "4", glow: "orange" as const },
    { label: "BLK", value: "2", glow: "orange" as const },
    { label: "TO", value: "1", glow: "orange" as const },
  ];
  return (
    <div className="relative">
      {/* Floating tag */}
      <div className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground glow-orange animate-pulse-glow">
        <Flame className="h-3 w-3" />
        Best scoring game
      </div>

      <div className="neon-border overflow-hidden rounded-2xl">
        <div className="relative bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Sun · 8:30 PM · YMCA Court
              </p>
              <p className="mt-1 font-display text-xl font-bold">Open Run</p>
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-primary">
              W · +12
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-background/40 p-3 text-center"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p
                  className={`stat-num mt-1 font-display text-3xl font-bold ${
                    s.muted
                      ? "text-muted-foreground/50"
                      : s.glow === "blue"
                        ? "text-primary text-glow-blue"
                        : "text-accent text-glow-orange"
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">FG%</p>
              <p className="stat-num font-display font-bold text-foreground">57.1%</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-neon" style={{ width: "57%" }} />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground/90 leading-snug">
              <span className="font-semibold text-primary">Efficient night.</span> Strong shot
              selection and high defensive impact — your best 3-game stretch yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialStrip() {
  const items = ["Open Runs", "Pickup", "Barangay Ball", "Rec League", "Tournaments", "Scrimmages"];
  return (
    <div className="border-y border-border/60 bg-background/40">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-4 no-scrollbar md:justify-center md:gap-10 md:px-8">
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          Built for
        </span>
        {items.map((i) => (
          <span key={i} className="shrink-0 font-display text-sm font-semibold text-foreground/80">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Smartphone,
    title: "Log a game in 60 seconds",
    body: "Mobile-first form built for the parking lot after the run. Smart defaults remember your favorite courts.",
    glow: "blue" as const,
  },
  {
    icon: Brain,
    title: "AI breakdown every game",
    body: "Get a real coach's read: strengths, weaknesses, and a focus for next time — written in plain language.",
    glow: "orange" as const,
  },
  {
    icon: LineChart,
    title: "See trends that matter",
    body: "Points, FG%, efficiency, turnovers — charted over time so you can actually see growth.",
    glow: "blue" as const,
  },
  {
    icon: MapPin,
    title: "Performance by court",
    body: "Find your home gym. See where you score, where you struggle, and which crowds bring out your best.",
    glow: "orange" as const,
  },
  {
    icon: Trophy,
    title: "Personal records & badges",
    body: "Best scoring game. Most efficient night. Hot streaks. Build a basketball history that's yours.",
    glow: "blue" as const,
  },
  {
    icon: Target,
    title: "Recent form vs lifetime",
    body: "Last 5 games stacked against your career averages. Know if you're trending up or cooling off.",
    glow: "orange" as const,
  },
];

function FeatureGrid() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Everything you need
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            A real stat sheet for{" "}
            <span className="text-accent text-glow-orange">real hoopers.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No team subscriptions. No coaches required. Just you, your stats, and the data that
            proves you're getting better.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${
                  f.glow === "blue" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                }`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-px ${
                  f.glow === "blue"
                    ? "bg-gradient-to-r from-transparent via-primary/40 to-transparent"
                    : "bg-gradient-to-r from-transparent via-accent/40 to-transparent"
                } opacity-0 transition-opacity group-hover:opacity-100`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section id="how" className="relative py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:px-8 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Built like a pro tool
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Your performance <span className="text-primary text-glow-blue">operating system.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A dashboard that feels like a serious analytics tool — but built for everyday hoopers,
            not pros.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              { icon: BarChart3, text: "KPI cards for every core stat" },
              { icon: LineChart, text: "Trend charts across all your games" },
              { icon: Brain, text: "AI insights surfaced automatically" },
              { icon: Dumbbell, text: "Recent form vs lifetime average" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground/90">{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button asChild size="lg" className="glow-blue">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get your dashboard
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="neon-border overflow-hidden rounded-2xl">
      <div className="bg-card p-5">
        {/* fake header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Welcome back
            </p>
            <p className="font-display text-lg font-bold">Marco "Splash" R.</p>
          </div>
          <div className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-accent">
            🔥 3-game streak
          </div>
        </div>

        {/* KPI grid */}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { l: "PTS", v: "21.4", c: "primary" },
            { l: "REB", v: "7.8", c: "primary" },
            { l: "FG%", v: "48", c: "accent" },
            { l: "EFF", v: "+18", c: "accent" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-border bg-background/40 p-3">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {k.l}
              </p>
              <p
                className={`stat-num mt-1 font-display text-xl font-bold ${
                  k.c === "primary" ? "text-primary" : "text-accent"
                }`}
              >
                {k.v}
              </p>
            </div>
          ))}
        </div>

        {/* fake chart */}
        <div className="mt-5 rounded-lg border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Points · last 10 games</p>
            <p className="font-mono text-[10px] text-primary">+4.2 vs lifetime</p>
          </div>
          <svg viewBox="0 0 320 90" className="mt-3 h-24 w-full">
            <defs>
              <linearGradient id="line-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.18 230)" />
                <stop offset="100%" stopColor="oklch(0.74 0.19 50)" />
              </linearGradient>
              <linearGradient id="area-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.18 230 / 0.4)" />
                <stop offset="100%" stopColor="oklch(0.78 0.18 230 / 0)" />
              </linearGradient>
            </defs>
            <path
              d="M0 70 L32 60 L64 65 L96 50 L128 55 L160 38 L192 42 L224 28 L256 32 L288 18 L320 22"
              fill="none"
              stroke="url(#line-grad)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M0 70 L32 60 L64 65 L96 50 L128 55 L160 38 L192 42 L224 28 L256 32 L288 18 L320 22 L320 90 L0 90 Z"
              fill="url(#area-grad)"
            />
          </svg>
        </div>

        {/* AI insight */}
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm leading-snug text-foreground/90">
            <span className="font-semibold text-accent">AI insight.</span> You score 18% higher in
            evening games at YMCA Court. Lock in that schedule.
          </p>
        </div>
      </div>
    </div>
  );
}

function WhyItMatters() {
  const points = [
    {
      h: "Build your basketball history",
      b: "Every game logged becomes part of a permanent record. Look back in 6 months and see how far you've come.",
    },
    {
      h: "Stay motivated by the data",
      b: "It's harder to skip the run when your streak is on the line. Stats turn casual play into real progress.",
    },
    {
      h: "Improve where it counts",
      b: "Stop guessing. The numbers tell you exactly which part of your game needs work next week.",
    },
  ];
  return (
    <section id="why" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Why it matters</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Your stats. Your story. <br />
            <span className="text-primary text-glow-blue">Your edge.</span>
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          {points.map((p, i) => (
            <div key={p.h} className="rounded-xl border border-border bg-card p-6 text-left">
              <p className="font-mono text-xs text-primary">0{i + 1}</p>
              <h3 className="mt-3 font-display text-xl font-bold">{p.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 text-center md:p-16">
          <div
            className="pointer-events-none absolute inset-0 bg-court-grid opacity-30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-accent/30 blur-3xl"
            aria-hidden
          />

          <div className="relative">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Turn every pickup game <br />
              into <span className="text-accent text-glow-orange">progress.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Free to start. Built mobile-first. Designed for hoopers who actually show up.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base glow-blue">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start tracking now
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-7">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-display text-sm font-semibold">Papawis Stats</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Papawis Stats · Built for the run.
        </p>
      </div>
    </footer>
  );
}
