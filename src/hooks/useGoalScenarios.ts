import { useState, useMemo } from "react";

export interface DealMix {
  large: number;
  medium: number;
  small: number;
}

export interface QuarterlyPlan {
  q1: DealMix;
  q2: DealMix;
  q3: DealMix;
  q4: DealMix;
}

export type RiskLevel = "low" | "moderate" | "high";

export interface DealMixScenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  priorities: string[];
  assumptions: string[];
  riskLevel: RiskLevel;
  quarters: QuarterlyPlan;
  totalVolume: number;
  totalDeals: number;
  isActive: boolean;
  isTemplate: boolean;
}

export interface CompletedDeal {
  quarter: 'q1' | 'q2' | 'q3' | 'q4';
  size: 'large' | 'medium' | 'small';
  actualValue?: number;
}

// Deal size ranges based on historical data
export const DEAL_SIZES = {
  large: { min: 5000000, max: 10000000, avg: 7000000, label: "Large ($5M+)", color: "amber" },
  medium: { min: 1000000, max: 2000000, avg: 1500000, label: "Medium ($1M-$2M)", color: "emerald" },
  small: { min: 350000, max: 750000, avg: 550000, label: "Small ($350K-$750K)", color: "cyan" },
} as const;

export const SCENARIO_TEMPLATES: Omit<DealMixScenario, 'totalVolume' | 'totalDeals' | 'isActive'>[] = [
  {
    id: "base-reference",
    name: "Base Reference",
    subtitle: "Control Scenario",
    description: "Balanced execution based on historical performance, realistic opportunity flow, and disciplined activity across all verticals. Residential provides steady pipeline momentum, while mid-size commercial and large commercial/industrial opportunities form the backbone of annual production.",
    priorities: [
      "Consistent monthly activity",
      "Balanced verticals execution",
      "Historical pattern alignment"
    ],
    assumptions: [
      "No extraordinary market disruption",
      "Normal variability in claim timing and size",
      "Consistent monthly activity levels"
    ],
    riskLevel: "moderate",
    isTemplate: true,
    quarters: {
      q1: { large: 1, medium: 3, small: 8 },
      q2: { large: 1, medium: 3, small: 8 },
      q3: { large: 2, medium: 3, small: 8 },
      q4: { large: 1, medium: 3, small: 8 },
    },
  },
  {
    id: "conservative",
    name: "Conservative",
    subtitle: "Defensive Execution",
    description: "Assumes a softer commercial and industrial environment with fewer large-loss opportunities. Focus shifts toward residential volume and smaller institutional opportunities to maintain overall production while protecting downside.",
    priorities: [
      "Stability over upside",
      "Consistent activity during slower periods",
      "Protecting downside while staying positioned"
    ],
    assumptions: [
      "Softer commercial/industrial market",
      "Fewer large-loss opportunities materialize",
      "Residential volume offsets reduced large-loss flow"
    ],
    riskLevel: "low",
    isTemplate: true,
    quarters: {
      q1: { large: 0, medium: 2, small: 10 },
      q2: { large: 1, medium: 2, small: 10 },
      q3: { large: 1, medium: 3, small: 10 },
      q4: { large: 0, medium: 2, small: 10 },
    },
  },
  {
    id: "balanced",
    name: "Balanced",
    subtitle: "Base-Plus Performance",
    description: "Strong but realistic execution of the 2026 strategy. Opportunity flow improves modestly across all categories. Residential volume remains healthy, commercial converts solidly, and religious organizations contribute meaningfully through disciplined outreach.",
    priorities: [
      "High consistency in outreach and follow-through",
      "Effective relationship leverage",
      "Strong CRM discipline and pipeline management"
    ],
    assumptions: [
      "Modest improvement in opportunity flow",
      "Strong conversion rates",
      "Disciplined outreach execution"
    ],
    riskLevel: "moderate",
    isTemplate: true,
    quarters: {
      q1: { large: 1, medium: 3, small: 8 },
      q2: { large: 2, medium: 3, small: 8 },
      q3: { large: 2, medium: 4, small: 8 },
      q4: { large: 2, medium: 3, small: 8 },
    },
  },
  {
    id: "commercial-heavy",
    name: "Commercial Heavy",
    subtitle: "High-Value Focus",
    description: "Successful capture of multiple high-value commercial and industrial losses, resulting in significantly higher average deal sizes. Residential volume decreases as time shifts toward fewer, larger opportunities with campus-style or multi-building claims.",
    priorities: [
      "Deep relationship leverage",
      "Patience and timing",
      "Strategic focus on fewer, higher-impact opportunities"
    ],
    assumptions: [
      "Multiple high-value opportunities close",
      "Strong industrial/commercial market",
      "Successful capture of large claims"
    ],
    riskLevel: "high",
    isTemplate: true,
    quarters: {
      q1: { large: 2, medium: 2, small: 4 },
      q2: { large: 3, medium: 2, small: 4 },
      q3: { large: 3, medium: 3, small: 4 },
      q4: { large: 2, medium: 2, small: 4 },
    },
  },
  {
    id: "volume-institutional",
    name: "Volume + Institutional",
    subtitle: "Diversified Model",
    description: "Prioritizes breadth, consistency, and resilience. Residential volume increases and institutional opportunities—particularly churches and schools—become a major driver. Total production achieved through a diversified mix rather than large individual deals.",
    priorities: [
      "Strong systems and organization",
      "High-touch relationship management",
      "Consistent weekly and monthly activity"
    ],
    assumptions: [
      "Institutional pipeline converts well",
      "Diversified mix reduces volatility",
      "Volume compensates for fewer large deals"
    ],
    riskLevel: "low",
    isTemplate: true,
    quarters: {
      q1: { large: 1, medium: 4, small: 10 },
      q2: { large: 1, medium: 4, small: 10 },
      q3: { large: 1, medium: 5, small: 10 },
      q4: { large: 1, medium: 4, small: 10 },
    },
  },
  {
    id: "custom",
    name: "Custom",
    subtitle: "User-Defined",
    description: "Build your own deal mix for each quarter based on your unique market insight and strategic priorities.",
    priorities: ["User-defined priorities"],
    assumptions: ["User-defined assumptions"],
    riskLevel: "moderate",
    isTemplate: true,
    quarters: {
      q1: { large: 0, medium: 0, small: 0 },
      q2: { large: 0, medium: 0, small: 0 },
      q3: { large: 0, medium: 0, small: 0 },
      q4: { large: 0, medium: 0, small: 0 },
    },
  },
];

