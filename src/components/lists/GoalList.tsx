"use client";

import { useMemo, useState } from "react";
import { List, Popconfirm, Modal, Tabs, Select as AntSelect } from "antd";
import { formatDateString } from "@/lib/dateTimeHelper";
import { Progress } from "@/components/ui/progress";
import { Trash, Target, CalendarDays, PlusCircle, Search, ArrowUpDown, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
import { GoalForm } from "../forms/GoalForm";
import { GoalDeleteModal } from "../forms/GoalDeleteModal";
import { deleteGoal } from "@/actions/goal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { AddFundsModal } from "../forms/AddFundsModal";
import { WithdrawFundsModal } from "../forms/WithdrawFundsModal";
import { useCurrency } from "@/hooks/useCurrency";

export function GoalList({ 
  activeGoals, 
  completedGoals, 
  accounts = [],
  externalSort,
  hideToolbar = false
}: { 
  activeGoals: any[], 
  completedGoals: any[], 
  accounts?: any[],
  externalSort?: string,
  hideToolbar?: boolean
}) {
  const { format } = useCurrency();
  const [activeTab, setActiveTab] = useState("in-progress");
  const [searchTerm, setSearchTerm] = useState("");
  const [internalSortBy, setInternalSortBy] = useState("deadline-nearest");
  const sortBy = externalSort || internalSortBy;

  const getDaysLeft = (deadline: string | undefined) => {
    if (!deadline) return Infinity;
    return dayjs(deadline).diff(dayjs(), "day");
  };

  const getUrgencyInfo = (deadline: string | undefined) => {
    if (!deadline) return null;
    const days = getDaysLeft(deadline);
    if (days < 0) return { label: "Overdue", color: "bg-red-500/10 text-red-600 dark:text-red-400", days: Math.abs(days) };
    if (days <= 7) return { label: `${days}d left`, color: "bg-red-500/10 text-red-600 dark:text-red-400", days };
    if (days <= 30) return { label: `${days}d left`, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", days };
    if (days <= 90) return { label: `${Math.floor(days / 30)}mo left`, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", days };
    return { label: `${Math.floor(days / 30)}mo left`, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", days };
  };

  const sortGoals = (goals: any[]) => {
    const sorted = [...goals];
    switch (sortBy) {
      case "deadline-nearest":
        return sorted.sort((a, b) => getDaysLeft(a.deadline) - getDaysLeft(b.deadline));
      case "deadline-farthest":
        return sorted.sort((a, b) => {
          const da = a.deadline ? getDaysLeft(a.deadline) : -Infinity;
          const db = b.deadline ? getDaysLeft(b.deadline) : -Infinity;
          return db - da;
        });
      case "progress-high":
        return sorted.sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));
      case "progress-low":
        return sorted.sort((a, b) => (a.currentAmount / a.targetAmount) - (b.currentAmount / b.targetAmount));
      case "amount-high":
        return sorted.sort((a, b) => b.targetAmount - a.targetAmount);
      case "amount-low":
        return sorted.sort((a, b) => a.targetAmount - b.targetAmount);
      default:
        return sorted;
    }
  };

  const filteredActive = useMemo(() => {
    const filtered = activeGoals.filter(goal =>
      goal.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return sortGoals(filtered);
  }, [activeGoals, searchTerm, sortBy]);

  const filteredCompleted = useMemo(() => {
    const filtered = completedGoals.filter(goal =>
      goal.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return sortGoals(filtered);
  }, [completedGoals, searchTerm, sortBy]);

  const renderGoalsList = (goals: any[]) => {
    if (goals.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl mt-4">
          No goals in this section.
        </div>
      );
    }
    return (
      <List
        grid={{ gutter: [24, 24], xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={goals}
        pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={(goal: any) => {
          const actualPercentage = (goal.currentAmount / goal.targetAmount) * 100;
          const clampedPercentage = Math.min(actualPercentage, 100);
          const isCompleted = goal.status === "completed" || actualPercentage >= 100;

          return (
            <List.Item>
              <div className="relative group block rounded-2xl p-5 border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden gap-4">
                <div className="flex justify-between items-start gap-4 z-10">
                  <div className="flex items-center gap-3">
                      <div 
                        className="p-2 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner"
                        style={{ backgroundColor: goal.color || "#10b981" }}
                      >
                        <Target className="w-5 h-5 text-white" />
                      </div>
                    <div>
                      <h3 className="font-semibold leading-none mb-1 truncate" title={goal.name}>{goal.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> 
                            {formatDateString(goal.deadline, "DD-MM-YYYY")}
                          </p>
                        )}
                        {(() => {
                          const urgency = getUrgencyInfo(goal.deadline);
                          if (!urgency || isCompleted) return null;
                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${urgency.color}`}>
                              {urgency.days <= 7 && <AlertTriangle className="w-2.5 h-2.5" />}
                              {urgency.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 transition-opacity shrink-0">
                    <GoalForm goal={goal} onUpdate={() => {}} />
                    <GoalDeleteModal goal={goal} accounts={accounts} />
                  </div>
                </div>

                <div className="z-10 mt-auto">
                  <div className="w-full space-y-3 pt-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Saved / Target</p>
                        <p className="text-sm font-semibold">{format(goal.currentAmount)} <span className="text-muted-foreground font-normal">/ {format(goal.targetAmount)}</span></p>
                      </div>
                      <div className="text-right">
                        <span style={{ color: goal.color }} className="font-bold">{actualPercentage.toFixed(1)}%</span>
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider mt-1">
                          {isCompleted 
                            ? <span className="text-emerald-500">COMPLETED!</span> 
                            : `LEFT: ${format(goal.targetAmount - goal.currentAmount)}`}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={clampedPercentage} 
                      className="h-3" 
                      indicatorColor={goal.color}
                    />
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 z-10 pt-2">
                  {!isCompleted && (
                    <AddFundsModal goal={goal} accounts={accounts} onUpdate={() => {}} />
                  )}
                  {actualPercentage > 0 && (
                    <WithdrawFundsModal goal={goal} accounts={accounts} onUpdate={() => {}} />
                  )}
                </div>
                
                {/* Decorative background circle */}
                <div 
                  className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                  style={{ backgroundColor: goal.color }}
                />
              </div>
            </List.Item>
          );
        }}
      />
    );
  };

  if (hideToolbar) {
    const allGoals = sortGoals([...activeGoals, ...completedGoals]);
    return (
      <div className="w-full">
        {renderGoalsList(allGoals)}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-card p-3 rounded-xl border shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search goals..." 
            className="pl-9 bg-background h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full">
          <AntSelect
            value={internalSortBy}
            onChange={setInternalSortBy}
            className="w-full h-10"
            suffixIcon={<ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />}
            options={[
            { label: "🔥 Deadline: Nearest First", value: "deadline-nearest" },
            { label: "🕐 Deadline: Farthest First", value: "deadline-farthest" },
            { label: "📈 Progress: High to Low", value: "progress-high" },
            { label: "📉 Progress: Low to High", value: "progress-low" },
            { label: "💰 Target: High to Low", value: "amount-high" },
            { label: "💵 Target: Low to High", value: "amount-low" },
          ]}
        />
        </div>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "in-progress",
            label: `In Progress (${filteredActive.length})`,
            children: renderGoalsList(filteredActive),
          },
          {
            key: "completed",
            label: `Completed (${filteredCompleted.length})`,
            children: renderGoalsList(filteredCompleted),
          },
        ]}
      />
    </div>
  );
}
