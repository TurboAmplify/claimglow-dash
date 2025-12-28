import { useState, useMemo, useCallback } from "react";

export interface PlanInputs {
  targetRevenue: number;
  targetCommission: number;
  avgFeePercent: number;
  commissionPercent: number;
}

export interface ScenarioPath {
  id: string;
  name: string;
  subtitle: string;
  description: string;
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
  targetRevenue: 55000000,
  targetCommission: 825000,
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
    const { targetRevenue, avgFeePercent, commissionPercent } = planInputs;
    
    // Calculate company fee and commission based on volume
    const calcCommission = (volume: number) => {
      const companyFee = volume * (avgFeePercent / 100);
      return companyFee * (commissionPercent / 100);
    };

    // Scenario 1: High-Volume Path (45-50 deals, smaller avg size)
    const highVolumeDealCount = 48;
    const highVolumeAvgSize = targetRevenue / highVolumeDealCount;
    const highVolumeScenario: ScenarioPath = {
      id: "high-volume",
      name: "High-Volume Path",
      subtitle: "More Deals, Consistent Pipeline",
      description: "Focus on a higher number of smaller to medium deals. Lower individual risk with steadier cash flow throughout the year. Requires consistent prospecting activity and relationship maintenance.",
      riskLevel: "low",
      dealCount: highVolumeDealCount,
      avgDealSize: highVolumeAvgSize,
      totalVolume: targetRevenue,
      projectedCommission: calcCommission(targetRevenue),
      quarterlyBreakdown: {
        q1: { deals: Math.round(highVolumeDealCount * QUARTERLY_WEIGHTS.q1), volume: targetRevenue * QUARTERLY_WEIGHTS.q1 },
        q2: { deals: Math.round(highVolumeDealCount * QUARTERLY_WEIGHTS.q2), volume: targetRevenue * QUARTERLY_WEIGHTS.q2 },
        q3: { deals: Math.round(highVolumeDealCount * QUARTERLY_WEIGHTS.q3), volume: targetRevenue * QUARTERLY_WEIGHTS.q3 },
        q4: { deals: Math.round(highVolumeDealCount * QUARTERLY_WEIGHTS.q4), volume: targetRevenue * QUARTERLY_WEIGHTS.q4 },
      },
      keyAssumptions: [
        "48 deals averaging ~$1.15M each",
        "Mix of residential and small commercial",
        "Consistent weekly prospecting activity",
        "Strong CRM discipline required",
        "Lower variance, steadier income",
      ],
      color: "hsl(142, 76%, 36%)", // emerald
    };

    // Scenario 2: Balanced Path (30-35 deals, medium avg size)
    const balancedDealCount = 33;
    const balancedAvgSize = targetRevenue / balancedDealCount;
    const balancedScenario: ScenarioPath = {
      id: "balanced",
      name: "Balanced Path",
      subtitle: "Moderate Deals, Solid Execution",
      description: "A balanced approach combining mid-size commercial opportunities with select large deals. Matches historical performance patterns with improved execution.",
      riskLevel: "medium",
      dealCount: balancedDealCount,
      avgDealSize: balancedAvgSize,
      totalVolume: targetRevenue,
      projectedCommission: calcCommission(targetRevenue),
      quarterlyBreakdown: {
        q1: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q1), volume: targetRevenue * QUARTERLY_WEIGHTS.q1 },
        q2: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q2), volume: targetRevenue * QUARTERLY_WEIGHTS.q2 },
        q3: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q3), volume: targetRevenue * QUARTERLY_WEIGHTS.q3 },
        q4: { deals: Math.round(balancedDealCount * QUARTERLY_WEIGHTS.q4), volume: targetRevenue * QUARTERLY_WEIGHTS.q4 },
      },
      keyAssumptions: [
        "33 deals averaging ~$1.67M each",
        "Mix of commercial and institutional",
        "Quarterly impact deals required",
        "Relationship leverage essential",
        "Moderate variance, proven approach",
      ],
      color: "hsl(var(--primary))", // primary blue
    };

    // Scenario 3: High-Value Path (18-25 deals, larger avg size)
    const highValueDealCount = 22;
    const highValueAvgSize = targetRevenue / highValueDealCount;
    const highValueScenario: ScenarioPath = {
      id: "high-value",
      name: "High-Value Path",
      subtitle: "Fewer Deals, Bigger Opportunities",
      description: "Pursue fewer but significantly larger commercial and industrial opportunities. Requires patience, deep relationships, and ability to close high-value deals.",
      riskLevel: "high",
      dealCount: highValueDealCount,
      avgDealSize: highValueAvgSize,
      totalVolume: targetRevenue,
      projectedCommission: calcCommission(targetRevenue),
      quarterlyBreakdown: {
        q1: { deals: Math.round(highValueDealCount * 0.15), volume: targetRevenue * 0.15 },
        q2: { deals: Math.round(highValueDealCount * 0.25), volume: targetRevenue * 0.25 },
        q3: { deals: Math.round(highValueDealCount * 0.35), volume: targetRevenue * 0.35 },
        q4: { deals: Math.round(highValueDealCount * 0.25), volume: targetRevenue * 0.25 },
      },
      keyAssumptions: [
        "22 deals averaging ~$2.5M each",
        "Focus on large commercial/industrial",
        "Pre-loss relationship positioning",
        "Back-loaded deal flow expected",
        "Higher variance, higher potential",
      ],
      color: "hsl(45, 93%, 47%)", // amber
    };

    return [highVolumeScenario, balancedScenario, highValueScenario];
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
