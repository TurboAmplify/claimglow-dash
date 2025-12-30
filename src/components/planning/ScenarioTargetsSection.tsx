import { Home, Building2, Factory, Church, Target, TrendingUp, AlertTriangle, Compass } from "lucide-react";
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
  
  // Calculate scenario-based deal distribution using actual scenario values
  const totalScenarioDeals = selectedScenario.dealCount;
  const totalScenarioVolume = selectedScenario.totalVolume;
  
  // Distribute deals across categories based on scenario adjustments
  // Base distribution: Residential 50%, Mid-Commercial 20%, Large Commercial 20%, Religious 10%
  const baseDistribution = {
    residential: 0.50,
    midCommercial: 0.20,
    largeCommercial: 0.20,
    religious: 0.10,
  };
  
  // Apply scenario adjustments to distribution
  const adjustedDistribution = {
    residential: baseDistribution.residential * adjustment.residential,
    midCommercial: baseDistribution.midCommercial * adjustment.midCommercial,
    largeCommercial: baseDistribution.largeCommercial * adjustment.largeCommercial,
    religious: baseDistribution.religious * adjustment.religious,
  };
  
  // Normalize to ensure they add up to 1
  const totalWeight = Object.values(adjustedDistribution).reduce((a, b) => a + b, 0);
  const normalizedDistribution = {
    residential: adjustedDistribution.residential / totalWeight,
    midCommercial: adjustedDistribution.midCommercial / totalWeight,
    largeCommercial: adjustedDistribution.largeCommercial / totalWeight,
    religious: adjustedDistribution.religious / totalWeight,
  };
  
  // Calculate adjusted targets based on scenario's actual deals and volume
  const targets = [
    {
      ...BASE_TARGETS.residential,
      quarterly: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.residential / 4 * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.residential / 4 * 1.2) 
      },
      annual: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.residential * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.residential * 1.2) 
      },
      contribution: { 
        min: Math.round(totalScenarioVolume * normalizedDistribution.residential * 0.8), 
        max: Math.round(totalScenarioVolume * normalizedDistribution.residential * 1.2) 
      },
      emphasis: adjustment.residential > 1 ? "high" : adjustment.residential < 1 ? "low" : "normal",
    },
    {
      ...BASE_TARGETS.midCommercial,
      quarterly: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.midCommercial / 4 * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.midCommercial / 4 * 1.2) 
      },
      annual: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.midCommercial * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.midCommercial * 1.2) 
      },
      contribution: { 
        min: Math.round(totalScenarioVolume * normalizedDistribution.midCommercial * 0.8), 
        max: Math.round(totalScenarioVolume * normalizedDistribution.midCommercial * 1.2) 
      },
      emphasis: adjustment.midCommercial > 1 ? "high" : adjustment.midCommercial < 1 ? "low" : "normal",
    },
    {
      ...BASE_TARGETS.largeCommercial,
      quarterly: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.largeCommercial / 4 * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.largeCommercial / 4 * 1.2) 
      },
      annual: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.largeCommercial * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.largeCommercial * 1.2) 
      },
      contribution: { 
        min: Math.round(totalScenarioVolume * normalizedDistribution.largeCommercial * 0.8), 
        max: Math.round(totalScenarioVolume * normalizedDistribution.largeCommercial * 1.2) 
      },
      emphasis: adjustment.largeCommercial > 1 ? "high" : adjustment.largeCommercial < 1 ? "low" : "normal",
    },
    {
      ...BASE_TARGETS.religious,
      quarterly: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.religious / 4 * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.religious / 4 * 1.2) 
      },
      annual: { 
        min: Math.round(totalScenarioDeals * normalizedDistribution.religious * 0.8), 
        max: Math.round(totalScenarioDeals * normalizedDistribution.religious * 1.2) 
      },
      contribution: { 
        min: Math.round(totalScenarioVolume * normalizedDistribution.religious * 0.8), 
        max: Math.round(totalScenarioVolume * normalizedDistribution.religious * 1.2) 
      },
      emphasis: adjustment.religious > 1 ? "high" : adjustment.religious < 1 ? "low" : "normal",
    },
  ];

  // Calculate totals from the scenario's actual values
  const totalAnnualDeals = Math.round(totalScenarioDeals * 0.9);
  const totalAnnualDealsMax = Math.round(totalScenarioDeals * 1.1);
  const totalContributionMin = Math.round(totalScenarioVolume * 0.9);
  const totalContributionMax = Math.round(totalScenarioVolume * 1.1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Active Scenario Banner */}
      <div 
        className="p-4 rounded-xl border-2 flex items-center gap-4"
        style={{ 
          borderColor: selectedScenario.color,
          background: `linear-gradient(135deg, ${selectedScenario.color}15, ${selectedScenario.color}05)`
        }}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: selectedScenario.color }}
        >
          <Compass className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Currently Viewing Targets For
          </p>
          <h2 className="text-xl font-bold text-foreground truncate">
            {selectedScenario.name} Path
          </h2>
        </div>
        <Badge 
          className={cn(
            "shrink-0",
            selectedScenario.riskLevel === "low" && "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
            selectedScenario.riskLevel === "medium" && "bg-primary/20 text-primary border-primary/30",
            selectedScenario.riskLevel === "high" && "bg-amber-500/20 text-amber-600 border-amber-500/30"
          )}
        >
          {selectedScenario.riskLevel === "low" && "Conservative"}
          {selectedScenario.riskLevel === "medium" && "Balanced Risk"}
          {selectedScenario.riskLevel === "high" && "Higher Risk/Reward"}
        </Badge>
      </div>

      <div className="glass-card p-6">
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
    </div>
  );
}
