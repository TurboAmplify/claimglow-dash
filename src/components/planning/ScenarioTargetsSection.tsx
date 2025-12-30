import { Home, Building2, Factory, Church, Target, TrendingUp, AlertTriangle, Compass } from "lucide-react";
import { ScenarioPath } from "@/hooks/usePlanScenarios";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScenarioTargetsSectionProps {
  selectedScenario: ScenarioPath;
  formatCurrency: (value: number) => string;
  planTargetRevenue?: number;
  planTargetDeals?: number;
  salespersonName?: string;
}

// Base targets - different profiles for director vs reps
const DIRECTOR_TARGETS = {
  residential: {
    title: "Residential",
    icon: Home,
    typicalValue: { min: 350000, max: 500000 },
    notes: "High-value total-loss or heavy-smoke homes; summer storms; high-income ZIP codes.",
    color: "bg-blue-500/10 border-blue-500/30",
    iconColor: "text-blue-600",
  },
  midCommercial: {
    title: "Mid-Size Commercial",
    icon: Building2,
    typicalValue: { min: 1000000, max: 1500000 },
    notes: "Schools, offices, restaurants, retail, multi-tenant properties.",
    color: "bg-green-500/10 border-green-500/30",
    iconColor: "text-green-600",
  },
  largeCommercial: {
    title: "Large Commercial/Industrial",
    icon: Factory,
    typicalValue: { min: 750000, max: 10000000 },
    notes: "Manufacturing, warehouses, automotive, distribution, regional chains.",
    color: "bg-amber-500/10 border-amber-500/30",
    iconColor: "text-amber-600",
  },
  religious: {
    title: "Religious Organizations",
    icon: Church,
    typicalValue: { min: 1000000, max: 5000000 },
    notes: "Large churches, temples, synagogues, mosques, ministries, retreat centers.",
    color: "bg-purple-500/10 border-purple-500/30",
    iconColor: "text-purple-600",
  },
};

const REP_TARGETS = {
  residential: {
    title: "Residential",
    icon: Home,
    typicalValue: { min: 200000, max: 400000 },
    notes: "Core focus area; consistent lead flow from referrals and prospecting.",
    color: "bg-blue-500/10 border-blue-500/30",
    iconColor: "text-blue-600",
  },
  midCommercial: {
    title: "Mid-Size Commercial",
    icon: Building2,
    typicalValue: { min: 500000, max: 1000000 },
    notes: "Local businesses, small offices, retail spaces, restaurants.",
    color: "bg-green-500/10 border-green-500/30",
    iconColor: "text-green-600",
  },
  largeCommercial: {
    title: "Large Commercial/Industrial",
    icon: Factory,
    typicalValue: { min: 500000, max: 2000000 },
    notes: "Opportunistic pursuit when relationships align.",
    color: "bg-amber-500/10 border-amber-500/30",
    iconColor: "text-amber-600",
  },
  religious: {
    title: "Religious Organizations",
    icon: Church,
    typicalValue: { min: 500000, max: 1000000 },
    notes: "Community churches, smaller religious facilities.",
    color: "bg-purple-500/10 border-purple-500/30",
    iconColor: "text-purple-600",
  },
};

// Scenario multipliers for director (commercial heavy)
const DIRECTOR_SCENARIO_ADJUSTMENTS: Record<string, {
  residential: number;
  midCommercial: number;
  largeCommercial: number;
  religious: number;
  description: string;
}> = {
  conservative: {
    residential: 1.2,
    midCommercial: 0.8,
    largeCommercial: 0.5,
    religious: 0.6,
    description: "Higher residential volume offsets reduced large-loss exposure",
  },
  balanced: {
    residential: 1.0,
    midCommercial: 1.0,
    largeCommercial: 1.0,
    religious: 1.0,
    description: "Balanced mix across all opportunity categories",
  },
  "commercial-heavy": {
    residential: 0.6,
    midCommercial: 1.2,
    largeCommercial: 1.5,
    religious: 1.3,
    description: "Focus on fewer, higher-value opportunities",
  },
};

