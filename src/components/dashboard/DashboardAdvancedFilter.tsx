"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker, Select as AntSelect } from "antd";
import dayjs from "dayjs";
import { CalendarDays } from "lucide-react";

const { RangePicker } = DatePicker;

// ... keeping options same ...
const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const YEARS = Array.from({ length: 10 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }));

const TIMEFRAME_LABELS: Record<string, string> = {
  "7": "Last 7 Days",
  "15": "Last 15 Days",
  "30": "Last 30 Days",
  "90": "Last 3 Months",
  "180": "Last 6 Months",
  "custom": "Custom Date",
  "month_year": "By Month/Year"
};

export function DashboardAdvancedFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDays = searchParams.get("days") || "7";
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  
  const isCustom = currentDays === "custom";
  const isMonthYear = currentDays === "month_year";

  const selectedMonths = searchParams.get("months") ? searchParams.get("months")?.split(",") : (isMonthYear ? [String(currentMonth)] : []);
  const selectedYears = searchParams.get("years") ? searchParams.get("years")?.split(",") : (isMonthYear ? [String(currentYear)] : []);

  const handleMonthsChange = (values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values && values.length > 0) {
      params.set("months", values.join(","));
    } else {
      params.delete("months");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleYearsChange = (values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values && values.length > 0) {
      params.set("years", values.join(","));
    } else {
      params.delete("years");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:justify-end">
      <div className="flex items-center gap-2">
        <Select 
          value={currentDays} 
          onValueChange={(val) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("days", val as string);
            if (val !== "custom") {
              params.delete("from");
              params.delete("to");
            }
            if (val !== "month_year") {
              params.delete("months");
              params.delete("years");
            } else {
              if (!params.get("years")) params.set("years", String(currentYear));
              if (!params.get("months")) params.set("months", String(currentMonth));
            }
            router.push(`/?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-full bg-secondary/50 hover:bg-secondary border-border/50 text-foreground font-medium shadow-sm transition-all focus:ring-1 focus:ring-primary/30">
            <div className="flex items-center gap-2 truncate">
              <CalendarDays className="w-4 h-4 text-primary shrink-0" />
              <SelectValue placeholder="Select timeframe">
                <span className="truncate">{TIMEFRAME_LABELS[currentDays] || currentDays}</span>
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="15">Last 15 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 3 Months</SelectItem>
            <SelectItem value="180">Last 6 Months</SelectItem>
            <SelectItem value="custom">Custom Date</SelectItem>
            <SelectItem value="month_year">By Month/Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCustom && (
        <RangePicker 
          className="h-10 w-full sm:w-[240px] rounded-full border-border/50 hover:border-primary/50" 
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

      {isMonthYear && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <AntSelect
            mode="multiple"
            allowClear
            placeholder="Select Months"
            value={selectedMonths}
            onChange={handleMonthsChange}
            options={MONTHS}
            className="w-full sm:w-[200px]"
            maxTagCount="responsive"
            size="large"
          />
          <AntSelect
            mode="multiple"
            allowClear
            placeholder="Select Years"
            value={selectedYears}
            onChange={handleYearsChange}
            options={YEARS}
            className="w-full sm:w-[140px]"
            maxTagCount="responsive"
            size="large"
          />
        </div>
      )}
    </div>
  );
}
