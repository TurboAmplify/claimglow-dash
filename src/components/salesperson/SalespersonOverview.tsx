import { KPICard } from "@/components/dashboard/KPICard";
import { DollarSign, FileText, TrendingUp, Percent, Target, Banknote } from "lucide-react";
import { SalesGoal } from "@/types/sales";
import { Progress } from "@/components/ui/progress";

interface SalespersonOverviewProps {
  stats: {
    totalDeals: number;
    totalVolume: number;
    totalRevisedVolume: number;
    totalCommissions: number;
    totalInsuranceChecks: number;
    totalNewRemainder: number;
    avgDealSize: number;
    commissionYield: number;
  } | null;
  goal?: SalesGoal;
  salespersonName: string;
}

export function SalespersonOverview({ stats, goal, salespersonName }: SalespersonOverviewProps) {
  if (!stats) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">No sales data available for {salespersonName}</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const revenueProgress = goal?.target_revenue 
    ? Math.min((stats.totalRevisedVolume / goal.target_revenue) * 100, 100) 
    : 0;
  const dealsProgress = goal?.target_deals 
    ? Math.min((stats.totalDeals / goal.target_deals) * 100, 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Deals"
          value={stats.totalDeals.toString()}
          subtitle="Closed deals"
          icon={FileText}
          glowColor="primary"
          delay={0}
        />
        <KPICard
          title="Total Volume"
          value={formatCurrency(stats.totalRevisedVolume)}
          subtitle={`Initial: ${formatCurrency(stats.totalVolume)}`}
          icon={TrendingUp}
          glowColor="success"
          delay={100}
        />
        <KPICard
          title="Commissions Earned"
          value={formatCurrency(stats.totalCommissions)}
          subtitle="Paid to date"
          icon={DollarSign}
          glowColor="accent"
          delay={200}
        />
        <KPICard
          title="Insurance Checks"
          value={formatCurrency(stats.totalInsuranceChecks)}
          subtitle="YTD received"
          icon={Banknote}
          glowColor="primary"
          delay={300}
        />
        <KPICard
          title="Pending Balance"
          value={formatCurrency(stats.totalNewRemainder)}
          subtitle="Remaining to collect"
          icon={Target}
          glowColor="destructive"
          delay={400}
        />
        <KPICard
          title="Commission Yield"
          value={`${stats.commissionYield.toFixed(1)}%`}
          subtitle="Commission / Volume"
          icon={Percent}
          glowColor="accent"
          delay={500}
        />
        <KPICard
          title="Avg Deal Size"
          value={formatCurrency(stats.avgDealSize)}
          subtitle="Per deal"
          icon={FileText}
          glowColor="success"
          delay={600}
        />
      </div>

      {/* Goal Progress */}
      {goal && (
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {new Date().getFullYear()} Goal Progress
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goal.target_revenue && goal.target_revenue > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Revenue Target</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(stats.totalRevisedVolume)} / {formatCurrency(goal.target_revenue)}
                  </span>
                </div>
                <Progress value={revenueProgress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">{revenueProgress.toFixed(1)}% achieved</p>
              </div>
            )}
            
            {goal.target_deals && goal.target_deals > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Deals Target</span>
                  <span className="text-sm font-medium text-foreground">
                    {stats.totalDeals} / {goal.target_deals}
                  </span>
                </div>
                <Progress value={dealsProgress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">{dealsProgress.toFixed(1)}% achieved</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!goal && (
        <div className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: "700ms" }}>
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No goals set for {new Date().getFullYear()}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Switch to the Goals tab to set targets
          </p>
        </div>
      )}
    </div>
  );
}