// Scenario multipliers for reps (residential heavy)
const REP_SCENARIO_ADJUSTMENTS: Record<string, {
  residential: number;
  midCommercial: number;
  largeCommercial: number;
  religious: number;
  description: string;
}> = {
  conservative: {
    residential: 1.3,      // Volume approach - more residential
    midCommercial: 0.5,
    largeCommercial: 0.2,
    religious: 0.3,
    description: "High-activity approach with consistent residential volume",
  },
  balanced: {
    residential: 1.1,      // Still residential heavy
    midCommercial: 0.8,
    largeCommercial: 0.4,
    religious: 0.4,
    description: "Steady residential growth with selective commercial pursuit",
  },
  "commercial-heavy": {
    residential: 0.9,      // Value approach - slightly less residential
    midCommercial: 1.2,
    largeCommercial: 0.6,
    religious: 0.5,
    description: "Quality over quantity, focusing on higher-value opportunities",
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

export function ScenarioTargetsSection({ selectedScenario, formatCurrency, planTargetRevenue, planTargetDeals, salespersonName }: ScenarioTargetsSectionProps) {
  // Determine if this is a director or rep view
  const isDirector = salespersonName?.toLowerCase().includes('matt') || 
                     salespersonName?.toLowerCase().includes('aldrich') ||
                     salespersonName?.toLowerCase().includes('team') ||
                     salespersonName?.toLowerCase().includes('entire') ||
                     !salespersonName;
  
  const BASE_TARGETS = isDirector ? DIRECTOR_TARGETS : REP_TARGETS;
  const SCENARIO_ADJUSTMENTS = isDirector ? DIRECTOR_SCENARIO_ADJUSTMENTS : REP_SCENARIO_ADJUSTMENTS;
  
  // Map scenario IDs correctly - the scenario.id matches the adjustment keys
  const scenarioId = selectedScenario.id;
  const adjustment = SCENARIO_ADJUSTMENTS[scenarioId] || SCENARIO_ADJUSTMENTS.balanced;
  
  // Use plan values directly for the balanced scenario, otherwise use scenario values
  const isBalancedScenario = selectedScenario.id === "balanced";
  const totalScenarioDeals = isBalancedScenario && planTargetDeals ? planTargetDeals : selectedScenario.dealCount;
  const totalScenarioVolume = isBalancedScenario && planTargetRevenue ? planTargetRevenue : selectedScenario.totalVolume;
  
  // Different base distributions for director vs reps
  const baseDistribution = isDirector 
    ? {
        residential: 0.30,
        midCommercial: 0.20,
        largeCommercial: 0.35,
        religious: 0.15,
      }
    : {
        residential: 0.55,
        midCommercial: 0.25,
        largeCommercial: 0.12,
        religious: 0.08,
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

  // Use exact values from the plan - no ranges
  const totalAnnualDeals = totalScenarioDeals;
  const totalContribution = totalScenarioVolume;

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
          {selectedScenario.riskLevel === "medium" && "Balanced Path"}
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
              {formatCurrency(totalContribution)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Expected Deals</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">
              {totalAnnualDeals}
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
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <div className="p-2 rounded bg-background/50 flex flex-col justify-between min-h-[4.5rem]">
                  <p className="text-xs text-muted-foreground text-center">Typical Value</p>
                  <p className="text-xs sm:text-sm font-semibold text-foreground text-center leading-tight">
                    {formatCurrencyRange(target.typicalValue.min, target.typicalValue.max, formatCurrency)}
                  </p>
                </div>
                <div className="p-2 rounded bg-background/50 flex flex-col justify-between min-h-[4.5rem]">
                  <p className="text-xs text-muted-foreground text-center">Quarterly</p>
                  <p className="text-sm font-semibold text-foreground text-center">
                    {formatRange(target.quarterly.min, target.quarterly.max)}
                  </p>
                </div>
                <div className="p-2 rounded bg-background/50 flex flex-col justify-between min-h-[4.5rem]">
                  <p className="text-xs text-muted-foreground text-center">Annual</p>
                  <p className="text-sm font-semibold text-foreground text-center">
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
