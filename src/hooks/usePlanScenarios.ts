import { useState, useMemo, useCallback } from "react";

export interface PlanInputs {
  targetRevenue: number;
  targetCommission: number;
  targetDeals: number;
  avgFeePercent: number;
  commissionPercent: number;
}

export interface ScenarioPath {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  closingNote: string;
  riskLevel: "low" | "medium" | "high";
  dealCount: number;
  avgDealSize: number;
  totalVolume: number;
  projectedCommission: number;
  quarterlyBreakdown: {
    q1: { deals: number; volume: number };
    q2: { deals: number; volume: number };
    q3: { deals: number; volume: number };
    q4: { deals: number; volume: number };
  };
  keyAssumptions: string[];
  color: string;
}

const DEFAULT_PLAN: PlanInputs = {
  targetRevenue: 10000000, // Reasonable default, will be overridden by salesperson's goal
  targetCommission: 150000,
  targetDeals: 40,
  avgFeePercent: 7.5,
  commissionPercent: 20,
};

// Quarterly distribution weights based on typical sales patterns
const QUARTERLY_WEIGHTS = {
  q1: 0.20,
  q2: 0.25,
  q3: 0.30,
  q4: 0.25,
};

export function usePlanScenarios() {
  const [planInputs, setPlanInputs] = useState<PlanInputs>(DEFAULT_PLAN);

  const updatePlanInput = useCallback(<K extends keyof PlanInputs>(
    key: K, 
    value: PlanInputs[K]
  ) => {
    setPlanInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const scenarios = useMemo<ScenarioPath[]>(() => {
    const { targetCommission, avgFeePercent, commissionPercent } = planInputs;
    
    // Reverse calculate required volume from target commission
    // targetCommission = volume * (avgFeePercent/100) * (commissionPercent/100)
    // volume = targetCommission / (avgFeePercent/100) / (commissionPercent/100)
    const calcRequiredVolume = (commission: number) => {
      if (avgFeePercent === 0 || commissionPercent === 0) return 0;
      return commission / (avgFeePercent / 100) / (commissionPercent / 100);
    };

    const requiredVolume = calcRequiredVolume(targetCommission);

    // Scenario 1: Conservative / Defensive Execution - More deals, smaller avg size
    const conservativeDealCount = 48;
    const conservativeAvgSize = requiredVolume / conservativeDealCount;
    const conservativeScenario: ScenarioPath = {
      id: "conservative",
      name: "Conservative",
      subtitle: "Defensive Execution",
      description: "This scenario assumes a softer commercial and industrial environment, where fewer large-loss opportunities materialize or close. In response, focus shifts toward residential volume and smaller institutional opportunities to maintain overall production. Residential activity increases slightly to offset reduced large-loss flow. Religious organizations and schools contribute selectively, with an emphasis on preparedness rather than aggressive expansion.",
      closingNote: "This approach reduces reliance on high-risk, timing-dependent losses while maintaining forward momentum.",
      riskLevel: "low",
      dealCount: conservativeDealCount,
      avgDealSize: conservativeAvgSize,
      totalVolume: requiredVolume,
      projectedCommission: targetCommission,
      quarterlyBreakdown: {
        q1: { deals: Math.round(conservativeDealCount * QUARTERLY_WEIGHTS.q1), volume: requiredVolume * QUARTERLY_WEIGHTS.q1 },
        q2: { deals: Math.round(conservativeDealCount * QUARTERLY_WEIGHTS.q2), volume: requiredVolume * QUARTERLY_WEIGHTS.q2 },
        q3: { deals: Math.round(conservativeDealCount * QUARTERLY_WEIGHTS.q3), volume: requiredVolume * QUARTERLY_WEIGHTS.q3 },
        q4: { deals: Math.round(conservativeDealCount * QUARTERLY_WEIGHTS.q4), volume: requiredVolume * QUARTERLY_WEIGHTS.q4 },
      },
      keyAssumptions: [
        "Stability over upside",
        "Consistent activity during slower periods",
        "Protecting the downside while staying positioned for unexpected opportunities",
      ],
      color: "hsl(142, 76%, 36%)", // emerald
    };

    // Scenario 2: Balanced / Base-Plus Performance - Moderate deals, moderate avg size
    const balancedDealCount = 33;
    const balancedAvgSize = requiredVolume / balancedDealCount;
    const balancedScenario: ScenarioPath = {
      id: "balanced",
      name: "Balanced",
      subtitle: "Base-Plus Performance",
      description: "This scenario reflects strong but realistic execution of the 2026 strategy. Opportunity flow improves modestly across all categories without requiring exceptional or rare losses. Residential volume remains healthy, commercial opportunities convert at a solid rate, and large commercial/industrial losses close as expected. Religious organizations and schools contribute meaningfully through disciplined outreach and follow-up.",
      closingNote: "This is the most representative model of a successful, well-executed year.",
      riskLevel: "medium",
      dealCount: balancedDealCount,
      avgDealSize: balancedAvgSize,
      totalVolume: requiredVolume,
      projectedCommission: targetCommission,
      quarterlyBreakdown: {
        q1: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q1), volume: requiredVolume * QUARTERLY_WEIGHTS.q1 },
        q2: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q2), volume: requiredVolume * QUARTERLY_WEIGHTS.q2 },
        q3: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q3), volume: requiredVolume * QUARTERLY_WEIGHTS.q3 },
        q4: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q4), volume: requiredVolume * QUARTERLY_WEIGHTS.q4 },
      },
      keyAssumptions: [
        "High consistency in outreach and follow-through",
        "Effective relationship leverage",
        "Strong CRM discipline and pipeline management",
      ],
      color: "hsl(var(--primary))", // primary blue
    };

    // Scenario 3: Commercial & Industrial Heavy Outcome - Fewer deals, larger avg size
    const commercialHeavyDealCount = 22;
    const commercialHeavyAvgSize = requiredVolume / commercialHeavyDealCount;
    const commercialHeavyScenario: ScenarioPath = {
      id: "commercial-heavy",
      name: "Commercial & Industrial Heavy",
      subtitle: "High-Value Outcome",
      description: "This scenario assumes successful capture of multiple high-value commercial and industrial losses, resulting in significantly higher average deal sizes and overall production. Residential volume decreases slightly as time and focus shift toward fewer, larger opportunities. Religious organizations and schools contribute through campus-style or multi-building claims rather than smaller single-structure losses.",
      closingNote: "While upside is substantial, this scenario is more sensitive to timing and conversion risk.",
      riskLevel: "high",
      dealCount: commercialHeavyDealCount,
      avgDealSize: commercialHeavyAvgSize,
      totalVolume: requiredVolume,
      projectedCommission: targetCommission,
      quarterlyBreakdown: {
        q1: { deals: Math.round(commercialHeavyDealCount * 0.15), volume: requiredVolume * 0.15 },
        q2: { deals: Math.round(commercialHeavyDealCount * 0.25), volume: requiredVolume * 0.25 },
        q3: { deals: Math.round(commercialHeavyDealCount * 0.35), volume: requiredVolume * 0.35 },
        q4: { deals: Math.round(commercialHeavyDealCount * 0.25), volume: requiredVolume * 0.25 },
      },
      keyAssumptions: [
        "Deep relationship leverage",
        "Patience and timing",
        "Strategic focus on fewer, higher-impact opportunities",
      ],
      color: "hsl(45, 93%, 47%)", // amber
    };

    return [conservativeScenario, balancedScenario, commercialHeavyScenario];
  }, [planInputs]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("balanced");

  const selectedScenario = useMemo(() => {
    return scenarios.find(s => s.id === selectedScenarioId) || scenarios[1];
  }, [scenarios, selectedScenarioId]);

  // Monthly projections for chart
  const monthlyProjections = useMemo(() => {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Monthly weights within each quarter
    const monthlyWeights = [
      0.30, 0.35, 0.35,  // Q1
      0.30, 0.35, 0.35,  // Q2
      0.30, 0.35, 0.35,  // Q3
      0.30, 0.35, 0.35,  // Q4
    ];

    return MONTHS.map((monthName, i) => {
      const quarter = Math.floor(i / 3);
      const monthInQuarter = i % 3;
      const quarterKeys = ['q1', 'q2', 'q3', 'q4'] as const;
      
      const dataPoint: Record<string, number | string> = { month: monthName };
      
      scenarios.forEach(scenario => {
        const qData = scenario.quarterlyBreakdown[quarterKeys[quarter]];
        const monthlyVolume = qData.volume * monthlyWeights[i];
        
        // Calculate cumulative
        let cumulative = 0;
        for (let j = 0; j <= i; j++) {
          const prevQ = Math.floor(j / 3);
          const prevQData = scenario.quarterlyBreakdown[quarterKeys[prevQ]];
          cumulative += prevQData.volume * monthlyWeights[j];
        }
        
        dataPoint[scenario.id] = cumulative;
      });
      
      return dataPoint;
    });
  }, [scenarios]);

  return {
    planInputs,
    updatePlanInput,
    setPlanInputs,
    scenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedScenario,
    monthlyProjections,
  };
}
