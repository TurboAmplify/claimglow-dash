import { Check, Layers, Shield, Scale, Rocket, Building2, Users, Pencil, AlertTriangle, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  DealMixScenario, 
  QuarterlyPlan, 
  DealMix,
  DEAL_SIZES,
  RiskLevel,
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

const scenarioIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "base-reference": Target,
  "conservative": Shield,
  "balanced": Scale,
  "commercial-heavy": Building2,
  "volume-institutional": Users,
  "custom": Pencil,
};

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low Risk", color: "text-emerald-500", bgColor: "bg-emerald-500/20" },
  moderate: { label: "Moderate Risk", color: "text-amber-500", bgColor: "bg-amber-500/20" },
  high: { label: "High Risk", color: "text-red-500", bgColor: "bg-red-500/20" },
};

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
          <h2 className="text-lg font-semibold text-foreground">2026 Scenario Builder</h2>
          <p className="text-sm text-muted-foreground">Strategic paths to {formatCurrency(targetRevenue)}</p>
        </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {scenarios.map((scenario) => {
          const isActive = scenario.id === activeScenarioId;
          const Icon = scenarioIcons[scenario.id] || Target;
          
          return (
            <button
              key={scenario.id}
              onClick={() => setActiveScenarioId(scenario.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                isActive 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{scenario.name}</span>
              {isActive && <Check className="w-4 h-4" />}
            </button>
          );
        })}
      </div>

      {/* Active Scenario Details */}
      {activeScenario && (
        <div className="space-y-6">
          {/* Header with subtitle and risk */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-foreground">{activeScenario.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {activeScenario.subtitle}
                </Badge>
              </div>
              <Badge className={`${riskConfig[activeScenario.riskLevel].bgColor} ${riskConfig[activeScenario.riskLevel].color} border-0`}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {riskConfig[activeScenario.riskLevel].label}
              </Badge>
            </div>
            {activeScenario.id !== "custom" && (
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{formatCurrency(activeScenario.totalVolume)}</p>
                <p className="text-sm text-muted-foreground">{activeScenario.totalDeals} deals/year</p>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">{activeScenario.description}</p>

          {/* Priorities and Assumptions Grid */}
          {activeScenario.id !== "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priorities */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm">This scenario prioritizes:</h4>
                </div>
                <ul className="space-y-2">
                  {activeScenario.priorities.map((priority, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Assumptions */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h4 className="font-semibold text-foreground text-sm">Assumptions:</h4>
                </div>
                <ul className="space-y-2">
                  {activeScenario.assumptions.map((assumption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-amber-500 mt-1">•</span>
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quarterly Breakdown */}
          {activeScenario.id !== "custom" ? (
            <div>
              <h4 className="font-semibold text-foreground mb-3">Quarterly Deal Mix</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => {
                  const quarter = activeScenario.quarters[q];
                  const volume = calculateQuarterVolume(quarter);
                  const deals = calculateQuarterDeals(quarter);
                  const quarterLabels = { q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4' };
                  
                  return (
                    <div key={q} className="p-3 rounded-lg bg-secondary/20 border border-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-foreground">{quarterLabels[q]}</span>
                        <span className="text-xs text-muted-foreground">{deals} deals</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-500">Large</span>
                          <span className="text-foreground">{quarter.large}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-emerald-500">Medium</span>
                          <span className="text-foreground">{quarter.medium}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-cyan-500">Small</span>
                          <span className="text-foreground">{quarter.small}</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Volume</p>
                        <p className="font-semibold text-foreground text-sm">{formatCurrency(volume)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Custom Builder */
            <div>
              <h4 className="font-semibold text-foreground mb-3">Build Your Custom Mix</h4>
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
            </div>
          )}

          {/* Progress bar for non-custom scenarios */}
          {activeScenario.id !== "custom" && (
            <div className="p-4 rounded-xl bg-secondary/20 border border-border">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress to {formatCurrency(targetRevenue)} Goal</span>
                <span className={`text-sm font-semibold ${
                  activeScenario.totalVolume >= targetRevenue * 0.95 ? 'text-emerald-500' : 
                  activeScenario.totalVolume >= targetRevenue * 0.8 ? 'text-amber-500' : 'text-destructive'
                }`}>
                  {((activeScenario.totalVolume / targetRevenue) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    activeScenario.totalVolume >= targetRevenue * 0.95 ? 'bg-emerald-500' : 
                    activeScenario.totalVolume >= targetRevenue * 0.8 ? 'bg-amber-500' : 'bg-destructive'
                  }`}
                  style={{ width: `${Math.min((activeScenario.totalVolume / targetRevenue) * 100, 100)}%` }}
                />
              </div>
              {activeScenario.totalVolume < targetRevenue && (
                <p className="text-xs text-muted-foreground mt-2">
                  Gap: {formatCurrency(targetRevenue - activeScenario.totalVolume)}
                </p>
              )}
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