export function calculateScenarioTotals(quarters: QuarterlyPlan) {
  let totalVolume = 0;
  let totalDeals = 0;

  const quarterKeys = ['q1', 'q2', 'q3', 'q4'] as const;
  
  quarterKeys.forEach((q) => {
    const quarter = quarters[q];
    totalDeals += quarter.large + quarter.medium + quarter.small;
    totalVolume += 
      quarter.large * DEAL_SIZES.large.avg +
      quarter.medium * DEAL_SIZES.medium.avg +
      quarter.small * DEAL_SIZES.small.avg;
  });

  return { totalVolume, totalDeals };
}

export function calculateQuarterVolume(mix: DealMix) {
  return (
    mix.large * DEAL_SIZES.large.avg +
    mix.medium * DEAL_SIZES.medium.avg +
    mix.small * DEAL_SIZES.small.avg
  );
}

export function calculateQuarterDeals(mix: DealMix) {
  return mix.large + mix.medium + mix.small;
}

export function useGoalScenarios(targetRevenue: number = 55000000) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>("base-reference");
  const [customQuarters, setCustomQuarters] = useState<QuarterlyPlan>({
    q1: { large: 1, medium: 2, small: 2 },
    q2: { large: 1, medium: 2, small: 2 },
    q3: { large: 1, medium: 2, small: 2 },
    q4: { large: 1, medium: 2, small: 2 },
  });
  const [completedDeals, setCompletedDeals] = useState<CompletedDeal[]>([]);

  const scenarios = useMemo(() => {
    return SCENARIO_TEMPLATES.map((template) => {
      const quarters = template.id === "custom" ? customQuarters : template.quarters;
      const { totalVolume, totalDeals } = calculateScenarioTotals(quarters);
      
      return {
        ...template,
        quarters,
        totalVolume,
        totalDeals,
        isActive: template.id === activeScenarioId,
      };
    });
  }, [activeScenarioId, customQuarters]);

  const activeScenario = useMemo(() => {
    return scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  const quarterlyProgress = useMemo(() => {
    const progress = {
      q1: { planned: calculateQuarterVolume(activeScenario.quarters.q1), completed: 0, deals: { planned: calculateQuarterDeals(activeScenario.quarters.q1), completed: 0 } },
      q2: { planned: calculateQuarterVolume(activeScenario.quarters.q2), completed: 0, deals: { planned: calculateQuarterDeals(activeScenario.quarters.q2), completed: 0 } },
      q3: { planned: calculateQuarterVolume(activeScenario.quarters.q3), completed: 0, deals: { planned: calculateQuarterDeals(activeScenario.quarters.q3), completed: 0 } },
      q4: { planned: calculateQuarterVolume(activeScenario.quarters.q4), completed: 0, deals: { planned: calculateQuarterDeals(activeScenario.quarters.q4), completed: 0 } },
    };

    completedDeals.forEach((deal) => {
      const value = deal.actualValue || DEAL_SIZES[deal.size].avg;
      progress[deal.quarter].completed += value;
      progress[deal.quarter].deals.completed += 1;
    });

    return progress;
  }, [activeScenario, completedDeals]);

  const ytdProgress = useMemo(() => {
    const totalPlanned = Object.values(quarterlyProgress).reduce((sum, q) => sum + q.planned, 0);
    const totalCompleted = Object.values(quarterlyProgress).reduce((sum, q) => sum + q.completed, 0);
    const totalDealsPlanned = Object.values(quarterlyProgress).reduce((sum, q) => sum + q.deals.planned, 0);
    const totalDealsCompleted = Object.values(quarterlyProgress).reduce((sum, q) => sum + q.deals.completed, 0);

    return {
      totalPlanned,
      totalCompleted,
      totalDealsPlanned,
      totalDealsCompleted,
      percentComplete: totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0,
      gapToGoal: targetRevenue - totalCompleted,
    };
  }, [quarterlyProgress, targetRevenue]);

  const updateCustomQuarter = (quarter: keyof QuarterlyPlan, mix: DealMix) => {
    setCustomQuarters((prev) => ({
      ...prev,
      [quarter]: mix,
    }));
  };

  const markDealComplete = (deal: CompletedDeal) => {
    setCompletedDeals((prev) => [...prev, deal]);
  };

  const removeDeal = (index: number) => {
    setCompletedDeals((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    scenarios,
    activeScenario,
    activeScenarioId,
    setActiveScenarioId,
    customQuarters,
    updateCustomQuarter,
    completedDeals,
    markDealComplete,
    removeDeal,
    quarterlyProgress,
    ytdProgress,
    targetRevenue,
    DEAL_SIZES,
  };
}
