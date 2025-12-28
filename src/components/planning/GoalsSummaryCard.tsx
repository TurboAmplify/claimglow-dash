import { Target, TrendingUp, FileText, CheckCircle, AlertCircle, Clock, Send, XCircle, ArrowRight } from "lucide-react";
import { SalesGoal } from "@/types/sales";
import { Badge } from "@/components/ui/badge";

interface PlanData {
  target_revenue: number;
  target_commission: number;
  approval_status: string | null;
  submitted_at: string | null;
  approved_at: string | null;
}

interface GoalsSummaryCardProps {
  goal: SalesGoal | null;
  salespersonName: string;
  currentPlanRevenue?: number;
  formatCurrency: (value: number) => string;
  hasSavedPlan?: boolean;
  isLoading?: boolean;
  planData?: PlanData | null;
}

function ApprovalStatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Send className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    case 'draft':
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/30">
          <Clock className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      );
  }
}

export function GoalsSummaryCard({ 
  goal, 
  salespersonName, 
  currentPlanRevenue = 0,
  formatCurrency,
  hasSavedPlan = false,
  isLoading = false,
  planData = null
}: GoalsSummaryCardProps) {
  // Show loading state while goals are being fetched
  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted animate-pulse w-9 h-9" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

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
  
  // Plan metrics
  const planRevenue = planData ? Number(planData.target_revenue) : currentPlanRevenue;
  const planCommission = planData ? Number(planData.target_commission) : 0;
  
  // Calculate how current plan compares to goal
  const planVsGoalPercent = targetRevenue > 0 ? (planRevenue / targetRevenue) * 100 : 0;
  const isOnTrack = planVsGoalPercent >= 100;
  const difference = planRevenue - targetRevenue;

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Header with approval status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">2026 Goals vs Plan</h3>
            <p className="text-sm text-muted-foreground">{salespersonName}</p>
          </div>
        </div>
        {hasSavedPlan && planData && (
          <ApprovalStatusBadge status={planData.approval_status} />
        )}
      </div>

      {/* Side-by-side comparison */}
      {hasSavedPlan && planData ? (
        <div className="space-y-4">
          {/* Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Goals Column */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">Director Goals</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Target Revenue</span>
                  <span className="font-semibold text-foreground">{formatCurrency(targetRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Target Deals</span>
                  <span className="font-semibold text-foreground">{targetDeals}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Deal Size</span>
                  <span className="font-semibold text-foreground">{formatCurrency(avgDealSize)}</span>
                </div>
              </div>
            </div>

            {/* Plan Column */}
            <div className={`p-4 rounded-lg border ${isOnTrack ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
              <h4 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                Your Plan
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plan Revenue</span>
                  <span className="font-semibold text-foreground">{formatCurrency(planRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expected Commission</span>
                  <span className="font-semibold text-foreground">{formatCurrency(planCommission)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">% of Goal</span>
                  <span className={`font-semibold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {planVsGoalPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          <div className={`p-3 rounded-lg border flex items-center justify-between ${isOnTrack ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <div className="flex items-center gap-2">
              {isOnTrack ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm font-medium text-foreground">
                {isOnTrack ? 'Plan meets or exceeds goal' : 'Plan is below goal'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm font-bold ${difference >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Original goals-only view when no plan saved */}
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

          {/* No Plan Status */}
          <div className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">
                No plan confirmed yet — create your plan below and save it
              </span>
            </div>
          </div>
        </>
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
