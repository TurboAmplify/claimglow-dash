import { useMemo } from "react";
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScenarioPath } from "@/hooks/usePlanScenarios";

interface ProgressTrackerProps {
  scenario: ScenarioPath;
  actualCommissions: {
    totalVolume: number;
    totalDeals: number;
    totalCommission: number;
    monthlyBreakdown: { month: string; volume: number; deals: number }[];
  };
  formatCurrency: (value: number) => string;
  currentYear: number;
}

export function ProgressTracker({ 
  scenario, 
  actualCommissions, 
  formatCurrency,
  currentYear 
}: ProgressTrackerProps) {
  const currentMonth = new Date().getMonth(); // 0-11
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  
  const progress = useMemo(() => {
    const monthsPassed = currentMonth + 1;
    const yearProgress = monthsPassed / 12;
    
    // Calculate expected progress based on quarterly breakdown
    const quarterKeys = ['q1', 'q2', 'q3', 'q4'] as const;
    let expectedVolume = 0;
    let expectedDeals = 0;
    
    for (let q = 0; q < 4; q++) {
      const qData = scenario.quarterlyBreakdown[quarterKeys[q]];
      if (q < currentQuarter - 1) {
        // Full quarter completed
        expectedVolume += qData.volume;
        expectedDeals += qData.deals;
      } else if (q === currentQuarter - 1) {
        // Current quarter - prorate
        const monthsInQuarter = Math.min(3, monthsPassed - (q * 3));
        const quarterProgress = monthsInQuarter / 3;
        expectedVolume += qData.volume * quarterProgress;
        expectedDeals += qData.deals * quarterProgress;
      }
    }
    
    const volumeProgress = scenario.totalVolume > 0 
      ? (actualCommissions.totalVolume / scenario.totalVolume) * 100 
      : 0;
    
    const dealsProgress = scenario.dealCount > 0 
      ? (actualCommissions.totalDeals / scenario.dealCount) * 100 
      : 0;
    
    const volumeVsExpected = expectedVolume > 0 
      ? ((actualCommissions.totalVolume - expectedVolume) / expectedVolume) * 100 
      : 0;
    
    const dealsVsExpected = expectedDeals > 0 
      ? ((actualCommissions.totalDeals - expectedDeals) / expectedDeals) * 100 
      : 0;
    
    const isOnTrack = volumeProgress >= (yearProgress * 100 - 5);
    
    return {
      volumeProgress: Math.min(volumeProgress, 100),
      dealsProgress: Math.min(dealsProgress, 100),
      expectedVolume,
      expectedDeals,
      volumeVsExpected,
      dealsVsExpected,
      yearProgress: yearProgress * 100,
      isOnTrack,
      monthsPassed,
    };
  }, [scenario, actualCommissions, currentMonth, currentQuarter]);

  const getStatusColor = (variance: number) => {
    if (variance >= 5) return "text-emerald-500";
    if (variance >= -5) return "text-amber-500";
    return "text-destructive";
  };

  const getStatusIcon = (variance: number) => {
    if (variance >= 5) return CheckCircle2;
    if (variance >= -5) return AlertCircle;
    return TrendingDown;
  };

  const StatusIcon = getStatusIcon(progress.volumeVsExpected);

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div className={cn(
        "glass-card p-6 animate-fade-in",
        progress.isOnTrack 
          ? "border-l-4 border-l-emerald-500" 
          : "border-l-4 border-l-amber-500"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-full",
            progress.isOnTrack ? "bg-emerald-500/20" : "bg-amber-500/20"
          )}>
            <StatusIcon className={cn(
              "w-6 h-6",
              progress.isOnTrack ? "text-emerald-500" : "text-amber-500"
            )} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              {progress.isOnTrack ? "On Track" : "Needs Attention"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {progress.monthsPassed} months into {currentYear} • Q{currentQuarter} in progress
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {progress.volumeProgress.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">of annual target</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Volume Progress */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Volume</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(actualCommissions.totalVolume)}
              </span>
            </div>
            <Progress value={progress.volumeProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {formatCurrency(scenario.totalVolume)}</span>
              <span className={getStatusColor(progress.volumeVsExpected)}>
                {progress.volumeVsExpected >= 0 ? "+" : ""}{progress.volumeVsExpected.toFixed(1)}% vs expected
              </span>
            </div>
          </div>
        </div>

        {/* Deals Progress */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Deals</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Closed</span>
              <span className="font-semibold text-foreground">
                {actualCommissions.totalDeals}
              </span>
            </div>
            <Progress value={progress.dealsProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {scenario.dealCount} deals</span>
              <span className={getStatusColor(progress.dealsVsExpected)}>
                {progress.dealsVsExpected >= 0 ? "+" : ""}{progress.dealsVsExpected.toFixed(1)}% vs expected
              </span>
            </div>
          </div>
        </div>

        {/* Avg Deal Size */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Avg Deal Size</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual</span>
              <span className="font-semibold text-foreground">
                {actualCommissions.totalDeals > 0 
                  ? formatCurrency(actualCommissions.totalVolume / actualCommissions.totalDeals)
                  : "$0"
                }
              </span>
            </div>
            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ 
                  width: `${Math.min(
                    actualCommissions.totalDeals > 0 
                      ? ((actualCommissions.totalVolume / actualCommissions.totalDeals) / scenario.avgDealSize) * 100 
                      : 0,
                    100
                  )}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {formatCurrency(scenario.avgDealSize)}</span>
              {actualCommissions.totalDeals > 0 && (
                <span className={cn(
                  (actualCommissions.totalVolume / actualCommissions.totalDeals) >= scenario.avgDealSize 
                    ? "text-emerald-500" 
                    : "text-amber-500"
                )}>
                  {(((actualCommissions.totalVolume / actualCommissions.totalDeals) / scenario.avgDealSize - 1) * 100).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Commission Earned */}
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-foreground">Commission Earned</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Actual</span>
              <span className="font-semibold text-emerald-500">
                {formatCurrency(actualCommissions.totalCommission)}
              </span>
            </div>
            <Progress 
              value={Math.min((actualCommissions.totalCommission / scenario.projectedCommission) * 100, 100)} 
              className="h-2" 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Target: {formatCurrency(scenario.projectedCommission)}</span>
              <span>
                {((actualCommissions.totalCommission / scenario.projectedCommission) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Breakdown Comparison */}
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quarterly Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarterLabel, idx) => {
            const quarterKey = `q${idx + 1}` as 'q1' | 'q2' | 'q3' | 'q4';
            const planned = scenario.quarterlyBreakdown[quarterKey];
            const isCurrentQuarter = idx + 1 === currentQuarter;
            const isPastQuarter = idx + 1 < currentQuarter;
            
            // Calculate actual for this quarter from monthly breakdown
            const quarterMonths = [idx * 3, idx * 3 + 1, idx * 3 + 2];
            const actualQuarterVolume = actualCommissions.monthlyBreakdown
              .filter((_, i) => quarterMonths.includes(i))
              .reduce((sum, m) => sum + m.volume, 0);
            const actualQuarterDeals = actualCommissions.monthlyBreakdown
              .filter((_, i) => quarterMonths.includes(i))
              .reduce((sum, m) => sum + m.deals, 0);

            const volumePercent = planned.volume > 0 
              ? (actualQuarterVolume / planned.volume) * 100 
              : 0;

            return (
              <div 
                key={quarterLabel}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  isCurrentQuarter 
                    ? "border-primary bg-primary/5" 
                    : isPastQuarter
                      ? "border-border/50 bg-secondary/20"
                      : "border-dashed border-border/30 bg-muted/10"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "font-semibold",
                    isCurrentQuarter ? "text-primary" : "text-foreground"
                  )}>
                    {quarterLabel}
                  </span>
                  {isCurrentQuarter && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Volume</span>
                    <span className={cn(
                      "font-medium",
                      volumePercent >= 90 ? "text-emerald-500" : 
                      volumePercent >= 70 ? "text-amber-500" : 
                      isPastQuarter ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {formatCurrency(actualQuarterVolume)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Plan: {formatCurrency(planned.volume)}
                  </div>
                  <Progress 
                    value={Math.min(volumePercent, 100)} 
                    className="h-1.5" 
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {actualQuarterDeals} / {planned.deals} deals
                    </span>
                    <span className={cn(
                      volumePercent >= 90 ? "text-emerald-500" : 
                      volumePercent >= 70 ? "text-amber-500" : 
                      isPastQuarter ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {volumePercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
