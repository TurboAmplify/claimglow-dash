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
  closingNote: string;
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
    subtitle: "Core Planning Assumptions",
    description: "This scenario represents a balanced execution of the 2026 plan based on historical performance, realistic opportunity flow, and disciplined activity across all verticals. Residential provides steady pipeline momentum, while mid-size commercial and large commercial/industrial opportunities form the backbone of annual production. Religious organizations and schools supplement the pipeline through relationship-driven and situational opportunities.",
    closingNote: "This serves as the baseline against which all alternative scenarios are measured.",
    priorities: [
      "Consistent monthly activity",
      "No extraordinary market disruption",
      "Normal variability in claim timing and size"
    ],
    assumptions: [
      "Consistent monthly activity",
      "No extraordinary market disruption",
      "Normal variability in claim timing and size"
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
    description: "This scenario assumes a softer commercial and industrial environment, where fewer large-loss opportunities materialize or close. In response, focus shifts toward residential volume and smaller institutional opportunities to maintain overall production. Residential activity increases slightly to offset reduced large-loss flow. Religious organizations and schools contribute selectively, with an emphasis on preparedness rather than aggressive expansion.",
    closingNote: "This approach reduces reliance on high-risk, timing-dependent losses while maintaining forward momentum.",
    priorities: [
      "Stability over upside",
      "Consistent activity during slower periods",
      "Protecting the downside while staying positioned for unexpected opportunities"
    ],
    assumptions: [
      "Softer commercial/industrial environment",
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
    description: "This scenario reflects strong but realistic execution of the 2026 strategy. Opportunity flow improves modestly across all categories without requiring exceptional or rare losses. Residential volume remains healthy, commercial opportunities convert at a solid rate, and large commercial/industrial losses close as expected. Religious organizations and schools contribute meaningfully through disciplined outreach and follow-up.",
    closingNote: "This is the most representative model of a successful, well-executed year.",
    priorities: [
      "High consistency in outreach and follow-through",
      "Effective relationship leverage",
      "Strong CRM discipline and pipeline management"
    ],
    assumptions: [
      "Modest improvement in opportunity flow",
      "Strong conversion rates across categories",
      "Disciplined outreach and follow-up execution"
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
    name: "Commercial & Industrial Heavy",
    subtitle: "High-Value Outcome",
    description: "This scenario assumes successful capture of multiple high-value commercial and industrial losses, resulting in significantly higher average deal sizes and overall production. Residential volume decreases slightly as time and focus shift toward fewer, larger opportunities. Religious organizations and schools contribute through campus-style or multi-building claims rather than smaller single-structure losses.",
    closingNote: "While upside is substantial, this scenario is more sensitive to timing and conversion risk.",
    priorities: [
      "Deep relationship leverage",
      "Patience and timing",
      "Strategic focus on fewer, higher-impact opportunities"
    ],
    assumptions: [
      "Multiple high-value opportunities close successfully",
      "Strong industrial/commercial market conditions",
      "Successful capture of large multi-building claims"
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
    name: "Volume + Institutional Heavy",
    subtitle: "Diversified Model",
    description: "This scenario prioritizes breadth, consistency, and resilience. Residential volume increases, and institutional opportunities — particularly churches and schools — become a major driver of annual production. Large commercial and industrial opportunities remain present but are not the primary revenue driver. Instead, total production is achieved through a diversified mix of residential, religious, and educational facilities.",
    closingNote: "This model reduces dependency on any single deal type and provides strong protection against market volatility.",
    priorities: [
      "Strong systems and organization",
      "High-touch relationship management",
      "Consistent weekly and monthly activity"
    ],
    assumptions: [
      "Institutional pipeline converts consistently",
      "Diversified mix reduces overall volatility",
      "Volume compensates for fewer large individual deals"
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
    closingNote: "",
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
