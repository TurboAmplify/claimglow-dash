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

export interface DealMixScenario {
  id: string;
  name: string;
  description: string;
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
    id: "steady-flow",
    name: "Steady Flow",
    description: "1 large + 2 medium per quarter - consistent, predictable growth",
    isTemplate: true,
    quarters: {
      q1: { large: 1, medium: 2, small: 2 },
      q2: { large: 1, medium: 2, small: 2 },
      q3: { large: 1, medium: 2, small: 2 },
      q4: { large: 1, medium: 2, small: 2 },
    },
  },
  {
    id: "quarterly-impact",
    name: "Quarterly Impact",
    description: "1-2 large deals per quarter only - fewer deals, higher value",
    isTemplate: true,
    quarters: {
      q1: { large: 2, medium: 0, small: 0 },
      q2: { large: 2, medium: 0, small: 0 },
      q3: { large: 2, medium: 0, small: 0 },
      q4: { large: 2, medium: 0, small: 0 },
    },
  },
  {
    id: "heavy-h1",
    name: "Heavy H1",
    description: "Front-load the year with large deals in Q1 & Q2",
    isTemplate: true,
    quarters: {
      q1: { large: 2, medium: 2, small: 1 },
      q2: { large: 2, medium: 2, small: 1 },
      q3: { large: 1, medium: 1, small: 2 },
      q4: { large: 1, medium: 1, small: 2 },
    },
  },
  {
    id: "back-loaded",
    name: "Back-Loaded",
    description: "Light H1 for relationship building, heavy H2 for closing",
    isTemplate: true,
    quarters: {
      q1: { large: 0, medium: 2, small: 3 },
      q2: { large: 1, medium: 2, small: 2 },
      q3: { large: 2, medium: 2, small: 1 },
      q4: { large: 2, medium: 2, small: 1 },
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Build your own deal mix for each quarter",
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
  const [activeScenarioId, setActiveScenarioId] = useState<string>("steady-flow");
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
