import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useYearSummaries, useSalespeople } from "@/hooks/useSalesCommissions";
import { useMemo } from "react";
import { Loader2, Target, TrendingUp, Calculator, DollarSign } from "lucide-react";
import { GoalsSummary } from "@/components/goals/GoalsSummary";
import { ScenarioBuilder } from "@/components/goals/ScenarioBuilder";
import { QuarterlyTimeline } from "@/components/goals/QuarterlyTimeline";
import { useGoalScenarios } from "@/hooks/useGoalScenarios";

export default function GoalPlannerPage() {
  const { data: salespeople } = useSalespeople();
  const salespersonId = salespeople?.[0]?.id;
  const { data: yearSummaries, isLoading } = useYearSummaries(salespersonId);
  
  const TARGET_REVENUE = 55000000;
  
  const {
    scenarios,
    activeScenario,
    activeScenarioId,
    setActiveScenarioId,
    customQuarters,
    updateCustomQuarter,
    quarterlyProgress,
    ytdProgress,
  } = useGoalScenarios(TARGET_REVENUE);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const historicalStats = useMemo(() => {
    if (!yearSummaries || yearSummaries.length === 0) return null;
    
    const totalDeals = yearSummaries.reduce((sum, y) => sum + y.totalDeals, 0);
    const totalVolume = yearSummaries.reduce((sum, y) => sum + y.totalRevisedEstimate, 0);
    const avgDealSize = totalVolume / totalDeals;
    const avgDealsPerYear = totalDeals / yearSummaries.length;
    const avgFee = yearSummaries.reduce((sum, y) => sum + y.avgFeePercentage, 0) / yearSummaries.length;
    const avgSplit = yearSummaries.reduce((sum, y) => sum + y.avgSplitPercentage, 0) / yearSummaries.length;
    const avgCommission = yearSummaries.reduce((sum, y) => sum + y.avgCommissionPercentage, 0) / yearSummaries.length;
    
    const bestYear = yearSummaries.reduce((best, y) => 
      y.totalRevisedEstimate > best.totalRevisedEstimate ? y : best
    );
    
    return {
      totalDeals,
      totalVolume,
      avgDealSize,
      avgDealsPerYear,
      avgFee,
      avgSplit,
      avgCommission,
      bestYear,
      years: yearSummaries.length,
    };
  }, [yearSummaries]);

  const projections = useMemo(() => {
    if (!historicalStats) return null;
    
    const projectedCommission = TARGET_REVENUE * (historicalStats.avgSplit / 100) * (historicalStats.avgFee / 100) * (historicalStats.avgCommission / 100);
    const gapFromTarget = TARGET_REVENUE - historicalStats.bestYear.totalRevisedEstimate;
    const percentGrowthNeeded = (gapFromTarget / historicalStats.bestYear.totalRevisedEstimate) * 100;
    
    return {
      projectedCommission,
      gapFromTarget,
      percentGrowthNeeded,
    };
  }, [historicalStats]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">Goal Planner</h1>
        <p className="text-muted-foreground">
          Plan your path to {formatCurrency(TARGET_REVENUE)} with interactive scenario modeling
        </p>
      </div>

      {!yearSummaries || yearSummaries.length === 0 ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No historical data available.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Import your commission data to start planning.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Expandable Goals Section */}
          <GoalsSummary targetRevenue={TARGET_REVENUE} formatCurrency={formatCurrency} />

          {/* Quick Stats Cards */}
          {projections && historicalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card p-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Target Revenue</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(TARGET_REVENUE)}</p>
                <p className="text-xs text-muted-foreground mt-1">2026 Annual Objective</p>
              </div>
              
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Calculator className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Scenario Volume</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(activeScenario.totalVolume)}</p>
                <p className="text-xs text-muted-foreground mt-1">{activeScenario.name} - {activeScenario.totalDeals} deals</p>
              </div>
              
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Projected Commission</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(projections.projectedCommission)}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on historical rates</p>
              </div>
              
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <TrendingUp className="w-5 h-5 text-cyan-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Growth Needed</span>
                </div>
                <p className={`text-2xl font-bold ${projections.percentGrowthNeeded > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {projections.percentGrowthNeeded > 0 ? '+' : ''}{projections.percentGrowthNeeded.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs best year ({historicalStats.bestYear.year})</p>
              </div>
            </div>
          )}

          {/* Scenario Builder */}
          <ScenarioBuilder
            scenarios={scenarios}
            activeScenarioId={activeScenarioId}
            setActiveScenarioId={setActiveScenarioId}
            customQuarters={customQuarters}
            updateCustomQuarter={updateCustomQuarter}
            targetRevenue={TARGET_REVENUE}
            formatCurrency={formatCurrency}
          />

          {/* Quarterly Timeline */}
          <QuarterlyTimeline
            activeScenario={activeScenario}
            quarterlyProgress={quarterlyProgress}
            ytdProgress={ytdProgress}
            targetRevenue={TARGET_REVENUE}
            formatCurrency={formatCurrency}
          />

          {/* Historical Context */}
          {historicalStats && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">Historical Context</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">Avg Deal Size</span>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(historicalStats.avgDealSize)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">Deals/Year</span>
                  <p className="text-lg font-bold text-foreground">{historicalStats.avgDealsPerYear.toFixed(1)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">Best Year</span>
                  <p className="text-lg font-bold text-primary">{historicalStats.bestYear.year}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">Best Volume</span>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(historicalStats.bestYear.totalRevisedEstimate)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">Avg Fee %</span>
                  <p className="text-lg font-bold text-foreground">{historicalStats.avgFee.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <span className="text-xs text-muted-foreground">Total Deals</span>
                  <p className="text-lg font-bold text-foreground">{historicalStats.totalDeals}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
