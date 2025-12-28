import { Target, TrendingUp, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { SalesGoal } from "@/types/sales";

interface GoalsSummaryCardProps {
  goal: SalesGoal | null;
  salespersonName: string;
  currentPlanRevenue?: number;
  formatCurrency: (value: number) => string;
}

export function GoalsSummaryCard({ 
  goal, 
  salespersonName, 
  currentPlanRevenue = 0,
  formatCurrency 
}: GoalsSummaryCardProps) {
  if (!goal) {
    return (
      <div className="glass-card p-6 animate-fade-in border-l-4 border-amber-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">No 2026 Goals Set</h3>
            <p className="text-sm text-muted-foreground">
              Goals for {salespersonName} have not been defined yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const targetRevenue = Number(goal.target_revenue) || 0;
  const targetDeals = goal.target_deals || 0;
  const avgDealSize = targetDeals > 0 ? targetRevenue / targetDeals : 0;
  
  // Calculate how current plan compares to goal
  const planVsGoalPercent = targetRevenue > 0 ? (currentPlanRevenue / targetRevenue) * 100 : 0;
  const isOnTrack = planVsGoalPercent >= 100;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">2026 Goals</h3>
          <p className="text-sm text-muted-foreground">{salespersonName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Target Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(targetRevenue)}</p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Target Deals</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{targetDeals}</p>
        </div>

        <div className="p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Deal Size</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(avgDealSize)}</p>
        </div>
      </div>

      {/* Plan vs Goal comparison */}
      {currentPlanRevenue > 0 && (
        <div className={`p-3 rounded-lg border ${isOnTrack ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
          <div className="flex items-center gap-2">
            {isOnTrack ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-sm font-medium">
              Your plan ({formatCurrency(currentPlanRevenue)}) is at{' '}
              <span className={isOnTrack ? 'text-emerald-500' : 'text-amber-500'}>
                {planVsGoalPercent.toFixed(0)}%
              </span>{' '}
              of your goal
            </span>
          </div>
        </div>
      )}

      {/* Notes */}
      {goal.notes && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-foreground">{goal.notes}</p>
        </div>
      )}
    </div>
  );
}
