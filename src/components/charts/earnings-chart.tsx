"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EarningsPoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EarningsChart({ data }: { data: EarningsPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="#2a3070" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8d93c4", fontSize: 11 }}
              tickFormatter={(v) => String(v).slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8d93c4", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#14183a",
                border: "1px solid #2a3070",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
              }}
              labelStyle={{ color: "#8d93c4" }}
              cursor={{ stroke: "#3b4290" }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ffc21a"
              fill="#ffc21a"
              fillOpacity={0.12}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
