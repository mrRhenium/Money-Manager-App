"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateString } from "@/lib/dateTimeHelper";
import { useCurrency } from "@/hooks/useCurrency";

export function InvestmentHistoryChart({ history }: { history: any[] }) {
  const { format } = useCurrency();

  if (!history || history.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-xl">
        No history data available yet.
      </div>
    );
  }

  const data = history.map(h => ({
    date: formatDateString(h.date, "DD-MM-YYYY"),
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
            tickFormatter={(value) => format(value)}
            domain={['auto', 'auto']}
            width={80}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-3">
                    <p className="font-semibold text-sm mb-1">{label}</p>
                    <p className="font-bold text-primary">{format(Number(payload[0].value))}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="var(--primary)" 
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
