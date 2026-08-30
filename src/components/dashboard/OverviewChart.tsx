"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrency } from "@/hooks/useCurrency";
import { useMemo, useState } from "react";

interface OverviewChartProps {
  data: { name: string; value: number; color: string }[];
}

export function OverviewChart({ data }: OverviewChartProps) {
  const { format } = useCurrency();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = useMemo(() => {
    return (data || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [data]);

  const sortedData = useMemo(() => {
    return [...(data || [])].sort((a, b) => b.value - a.value);
  }, [data]);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-muted-foreground text-xs sm:text-sm">
        No expense data available for chart.
      </div>
    );
  }

  const activeItem = activeIndex !== null && sortedData[activeIndex] ? sortedData[activeIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full py-1 min-w-0">
      {/* Donut Chart with Center Total/Hover info */}
      <div className="relative w-full sm:w-[200px] md:w-[220px] h-[190px] sm:h-[210px] flex items-center justify-center shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={76}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? "var(--foreground)" : "transparent"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  className="transition-all duration-200 cursor-pointer"
                  style={{ filter: activeIndex !== null && activeIndex !== index ? "opacity(0.4)" : "opacity(1)" }}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => format(Number(value))}
              contentStyle={{
                backgroundColor: "var(--popover)",
                color: "var(--popover-foreground)",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                fontSize: "11px",
                fontWeight: "600",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text in Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-3">
          {activeItem ? (
            <>
              <span className="text-[9px] uppercase font-bold text-muted-foreground truncate max-w-[90px]">
                {activeItem.name}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">
                {format(activeItem.value)}
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground">
                {total > 0 ? `${((activeItem.value / total) * 100).toFixed(1)}%` : "0%"}
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                Total
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight">
                {format(total)}
              </span>
              <span className="text-[9px] font-medium text-muted-foreground">
                {sortedData.length} items
              </span>
            </>
          )}
        </div>
      </div>

      {/* Category Breakdown Legend List */}
      <div className="w-full flex-1 flex flex-col gap-1 max-h-[210px] overflow-y-auto pr-1 min-w-0">
        {sortedData.map((item, idx) => {
          const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
          const isHovered = activeIndex === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between p-1.5 px-2 rounded-lg transition-all text-xs cursor-pointer min-w-0 ${
                isHovered ? "bg-muted shadow-2xs font-semibold" : "hover:bg-muted/50 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-foreground truncate text-xs" title={item.name}>
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-foreground text-xs">{format(item.value)}</span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-1 py-0.2 rounded min-w-[34px] text-right">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
