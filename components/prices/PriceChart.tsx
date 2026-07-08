"use client";

import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { PricePoint } from "@/lib/types";
import { asPrice, shortDay } from "@/lib/format";

/**
 * 90-day price history (spec §3.4) — daily low/high band + average trend line,
 * with a dashed 90-day rolling-average reference. Custom-styled Recharts.
 */
export function PriceChart({ history }: { history: PricePoint[] }) {
  const data = history.map((p) => ({
    date: p.date,
    range: [p.low, p.high] as [number, number],
    average: p.average,
  }));
  const avg = history.reduce((s, p) => s + p.average, 0) / Math.max(1, history.length);
  const current = history.at(-1)?.average ?? 0;
  const trendColor = current <= avg ? "#10B981" : "#F59E0B";

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={trendColor} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--hairline)" vertical={false} />
          <XAxis
            dataKey="date" tickFormatter={shortDay} minTickGap={48}
            tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => asPrice(v)} width={64} domain={["auto", "auto"]}
            tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)", border: "1px solid var(--hairline)",
              backdropFilter: "blur(28px) saturate(180%) brightness(1.06)",
              WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(1.06)",
              borderRadius: 12, fontSize: 12, color: "var(--text)",
            }}
            labelFormatter={(l) => shortDay(String(l))}
            formatter={(value, name) => {
              if (name === "average") return [asPrice(Number(value)), "Average"];
              const [lo, hi] = value as unknown as [number, number];
              return [`${asPrice(lo)} – ${asPrice(hi)}`, "Low–High"];
            }}
          />
          <Area type="monotone" dataKey="range" stroke="none" fill="url(#band)" isAnimationActive={false} />
          <Line type="monotone" dataKey="average" stroke={trendColor} strokeWidth={2} dot={false} isAnimationActive={false} />
          <ReferenceLine
            y={avg} stroke="var(--muted)" strokeDasharray="4 4"
            label={{ value: `90-day avg ${asPrice(avg)}`, position: "insideTopLeft", fill: "var(--muted)", fontSize: 11 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
