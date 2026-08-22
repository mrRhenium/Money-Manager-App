import { getGoals } from "@/actions/goal";
import { GoalForm } from "@/components/forms/GoalForm";
import { Target } from "lucide-react";
import { GoalList } from "@/components/lists/GoalList";

export default async function GoalsPage() {
  const goals = await getGoals();

  const activeGoals = goals.filter((g: any) => g.status === "active");
  const completedGoals = goals.filter((g: any) => g.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-8 h-8 text-primary" />
            Savings Goals
          </h1>
          <p className="text-muted-foreground mt-1">Track your progress towards your financial targets.</p>
        </div>
        <GoalForm onUpdate={() => {}} />
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No Goals Set</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">Create savings buckets like "Vacation", "Emergency Fund", or "New Car" to start tracking your progress.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold border-b pb-2">In Progress</h2>
              <GoalList goals={activeGoals} />
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4 mt-8 opacity-80">
              <h2 className="text-xl font-bold border-b pb-2">Completed</h2>
              <GoalList goals={completedGoals} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
