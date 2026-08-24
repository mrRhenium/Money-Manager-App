"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";
import dayjs from "dayjs";

export function NetWorthChart({ data }: { data: any[] }) {
  const { format: formatCurr } = useCurrency();

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => ({
      date: dayjs(d.date).format("MMM DD"),
      netWorth: d.netWorth,
    }));
  }, [data]);

  if (formattedData.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center pt-2">
        <p className="text-muted-foreground text-xs font-medium">No history yet</p>
      </div>
    );
  }

  // To make the chart look more dynamic, compute min/max for the Y axis
  const minNetWorth = Math.min(...formattedData.map(d => d.netWorth));
  const maxNetWorth = Math.max(...formattedData.map(d => d.netWorth));
  
  // Provide some padding so the line doesn't hit the absolute top/bottom
  const yDomain = [
    Math.min(0, minNetWorth * 0.95), // if positive, min is 95% of min, if negative, 105% 
    maxNetWorth > 0 ? maxNetWorth * 1.05 : 0
  ];

  return (
    <div className="w-full h-[80px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border p-2 text-xs">
                    <p className="font-semibold mb-1">{payload[0].payload.date}</p>
                    <p className="font-bold text-primary">{formatCurr(payload[0].value as number)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNw)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
