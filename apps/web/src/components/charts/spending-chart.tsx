"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";

export interface SpendingPoint {
  label: string;
  amount: number;
}

/**
 * Simple 7-day spending chart. Desktop-first companion; not a dense analytics wall.
 */
export function SpendingChart({
  data,
  currency = "PHP",
}: {
  data: SpendingPoint[];
  currency?: string;
}) {
  return (
    <div className="surface p-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold text-ink">Cycle spending</h2>
          <p className="mt-1 text-[13px] text-ink-secondary">
            Last 7 days across all cards
          </p>
        </div>
      </div>
      <div
        className="h-[220px] w-full"
        role="img"
        aria-label={`Spending over the last 7 days. Total ${formatMoney(
          data.reduce((s, d) => s + d.amount, 0),
          currency
        )}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--divider)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--ink-secondary)", fontSize: 12 }}
              axisLine={{ stroke: "var(--divider)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--ink-tertiary)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("en-PH", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v)
              }
            />
            <Tooltip
              formatter={(value) => [
                formatMoney(Number(value), currency),
                "Spending",
              ]}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                borderRadius: 12,
                color: "var(--ink)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--ink-secondary)" }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#spendFill)"
              animationDuration={280}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
