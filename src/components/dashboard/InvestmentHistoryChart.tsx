"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function InvestmentHistoryChart({ history }: { history: any[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
        No history data available yet.
      </div>
    );
  }

  const data = history.map(h => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    value: h.value
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="date" 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={30}
          />
          <YAxis 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
            domain={['auto', 'auto']}
            width={80}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Value"]}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
