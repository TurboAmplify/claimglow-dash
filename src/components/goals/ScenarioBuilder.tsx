import { Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DealMixScenario, 
  QuarterlyPlan, 
  DealMix,
  DEAL_SIZES,
  calculateQuarterVolume,
  calculateQuarterDeals 
} from "@/hooks/useGoalScenarios";

interface ScenarioBuilderProps {
  scenarios: DealMixScenario[];
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  customQuarters: QuarterlyPlan;
  updateCustomQuarter: (quarter: keyof QuarterlyPlan, mix: DealMix) => void;
  targetRevenue: number;
  formatCurrency: (value: number) => string;
}

export function ScenarioBuilder({
  scenarios,
  activeScenarioId,
  setActiveScenarioId,
  customQuarters,
  updateCustomQuarter,
  targetRevenue,
  formatCurrency,
}: ScenarioBuilderProps) {
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/20">
          <Layers className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Scenario Builder</h2>
          <p className="text-sm text-muted-foreground">Choose a template or build your own path to {formatCurrency(targetRevenue)}</p>
        </div>
      </div>

      {/* Scenario Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {scenarios.map((scenario) => {
          const isActive = scenario.id === activeScenarioId;
          const percentOfGoal = (scenario.totalVolume / targetRevenue) * 100;
          
          return (
            <button
              key={scenario.id}
              onClick={() => setActiveScenarioId(scenario.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-secondary/20 hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground text-sm">{scenario.name}</span>
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{scenario.description}</p>
              {scenario.id !== "custom" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Volume</span>
                    <span className={`font-medium ${percentOfGoal >= 95 ? 'text-emerald-500' : percentOfGoal >= 80 ? 'text-amber-500' : 'text-destructive'}`}>
                      {formatCurrency(scenario.totalVolume)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Deals</span>
                    <span className="text-foreground font-medium">{scenario.totalDeals}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-2">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        percentOfGoal >= 95 ? 'bg-emerald-500' : percentOfGoal >= 80 ? 'bg-amber-500' : 'bg-destructive'
                      }`}
                      style={{ width: `${Math.min(percentOfGoal, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">{percentOfGoal.toFixed(0)}% of goal</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Builder - Only show when custom is selected */}
      {activeScenarioId === "custom" && (
        <div className="border-t border-border pt-6">
          <h3 className="text-md font-semibold text-foreground mb-4">Custom Deal Mix</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => (
              <QuarterEditor
                key={quarter}
                quarter={quarter}
                mix={customQuarters[quarter]}
                onChange={(mix) => updateCustomQuarter(quarter, mix)}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
          
          {/* Custom scenario totals */}
          {activeScenario && (
            <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-sm text-muted-foreground">Total Volume</span>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(activeScenario.totalVolume)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Deals</span>
                  <p className="text-xl font-bold text-foreground">{activeScenario.totalDeals}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">% of Goal</span>
                  <p className={`text-xl font-bold ${
                    activeScenario.totalVolume >= targetRevenue * 0.95 ? 'text-emerald-500' : 
                    activeScenario.totalVolume >= targetRevenue * 0.8 ? 'text-amber-500' : 'text-destructive'
                  }`}>
                    {((activeScenario.totalVolume / targetRevenue) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Gap to Goal</span>
                  <p className="text-xl font-bold text-foreground">
                    {targetRevenue - activeScenario.totalVolume > 0 
                      ? formatCurrency(targetRevenue - activeScenario.totalVolume)
                      : 'On Target!'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuarterEditorProps {
  quarter: 'q1' | 'q2' | 'q3' | 'q4';
  mix: DealMix;
  onChange: (mix: DealMix) => void;
  formatCurrency: (value: number) => string;
}

function QuarterEditor({ quarter, mix, onChange, formatCurrency }: QuarterEditorProps) {
  const quarterLabels = { q1: 'Q1 (Jan-Mar)', q2: 'Q2 (Apr-Jun)', q3: 'Q3 (Jul-Sep)', q4: 'Q4 (Oct-Dec)' };
  const volume = calculateQuarterVolume(mix);
  const deals = calculateQuarterDeals(mix);

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border">
      <h4 className="font-semibold text-foreground mb-3">{quarterLabels[quarter]}</h4>
      
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-amber-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {DEAL_SIZES.large.label}
          </Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={mix.large}
            onChange={(e) => onChange({ ...mix, large: parseInt(e.target.value) || 0 })}
            className="mt-1 h-8 bg-background"
          />
        </div>
        <div>
          <Label className="text-xs text-emerald-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {DEAL_SIZES.medium.label}
          </Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={mix.medium}
            onChange={(e) => onChange({ ...mix, medium: parseInt(e.target.value) || 0 })}
            className="mt-1 h-8 bg-background"
          />
        </div>
        <div>
          <Label className="text-xs text-cyan-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            {DEAL_SIZES.small.label}
          </Label>
          <Input
            type="number"
            min={0}
            max={10}
            value={mix.small}
            onChange={(e) => onChange({ ...mix, small: parseInt(e.target.value) || 0 })}
            className="mt-1 h-8 bg-background"
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Volume</span>
          <span className="text-foreground font-medium">{formatCurrency(volume)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Deals</span>
          <span className="text-foreground font-medium">{deals}</span>
        </div>
      </div>
    </div>
  );
}
