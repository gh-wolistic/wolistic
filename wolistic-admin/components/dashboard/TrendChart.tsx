"use client";

import { Card } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendChartProps {
  title: string;
  data: Array<{
    date: string;
    value: number;
    label?: string;
  }>;
  loading?: boolean;
  type?: "line" | "area";
  color?: string;
  height?: number;
}

export function TrendChart({
  title,
  data,
  loading,
  type = "area",
  color = "#06b6d4",
  height = 300,
}: TrendChartProps) {
  if (loading) {
    return (
      <Card className="border-white/10 bg-slate-900/70 p-6">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  const ChartComponent = type === "area" ? AreaChart : LineChart;
  const DataComponent = type === "area" ? Area : Line;

  return (
    <Card className="border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
      <h3 className="mb-6 text-lg font-semibold text-white">{title}</h3>

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #ffffff20",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#94a3b8" }}
          />
          {type === "area" ? (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
            />
          ) : (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
}
