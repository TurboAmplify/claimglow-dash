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

interface ScenarioComparisonChartProps {
  scenarios: ScenarioPath[];
  monthlyProjections: Record<string, number | string>[];
  targetRevenue: number;
  formatCurrency: (value: number) => string;
  selectedScenarioId?: string;
}

export function ScenarioComparisonChart({ 
  scenarios, 
  monthlyProjections, 
  targetRevenue,
  formatCurrency,
  selectedScenarioId
}: ScenarioComparisonChartProps) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Cumulative Trajectory to {formatCurrency(targetRevenue)}
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={monthlyProjections}>
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
              const scenario = scenarios.find(s => s.id === name);
              return [formatCurrency(value), scenario?.name || name];
            }}
          />
          <Legend 
            formatter={(value) => {
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
        </div>
      </div>
    </div>
  );
}
