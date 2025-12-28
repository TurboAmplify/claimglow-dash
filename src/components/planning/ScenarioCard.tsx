import { Check, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import { ScenarioPath } from "@/hooks/usePlanScenarios";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ScenarioCardProps {
  scenario: ScenarioPath;
  isSelected: boolean;
  onSelect: () => void;
  formatCurrency: (value: number) => string;
}

const riskConfig = {
  low: { label: "Low Risk", icon: Shield, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium Risk", icon: TrendingUp, color: "text-primary bg-primary/10 border-primary/30" },
  high: { label: "High Risk", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
};

export function ScenarioCard({ scenario, isSelected, onSelect, formatCurrency }: ScenarioCardProps) {
  const risk = riskConfig[scenario.riskLevel];
  const RiskIcon = risk.icon;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-6 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
        isSelected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: scenario.color }}
          />
          <div>
            <h3 className="font-semibold text-foreground">{scenario.name}</h3>
            <p className="text-xs text-muted-foreground">{scenario.subtitle}</p>
          </div>
        </div>
        {isSelected && (
          <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Risk Badge */}
      <Badge variant="outline" className={cn("mb-4", risk.color)}>
        <RiskIcon className="w-3 h-3 mr-1" />
        {risk.label}
      </Badge>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-secondary/30 min-h-[72px]">
          <p className="text-xs text-muted-foreground whitespace-nowrap">Deals Needed</p>
          <p className="text-xl font-bold text-foreground">{scenario.dealCount}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 min-h-[72px]">
          <p className="text-xs text-muted-foreground whitespace-nowrap">Avg Deal Size</p>
          <p className="text-xl font-bold text-foreground whitespace-nowrap">{formatCurrency(scenario.avgDealSize)}</p>
        </div>
      </div>

      {/* Commission */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Projected Commission</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(scenario.projectedCommission)}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {scenario.description}
      </p>

      {/* Key Assumptions */}
      <div className="space-y-1">
        {scenario.keyAssumptions.slice(0, 3).map((assumption, i) => (
          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            {assumption}
          </p>
        ))}
      </div>
    </button>
  );
}
