import { ScenarioPath } from "@/hooks/usePlanScenarios";
import { cn } from "@/lib/utils";

interface QuarterlyBreakdownProps {
  scenario: ScenarioPath;
  formatCurrency: (value: number) => string;
}

const quarters = [
  { key: 'q1' as const, label: 'Q1', months: 'Jan - Mar' },
  { key: 'q2' as const, label: 'Q2', months: 'Apr - Jun' },
  { key: 'q3' as const, label: 'Q3', months: 'Jul - Sep' },
  { key: 'q4' as const, label: 'Q4', months: 'Oct - Dec' },
];

export function QuarterlyBreakdown({ scenario, formatCurrency }: QuarterlyBreakdownProps) {
  const totalDeals = scenario.dealCount;
  const totalVolume = scenario.totalVolume;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Quarterly Breakdown: {scenario.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            How your {totalDeals} deals distribute across the year
          </p>
        </div>
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: scenario.color }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quarters.map((q, index) => {
          const qData = scenario.quarterlyBreakdown[q.key];
          const percentOfDeals = (qData.deals / totalDeals) * 100;
          const percentOfVolume = (qData.volume / totalVolume) * 100;

          return (
            <div 
              key={q.key}
              className="p-4 rounded-xl bg-secondary/30 border border-border/50 relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Progress bar background */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all duration-500"
                style={{ height: `${percentOfVolume}%` }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-foreground">{q.label}</h4>
                  <span className="text-xs text-muted-foreground">{q.months}</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Deals</p>
                    <p className="text-2xl font-bold text-foreground">{qData.deals}</p>
                    <p className="text-xs text-muted-foreground">
                      {percentOfDeals.toFixed(0)}% of year
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="text-lg font-semibold text-primary">
                      {formatCurrency(qData.volume)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {percentOfVolume.toFixed(0)}% of target
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly breakdown hint */}
      <div className="mt-4 p-3 rounded-lg bg-secondary/20 text-center">
        <p className="text-sm text-muted-foreground">
          Average of <span className="font-semibold text-foreground">{(totalDeals / 12).toFixed(1)}</span> deals per month
          {' '}or <span className="font-semibold text-foreground">{(totalDeals / 52).toFixed(1)}</span> deals per week
        </p>
      </div>
    </div>
  );
}
