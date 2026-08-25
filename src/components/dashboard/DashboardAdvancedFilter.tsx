"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export function DashboardAdvancedFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = searchParams.get("days") || "7";
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  const isCustom = currentDays === "custom";

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <span className="text-sm text-muted-foreground font-medium hidden sm:inline-block">Timeframe:</span>
      <Select 
        value={currentDays} 
        onValueChange={(val) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("days", val as string);
          if (val !== "custom") {
            params.delete("from");
            params.delete("to");
          }
          router.push(`/?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Select timeframe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Last 7 Days</SelectItem>
          <SelectItem value="15">Last 15 Days</SelectItem>
          <SelectItem value="30">Last 30 Days</SelectItem>
          <SelectItem value="90">Last 3 Months</SelectItem>
          <SelectItem value="180">Last 6 Months</SelectItem>
          <SelectItem value="custom">Custom Date</SelectItem>
        </SelectContent>
      </Select>

      {isCustom && (
        <RangePicker 
          className="h-9 w-[240px]" 
          value={fromDate && toDate ? [dayjs(fromDate), dayjs(toDate)] : null}
          onChange={(dates) => {
            const params = new URLSearchParams(searchParams.toString());
            if (dates && dates[0] && dates[1]) {
              params.set("from", dates[0].format("YYYY-MM-DD"));
              params.set("to", dates[1].format("YYYY-MM-DD"));
              router.push(`/?${params.toString()}`);
            } else {
              params.delete("from");
              params.delete("to");
              router.push(`/?${params.toString()}`);
            }
          }}
        />
      )}
    </div>
  );
}
