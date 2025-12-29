import { Home, Building2, Factory, Church, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { ScenarioPath } from "@/hooks/usePlanScenarios";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScenarioTargetsSectionProps {
  selectedScenario: ScenarioPath;
  formatCurrency: (value: number) => string;
}

// Base targets from Matt's 2026 plan - these get adjusted per scenario
const BASE_TARGETS = {
  residential: {
    title: "Residential",
    icon: Home,
    typicalValue: { min: 350000, max: 500000 },
    baseQuarterly: { min: 6, max: 9 },
    baseAnnual: { min: 24, max: 36 },
    baseContribution: { min: 10000000, max: 15000000 },
    notes: "High-value total-loss or heavy-smoke homes; summer storms; high-income ZIP codes.",
    color: "bg-blue-500/10 border-blue-500/30",
    iconColor: "text-blue-600",
  },
  midCommercial: {
    title: "Mid-Size Commercial",
    icon: Building2,
    typicalValue: { min: 1000000, max: 1500000 },
    baseQuarterly: { min: 3, max: 3 },
    baseAnnual: { min: 12, max: 12 },
    baseContribution: { min: 2000000, max: 4000000 },
    notes: "Schools, offices, restaurants, retail, multi-tenant properties.",
    color: "bg-green-500/10 border-green-500/30",
    iconColor: "text-green-600",
  },
  largeCommercial: {
    title: "Large Commercial/Industrial",
    icon: Factory,
    typicalValue: { min: 750000, max: 10000000 },
    baseQuarterly: { min: 2, max: 3 },
    baseAnnual: { min: 8, max: 12 },
    baseContribution: { min: 20000000, max: 30000000 },
    notes: "Manufacturing, warehouses, automotive, distribution, regional chains.",
    color: "bg-amber-500/10 border-amber-500/30",
    iconColor: "text-amber-600",
  },
  religious: {
    title: "Religious Organizations",
    icon: Church,
    typicalValue: { min: 1000000, max: 5000000 },
    baseQuarterly: { min: 2, max: 5 },
    baseAnnual: { min: 8, max: 20 },
    baseContribution: { min: 5000000, max: 15000000 },
    notes: "Large churches, temples, synagogues, mosques, ministries, retreat centers.",
    color: "bg-purple-500/10 border-purple-500/30",
    iconColor: "text-purple-600",
  },
};

// Scenario multipliers - how each scenario adjusts the base targets
const SCENARIO_ADJUSTMENTS: Record<string, {
  residential: number;
  midCommercial: number;
  largeCommercial: number;
  religious: number;
  description: string;
}> = {
  conservative: {
    residential: 1.2,      // More residential focus
    midCommercial: 0.8,    // Less mid-size
    largeCommercial: 0.5,  // Significantly less large deals
    religious: 0.6,        // Less religious focus
    description: "Higher residential volume offsets reduced large-loss exposure",
  },
  balanced: {
    residential: 1.0,      // Baseline
    midCommercial: 1.0,    // Baseline
    largeCommercial: 1.0,  // Baseline
    religious: 1.0,        // Baseline
    description: "Balanced mix across all opportunity categories",
  },
  "commercial-heavy": {
    residential: 0.6,      // Less residential
    midCommercial: 1.2,    // More mid-size
    largeCommercial: 1.5,  // Significantly more large deals
    religious: 1.3,        // More religious (campus-style)
    description: "Focus on fewer, higher-value opportunities",
  },
};

function formatRange(min: number, max: number): string {
  if (min === max) return min.toString();
  return `${min}–${max}`;
}

function formatCurrencyRange(min: number, max: number, formatCurrency: (v: number) => string): string {
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)}–${formatCurrency(max)}`;
}

function adjustRange(range: { min: number; max: number }, multiplier: number): { min: number; max: number } {
  return {
    min: Math.round(range.min * multiplier),
    max: Math.round(range.max * multiplier),
  };
}

export function ScenarioTargetsSection({ selectedScenario, formatCurrency }: ScenarioTargetsSectionProps) {
  const adjustment = SCENARIO_ADJUSTMENTS[selectedScenario.id] || SCENARIO_ADJUSTMENTS.balanced;
  
  // Calculate adjusted targets
  const targets = [
    {
      ...BASE_TARGETS.residential,
      quarterly: adjustRange(BASE_TARGETS.residential.baseQuarterly, adjustment.residential),
      annual: adjustRange(BASE_TARGETS.residential.baseAnnual, adjustment.residential),
      contribution: adjustRange(BASE_TARGETS.residential.baseContribution, adjustment.residential),
      emphasis: adjustment.residential > 1 ? "high" : adjustment.residential < 1 ? "low" : "normal",
    },
    {
      ...BASE_TARGETS.midCommercial,
      quarterly: adjustRange(BASE_TARGETS.midCommercial.baseQuarterly, adjustment.midCommercial),
      annual: adjustRange(BASE_TARGETS.midCommercial.baseAnnual, adjustment.midCommercial),
      contribution: adjustRange(BASE_TARGETS.midCommercial.baseContribution, adjustment.midCommercial),
      emphasis: adjustment.midCommercial > 1 ? "high" : adjustment.midCommercial < 1 ? "low" : "normal",
    },
    {
      ...BASE_TARGETS.largeCommercial,
      quarterly: adjustRange(BASE_TARGETS.largeCommercial.baseQuarterly, adjustment.largeCommercial),
      annual: adjustRange(BASE_TARGETS.largeCommercial.baseAnnual, adjustment.largeCommercial),
      contribution: adjustRange(BASE_TARGETS.largeCommercial.baseContribution, adjustment.largeCommercial),
      emphasis: adjustment.largeCommercial > 1 ? "high" : adjustment.largeCommercial < 1 ? "low" : "normal",
    },
    {
      ...BASE_TARGETS.religious,
      quarterly: adjustRange(BASE_TARGETS.religious.baseQuarterly, adjustment.religious),
      annual: adjustRange(BASE_TARGETS.religious.baseAnnual, adjustment.religious),
      contribution: adjustRange(BASE_TARGETS.religious.baseContribution, adjustment.religious),
      emphasis: adjustment.religious > 1 ? "high" : adjustment.religious < 1 ? "low" : "normal",
    },
  ];

  // Calculate totals
  const totalAnnualDeals = targets.reduce((sum, t) => sum + t.annual.min, 0);
  const totalAnnualDealsMax = targets.reduce((sum, t) => sum + t.annual.max, 0);
  const totalContributionMin = targets.reduce((sum, t) => sum + t.contribution.min, 0);
  const totalContributionMax = targets.reduce((sum, t) => sum + t.contribution.max, 0);

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Scenario Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedScenario.color }}
          />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {selectedScenario.name} Scenario Targets
            </h3>
            <p className="text-sm text-muted-foreground">{adjustment.description}</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            selectedScenario.riskLevel === "low" && "border-emerald-500 text-emerald-600",
            selectedScenario.riskLevel === "medium" && "border-primary text-primary",
            selectedScenario.riskLevel === "high" && "border-amber-500 text-amber-600"
          )}
        >
          {selectedScenario.riskLevel === "low" && "Conservative"}
          {selectedScenario.riskLevel === "medium" && "Balanced Risk"}
          {selectedScenario.riskLevel === "high" && "Higher Risk/Reward"}
        </Badge>
      </div>

      {/* Annual Target Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
              Scenario Contribution Target
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums whitespace-nowrap">
              {formatCurrencyRange(totalContributionMin, totalContributionMax, formatCurrency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Expected Deals</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {formatRange(totalAnnualDeals, totalAnnualDealsMax)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avg Deal Size</p>
            <p className="text-lg font-semibold text-foreground tabular-nums whitespace-nowrap">
              {formatCurrency(selectedScenario.avgDealSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Opportunity Targets Grid */}
      <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        Opportunity Mix for This Scenario
      </h4>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
        {targets.map((target) => {
          const Icon = target.icon;
          return (
            <div 
              key={target.title}
              className={cn(
                "p-4 rounded-lg border transition-all duration-200 relative",
                target.color,
                target.emphasis === "high" && "ring-2 ring-primary/30",
                target.emphasis === "low" && "opacity-70"
              )}
            >
              {target.emphasis === "high" && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Focus
                  </Badge>
                </div>
              )}
              {target.emphasis === "low" && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="secondary" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Reduced
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn("w-5 h-5", target.iconColor)} />
                <h4 className="font-semibold text-foreground">{target.title}</h4>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="p-2 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground">Typical Value</p>
                  <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {formatCurrencyRange(target.typicalValue.min, target.typicalValue.max, formatCurrency)}
                  </p>
                </div>
                <div className="p-2 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground">Quarterly</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatRange(target.quarterly.min, target.quarterly.max)}
                  </p>
                </div>
                <div className="p-2 rounded bg-background/50">
                  <p className="text-xs text-muted-foreground">Annual</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatRange(target.annual.min, target.annual.max)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground flex-1">{target.notes}</p>
                <p className="text-sm font-semibold text-foreground ml-2 whitespace-nowrap">
                  {formatCurrencyRange(target.contribution.min, target.contribution.max, formatCurrency)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Expectations - also adjusted by scenario */}
      <h4 className="text-md font-semibold text-foreground mb-4">Pipeline Expectations</h4>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Active Pipeline</p>
          <p className="text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
            {formatCurrency(Math.round(selectedScenario.totalVolume * 0.15))}–{formatCurrency(Math.round(selectedScenario.totalVolume * 0.22))}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Quarterly New</p>
          <p className="text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
            {formatCurrency(Math.round(selectedScenario.totalVolume * 0.18))}–{formatCurrency(Math.round(selectedScenario.totalVolume * 0.27))}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground mb-1">Quarterly Closed</p>
          <p className="text-xl font-bold text-foreground tabular-nums whitespace-nowrap">
            {formatCurrency(Math.round(selectedScenario.totalVolume * 0.22))}–{formatCurrency(Math.round(selectedScenario.totalVolume * 0.30))}
          </p>
        </div>
      </div>

      {/* Scenario Note */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/50">
        <p className="text-sm text-muted-foreground italic">
          {selectedScenario.closingNote}
        </p>
      </div>
    </div>
  );
}
