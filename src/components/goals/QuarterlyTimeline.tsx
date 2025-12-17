import { Calendar, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  DealMixScenario, 
  DEAL_SIZES,
  calculateQuarterVolume,
  calculateQuarterDeals 
} from "@/hooks/useGoalScenarios";

interface QuarterlyTimelineProps {
  activeScenario: DealMixScenario;
  quarterlyProgress: {
    q1: { planned: number; completed: number; deals: { planned: number; completed: number } };
    q2: { planned: number; completed: number; deals: { planned: number; completed: number } };
    q3: { planned: number; completed: number; deals: { planned: number; completed: number } };
    q4: { planned: number; completed: number; deals: { planned: number; completed: number } };
  };
  ytdProgress: {
    totalPlanned: number;
    totalCompleted: number;
    totalDealsPlanned: number;
    totalDealsCompleted: number;
    percentComplete: number;
    gapToGoal: number;
  };
  targetRevenue: number;
  formatCurrency: (value: number) => string;
}

export function QuarterlyTimeline({
  activeScenario,
  quarterlyProgress,
  ytdProgress,
  targetRevenue,
  formatCurrency,
}: QuarterlyTimelineProps) {
  const quarters = ['q1', 'q2', 'q3', 'q4'] as const;
  const quarterLabels = { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' };
  const quarterMonths = { q1: 'Jan-Mar', q2: 'Apr-Jun', q3: 'Jul-Sep', q4: 'Oct-Dec' };

  // Calculate cumulative targets for the timeline
  const cumulativeTargets = quarters.reduce((acc, q, i) => {
    const prevTotal = i > 0 ? acc[quarters[i - 1]] : 0;
    acc[q] = prevTotal + calculateQuarterVolume(activeScenario.quarters[q]);
    return acc;
  }, {} as Record<typeof quarters[number], number>);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/20">
          <Calendar className="w-5 h-5 text-cyan-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quarterly Timeline</h2>
          <p className="text-sm text-muted-foreground">Visual roadmap for {activeScenario.name} scenario</p>
        </div>
      </div>

      {/* YTD Progress Summary */}
      <div className="mb-6 p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-sm text-muted-foreground">YTD Progress</span>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(ytdProgress.totalCompleted)}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-muted-foreground">Planned</span>
            <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(ytdProgress.totalPlanned)}</p>
          </div>
        </div>
        <Progress value={ytdProgress.percentComplete} className="h-3" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{ytdProgress.totalDealsCompleted} of {ytdProgress.totalDealsPlanned} deals</span>
          <span>{ytdProgress.percentComplete.toFixed(0)}% complete</span>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quarters.map((q, index) => {
          const quarter = activeScenario.quarters[q];
          const progress = quarterlyProgress[q];
          const cumulative = cumulativeTargets[q];
          const quarterTarget = targetRevenue / 4;
          const isAhead = progress.planned >= quarterTarget;
          
          return (
            <div 
              key={q} 
              className="relative p-4 rounded-xl bg-secondary/20 border border-border"
            >
              {/* Quarter Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{quarterLabels[q]}</h3>
                  <p className="text-xs text-muted-foreground">{quarterMonths[q]}</p>
                </div>
                <div className={`p-1.5 rounded-full ${isAhead ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  <TrendingUp className={`w-4 h-4 ${isAhead ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
              </div>

              {/* Deal Blocks */}
              <div className="space-y-2 mb-4">
                {/* Large Deals */}
                {Array.from({ length: quarter.large }).map((_, i) => (
                  <DealBlock key={`large-${i}`} size="large" />
                ))}
                {/* Medium Deals */}
                {Array.from({ length: quarter.medium }).map((_, i) => (
                  <DealBlock key={`medium-${i}`} size="medium" />
                ))}
                {/* Small Deals */}
                {Array.from({ length: quarter.small }).map((_, i) => (
                  <DealBlock key={`small-${i}`} size="small" />
                ))}
                {calculateQuarterDeals(quarter) === 0 && (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-dashed border-border text-center">
                    <p className="text-xs text-muted-foreground">No deals planned</p>
                  </div>
                )}
              </div>

              {/* Quarter Stats */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Quarter Total</span>
                  <span className="font-medium text-foreground">{formatCurrency(progress.planned)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cumulative</span>
                  <span className="font-medium text-primary">{formatCurrency(cumulative)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">% of Goal</span>
                  <span className={`font-medium ${
                    cumulative >= targetRevenue * ((index + 1) / 4) * 0.95 ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {((cumulative / targetRevenue) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Connector Line */}
              {index < 3 && (
                <div className="hidden md:block absolute -right-2 top-1/2 w-4 h-0.5 bg-border" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/80" />
          <span className="text-xs text-muted-foreground">{DEAL_SIZES.large.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/80" />
          <span className="text-xs text-muted-foreground">{DEAL_SIZES.medium.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-cyan-500/80" />
          <span className="text-xs text-muted-foreground">{DEAL_SIZES.small.label}</span>
        </div>
      </div>
    </div>
  );
}

interface DealBlockProps {
  size: 'large' | 'medium' | 'small';
  isCompleted?: boolean;
}

function DealBlock({ size, isCompleted = false }: DealBlockProps) {
  const sizeConfig = {
    large: { height: 'h-10', color: 'bg-amber-500/80 border-amber-500', label: '$5M+' },
    medium: { height: 'h-8', color: 'bg-emerald-500/80 border-emerald-500', label: '$1-2M' },
    small: { height: 'h-6', color: 'bg-cyan-500/80 border-cyan-500', label: '$350-750K' },
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`${config.height} rounded-lg ${config.color} border flex items-center justify-between px-3 transition-all hover:scale-[1.02]`}
    >
      <span className="text-xs font-medium text-white/90">{config.label}</span>
      {isCompleted ? (
        <CheckCircle2 className="w-4 h-4 text-white" />
      ) : (
        <Circle className="w-4 h-4 text-white/50" />
      )}
    </div>
  );
}
