import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = {
  idx: number;
  label: string;
  points: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fg: number;
  pps: number;
};

type AnalyticsTrendChartProps = {
  data: ChartDatum[];
  metric: keyof Omit<ChartDatum, "idx" | "label">;
  color: string;
};

export default function AnalyticsTrendChart({ data, metric, color }: AnalyticsTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="metric-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="oklch(0.68 0.025 250)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="oklch(0.68 0.025 250)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.21 0.025 252)",
            border: "1px solid oklch(1 0 0 / 0.1)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "oklch(0.97 0.01 250)" }}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke={color}
          strokeWidth={2.5}
          fill="url(#metric-grad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
