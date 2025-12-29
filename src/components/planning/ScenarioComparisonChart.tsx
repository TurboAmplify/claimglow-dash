import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from "recharts";
import { ScenarioPath } from "@/hooks/usePlanScenarios";
import { useMemo } from "react";
import { HypotheticalDeal } from "@/hooks/useHypotheticalDeals";

interface ScenarioComparisonChartProps {
  scenarios: ScenarioPath[];
  monthlyProjections: Record<string, number | string>[];
  targetRevenue: number;
  formatCurrency: (value: number) => string;
  selectedScenarioId?: string;
  hypotheticalDeals?: HypotheticalDeal[];
  actualCommissions?: {
    totalVolume: number;
    monthlyBreakdown: { month: string; volume: number; deals: number }[];
  };
}

export function ScenarioComparisonChart({ 
  scenarios, 
  monthlyProjections, 
  targetRevenue,
  formatCurrency,
  selectedScenarioId,
  hypotheticalDeals = [],
  actualCommissions
}: ScenarioComparisonChartProps) {
  // Calculate projections with hypotheticals
  const projectionsWithHypotheticals = useMemo(() => {
    if (hypotheticalDeals.length === 0) return monthlyProjections;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate cumulative hypothetical value by month
    const hypotheticalByMonth = monthNames.map((_, idx) => {
      return hypotheticalDeals
        .filter(d => {
          const dealMonth = new Date(d.expected_close_date).getMonth();
          return dealMonth <= idx;
        })
        .reduce((sum, d) => sum + (d.expected_value * d.probability / 100), 0);
    });

    // Add hypothetical line to projections
    return monthlyProjections.map((proj, idx) => ({
      ...proj,
      withHypotheticals: (actualCommissions?.monthlyBreakdown
        .slice(0, idx + 1)
        .reduce((sum, m) => sum + m.volume, 0) || 0) + hypotheticalByMonth[idx],
    }));
  }, [monthlyProjections, hypotheticalDeals, actualCommissions]);

  const hasHypotheticals = hypotheticalDeals.length > 0;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Cumulative Trajectory to {formatCurrency(targetRevenue)}
        {hasHypotheticals && (
          <span className="ml-2 text-sm font-normal text-violet-500">
            (includes hypotheticals)
          </span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={projectionsWithHypotheticals}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={12} 
            tickFormatter={(v) => formatCurrency(v)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'withHypotheticals') {
                return [formatCurrency(value), 'Actuals + Hypotheticals'];
              }
              const scenario = scenarios.find(s => s.id === name);
              return [formatCurrency(value), scenario?.name || name];
            }}
          />
          <Legend 
            formatter={(value) => {
              if (value === 'withHypotheticals') {
                return 'Actuals + Hypotheticals';
              }
              const scenario = scenarios.find(s => s.id === value);
              return scenario?.name || value;
            }}
          />
          <ReferenceLine 
            y={targetRevenue} 
            stroke="hsl(var(--destructive))" 
            strokeDasharray="5 5" 
            label={{ value: 'Target', position: 'right', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          
          {scenarios.map((scenario) => (
            <Area 
              key={scenario.id}
              type="monotone" 
              dataKey={scenario.id} 
              stroke={scenario.color}
              fill={scenario.color}
              fillOpacity={selectedScenarioId === scenario.id ? 0.3 : 0.1}
              strokeWidth={selectedScenarioId === scenario.id ? 3 : 2}
              strokeOpacity={selectedScenarioId === scenario.id ? 1 : 0.6}
            />
          ))}

          {/* Hypotheticals line */}
          {hasHypotheticals && (
            <Area 
              type="monotone" 
              dataKey="withHypotheticals" 
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend with details */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex flex-wrap gap-4 justify-center">
          {scenarios.map((scenario) => (
            <div 
              key={scenario.id}
              className="flex items-center gap-2 text-sm"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: scenario.color }}
              />
              <span className="text-muted-foreground">{scenario.name}:</span>
              <span className="font-semibold text-foreground">{scenario.dealCount} deals</span>
              <span className="text-muted-foreground">@ {formatCurrency(scenario.avgDealSize)} avg</span>
            </div>
          ))}
          {hasHypotheticals && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-violet-500" />
              <span className="text-muted-foreground">With Hypotheticals</span>
              <span className="text-xs text-violet-500">(dashed)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
