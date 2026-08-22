"use client";

import { useState } from "react";
import { List, Popconfirm, Modal } from "antd";
import { Progress } from "@/components/ui/progress";
import { Trash, Target, CalendarDays, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoalForm } from "../forms/GoalForm";
import { deleteGoal } from "@/actions/goal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { AddFundsModal } from "../forms/AddFundsModal";
import { useCurrency } from "@/hooks/useCurrency";

export function GoalList({ goals }: { goals: any[] }) {
  const { format } = useCurrency();

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <List
        grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={goals}
        pagination={{ pageSize: 9, position: "bottom", align: "end" }}
        renderItem={(goal: any) => {
          const progressPercent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = goal.status === "completed" || progressPercent >= 100;

          return (
            <List.Item>
              <div className="relative group block rounded-2xl p-5 border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between overflow-hidden gap-4">
                <div className="flex justify-between items-start gap-4 z-10">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-inner"
                      style={{ backgroundColor: goal.color }}
                    >
                      <CategoryIcon name={goal.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1" title={goal.name}>{goal.name}</h3>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <CalendarDays className="w-3 h-3" /> 
                          {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 transition-opacity">
                    <GoalForm goal={goal} onUpdate={() => {}} />
                  </div>
                </div>

                <div className="z-10 mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="font-semibold text-lg text-foreground truncate">{goal.name}</p>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">{format(goal.currentAmount)} / {format(goal.targetAmount)}</p>
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <div className="flex justify-between text-[10px] font-bold mb-1 px-0.5 text-muted-foreground uppercase tracking-wider">
                      <span>{progressPercent.toFixed(0)}%</span>
                      {isCompleted ? <span className="text-emerald-500">Completed!</span> : <span>Left: {format(goal.targetAmount - goal.currentAmount)}</span>}
                    </div>
                    <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 ease-in-out" 
                        style={{ width: `${progressPercent}%`, backgroundColor: goal.color }} 
                      />
                    </div>
                  </div>
                </div>

                {!isCompleted && (
                  <div className="flex gap-2 shrink-0 z-10 pt-2">
                    <AddFundsModal goal={goal} onUpdate={() => {}} />
                    <Popconfirm
                      title="Delete Goal"
                      description="Are you sure you want to delete this savings goal?"
                      onConfirm={async () => {
                        await deleteGoal(goal._id);
                      }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </Popconfirm>
                  </div>
                )}
                
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
    </div>
  );
}
