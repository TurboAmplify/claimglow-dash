import { useMemo } from "react";
import { SalesCommission } from "@/types/sales";

export interface HistoricalPatterns {
  // Opportunity size bands
  sizeBands: {
    largeResidential: { min: number; max: number; avgSize: number; count: number; totalVolume: number };
    midCommercial: { min: number; max: number; avgSize: number; count: number; totalVolume: number };
    largeCommercial: { min: number; max: number; avgSize: number; count: number; totalVolume: number };
    religious: { min: number; max: number; avgSize: number; count: number; totalVolume: number };
  };
  // Monthly patterns
  monthlyPatterns: Array<{
    month: number;
    monthName: string;
    avgDeals: number;
    avgVolume: number;
    avgDealSize: number;
  }>;
  // Quarterly patterns
  quarterlyPatterns: Array<{
    quarter: number;
    avgDeals: number;
    avgVolume: number;
    percentOfYear: number;
  }>;
  // Yearly performance
  yearlyPerformance: Array<{
    year: number;
    totalDeals: number;
    totalVolume: number;
    avgDealSize: number;
  }>;
  // Overall stats
  overallStats: {
    avgDealSize: number;
    medianDealSize: number;
    avgDealsPerYear: number;
    avgVolumePerYear: number;
    bestYear: number;
    bestYearVolume: number;
  };
}

export interface ScenarioProjection {
  id: string;
  name: string;
  description: string;
  isHistoricallyProven: boolean;
  monthlyProjections: Array<{
    month: number;
    monthName: string;
    projectedDeals: number;
    projectedVolume: number;
    cumulativeVolume: number;
  }>;
  summary: {
    totalDeals: number;
    avgDealSize: number;
    totalVolume: number;
    keyAssumptions: string[];
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useRoadmapAnalysis(commissions: SalesCommission[] | undefined, targetRevenue: number = 55000000) {
  const historicalPatterns = useMemo<HistoricalPatterns | null>(() => {
    if (!commissions || commissions.length === 0) return null;

    // Categorize by size bands
    const categorized = commissions.reduce((acc, c) => {
      const size = c.revised_estimate || c.initial_estimate || 0;
      if (size >= 350000 && size < 1000000) {
        acc.largeResidential.push(c);
      } else if (size >= 1000000 && size < 5000000) {
        acc.midCommercial.push(c);
      } else if (size >= 5000000) {
        acc.largeCommercial.push(c);
      } else {
        acc.other.push(c);
      }
      return acc;
    }, { largeResidential: [] as SalesCommission[], midCommercial: [] as SalesCommission[], largeCommercial: [] as SalesCommission[], other: [] as SalesCommission[] });

    const calcBandStats = (items: SalesCommission[]) => {
      if (items.length === 0) return { min: 0, max: 0, avgSize: 0, count: 0, totalVolume: 0 };
      const sizes = items.map(c => c.revised_estimate || c.initial_estimate || 0);
      return {
        min: Math.min(...sizes),
        max: Math.max(...sizes),
        avgSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
        count: items.length,
        totalVolume: sizes.reduce((a, b) => a + b, 0),
      };
    };

    // Monthly patterns
    const monthlyData = new Map<number, { deals: number[]; volumes: number[] }>();
    commissions.forEach(c => {
      if (!c.date_signed) return;
      const month = new Date(c.date_signed).getMonth() + 1;
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { deals: [], volumes: [] });
      }
      const data = monthlyData.get(month)!;
      data.deals.push(1);
      data.volumes.push(c.revised_estimate || c.initial_estimate || 0);
    });

    // Get unique years for averaging
    const yearsSet = new Set(commissions.map(c => c.year).filter(Boolean));
    const numYears = yearsSet.size || 1;

    const monthlyPatterns = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const data = monthlyData.get(month) || { deals: [], volumes: [] };
      const totalDeals = data.deals.length;
      const totalVolume = data.volumes.reduce((a, b) => a + b, 0);
      return {
        month,
        monthName: MONTHS[i],
        avgDeals: totalDeals / numYears,
        avgVolume: totalVolume / numYears,
        avgDealSize: totalDeals > 0 ? totalVolume / totalDeals : 0,
      };
    });

    // Quarterly patterns
    const quarterlyPatterns = [1, 2, 3, 4].map(q => {
      const monthsInQuarter = [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];
      const qData = monthsInQuarter.reduce((acc, m) => {
        const mp = monthlyPatterns.find(mp => mp.month === m);
        if (mp) {
          acc.deals += mp.avgDeals;
          acc.volume += mp.avgVolume;
        }
        return acc;
      }, { deals: 0, volume: 0 });
      return {
        quarter: q,
        avgDeals: qData.deals,
        avgVolume: qData.volume,
        percentOfYear: 0, // calculated below
      };
    });

    const totalYearlyVolume = quarterlyPatterns.reduce((a, q) => a + q.avgVolume, 0);
    quarterlyPatterns.forEach(q => {
      q.percentOfYear = totalYearlyVolume > 0 ? (q.avgVolume / totalYearlyVolume) * 100 : 25;
    });

    // Yearly performance
    const yearlyMap = new Map<number, { deals: number; volume: number }>();
    commissions.forEach(c => {
      const year = c.year;
      if (!year) return;
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { deals: 0, volume: 0 });
      }
      const data = yearlyMap.get(year)!;
      data.deals += 1;
      data.volume += c.revised_estimate || c.initial_estimate || 0;
    });

    const yearlyPerformance = Array.from(yearlyMap.entries())
      .map(([year, data]) => ({
        year,
        totalDeals: data.deals,
        totalVolume: data.volume,
        avgDealSize: data.deals > 0 ? data.volume / data.deals : 0,
      }))
      .sort((a, b) => a.year - b.year);

    // Overall stats
    const allSizes = commissions.map(c => c.revised_estimate || c.initial_estimate || 0).filter(s => s > 0);
    const sortedSizes = [...allSizes].sort((a, b) => a - b);
    const medianDealSize = sortedSizes.length > 0 
      ? sortedSizes[Math.floor(sortedSizes.length / 2)] 
      : 0;

    const totalVolume = allSizes.reduce((a, b) => a + b, 0);
    const totalDeals = allSizes.length;
    const bestYearData = yearlyPerformance.reduce((best, y) => 
      y.totalVolume > best.totalVolume ? y : best, 
      { year: 0, totalVolume: 0, totalDeals: 0, avgDealSize: 0 }
    );

    return {
      sizeBands: {
        largeResidential: calcBandStats(categorized.largeResidential),
        midCommercial: calcBandStats(categorized.midCommercial),
        largeCommercial: calcBandStats(categorized.largeCommercial),
        religious: { min: 1000000, max: 5000000, avgSize: 0, count: 0, totalVolume: 0 }, // Placeholder
      },
      monthlyPatterns,
      quarterlyPatterns,
      yearlyPerformance,
      overallStats: {
        avgDealSize: totalDeals > 0 ? totalVolume / totalDeals : 0,
        medianDealSize,
        avgDealsPerYear: totalDeals / numYears,
        avgVolumePerYear: totalVolume / numYears,
        bestYear: bestYearData.year,
        bestYearVolume: bestYearData.totalVolume,
      },
    };
  }, [commissions]);

  const scenarios = useMemo<ScenarioProjection[]>(() => {
    if (!historicalPatterns) return [];

    const { monthlyPatterns, quarterlyPatterns, overallStats } = historicalPatterns;

    // Helper to generate monthly projections
    const generateMonthlyProjections = (
      dealDistribution: number[],
      volumeDistribution: number[]
    ) => {
      let cumulative = 0;
      return dealDistribution.map((deals, i) => {
        const volume = volumeDistribution[i];
        cumulative += volume;
        return {
          month: i + 1,
          monthName: MONTHS[i],
          projectedDeals: deals,
          projectedVolume: volume,
          cumulativeVolume: cumulative,
        };
      });
    };

    // Scenario A: Steady Residential + Commercial (based on historical monthly patterns)
    const scenarioADeals = monthlyPatterns.map(m => Math.round(m.avgDeals * (targetRevenue / overallStats.avgVolumePerYear)));
    const avgDealSizeA = overallStats.avgDealSize;
    const totalDealsA = scenarioADeals.reduce((a, b) => a + b, 0);
    const monthlyVolumeA = scenarioADeals.map(d => d * avgDealSizeA);
    const scaleFactor = targetRevenue / monthlyVolumeA.reduce((a, b) => a + b, 0);
    const scaledVolumeA = monthlyVolumeA.map(v => v * scaleFactor);

    const scenarioA: ScenarioProjection = {
      id: 'steady-residential',
      name: 'Steady Residential + Commercial',
      description: 'Emphasizes large residential losses supported by mid-commercial opportunities with a smooth accumulation curve based on historical cadence.',
      isHistoricallyProven: true,
      monthlyProjections: generateMonthlyProjections(
        scenarioADeals,
        scaledVolumeA
      ),
      summary: {
        totalDeals: totalDealsA,
        avgDealSize: targetRevenue / totalDealsA,
        totalVolume: targetRevenue,
        keyAssumptions: [
          'Follows historical monthly distribution',
          'Consistent deal flow throughout the year',
          'Mix of $350K-$750K residential and $1M-$2M commercial',
        ],
      },
    };

    // Scenario B: Quarterly Impact (fewer deals, higher value)
    const quarterlyWeights = quarterlyPatterns.map(q => q.percentOfYear / 100);
    const totalDealsB = Math.ceil(targetRevenue / (overallStats.avgDealSize * 1.5)); // Larger deals
    const dealsPerQuarter = quarterlyWeights.map(w => Math.round(totalDealsB * w));
    const volumePerQuarter = quarterlyWeights.map(w => targetRevenue * w);
    
    // Distribute across months within quarters
    const scenarioBDeals: number[] = [];
    const scenarioBVolume: number[] = [];
    for (let q = 0; q < 4; q++) {
      const qDeals = dealsPerQuarter[q];
      const qVolume = volumePerQuarter[q];
      // Weight toward end of quarter for "impact" feel
      scenarioBDeals.push(Math.floor(qDeals * 0.2), Math.floor(qDeals * 0.3), Math.ceil(qDeals * 0.5));
      scenarioBVolume.push(qVolume * 0.2, qVolume * 0.3, qVolume * 0.5);
    }

    const scenarioB: ScenarioProjection = {
      id: 'quarterly-impact',
      name: 'Quarterly Impact',
      description: 'Fewer total opportunities with higher-value commercial or industrial losses. Step-function growth aligned with historical quarterly peaks.',
      isHistoricallyProven: true,
      monthlyProjections: generateMonthlyProjections(scenarioBDeals, scenarioBVolume),
      summary: {
        totalDeals: scenarioBDeals.reduce((a, b) => a + b, 0),
        avgDealSize: targetRevenue / scenarioBDeals.reduce((a, b) => a + b, 0),
        totalVolume: targetRevenue,
        keyAssumptions: [
          'Focus on $5M+ commercial/industrial opportunities',
          'Concentrated closings at quarter-end',
          'Fewer but larger deals',
        ],
      },
    };

    // Scenario C: Relationship-Driven / Pre-Loss
    const totalDealsC = Math.ceil(targetRevenue / (overallStats.avgDealSize * 2)); // Even larger avg
    const earlyMonthsFactor = [0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.10, 0.11, 0.12, 0.12, 0.11, 0.11];
    const scenarioCDeals = earlyMonthsFactor.map(f => Math.round(totalDealsC * f));
    const scenarioCVolume = earlyMonthsFactor.map(f => targetRevenue * f);

    const scenarioC: ScenarioProjection = {
      id: 'relationship-driven',
      name: 'Relationship-Driven / Pre-Loss',
      description: 'Higher percentage of positioned or pre-loss relationships. Larger average opportunity size with slower early accumulation but stronger later-year impact.',
      isHistoricallyProven: false,
      monthlyProjections: generateMonthlyProjections(scenarioCDeals, scenarioCVolume),
      summary: {
        totalDeals: scenarioCDeals.reduce((a, b) => a + b, 0),
        avgDealSize: targetRevenue / scenarioCDeals.reduce((a, b) => a + b, 0),
        totalVolume: targetRevenue,
        keyAssumptions: [
          'Leverage existing relationships for larger opportunities',
          'Pre-positioned for losses before they occur',
          'Back-loaded volume trajectory',
          '* Modeled estimate - limited historical data',
        ],
      },
    };

    // Scenario D: Hybrid / Adaptive
    const hybridWeights = monthlyPatterns.map(m => {
      // Blend historical with slight Q4 emphasis
      const historicalWeight = m.avgVolume / (overallStats.avgVolumePerYear || 1);
      const q4Boost = m.month >= 10 ? 1.15 : 1.0;
      return historicalWeight * q4Boost;
    });
    const totalHybridWeight = hybridWeights.reduce((a, b) => a + b, 0);
    const normalizedHybridWeights = hybridWeights.map(w => w / totalHybridWeight);
    
    const scenarioDVolume = normalizedHybridWeights.map(w => targetRevenue * w);
    const avgDealSizeD = overallStats.avgDealSize * 1.1; // Slightly optimized
    const scenarioDDeals = scenarioDVolume.map(v => Math.round(v / avgDealSizeD));

    const scenarioD: ScenarioProjection = {
      id: 'hybrid-adaptive',
      name: 'Hybrid / Adaptive',
      description: 'Blended scenario dynamically weighted using historical seasonality and opportunity mix. Adjusts expectations by quarter rather than evenly across months.',
      isHistoricallyProven: true,
      monthlyProjections: generateMonthlyProjections(scenarioDDeals, scenarioDVolume),
      summary: {
        totalDeals: scenarioDDeals.reduce((a, b) => a + b, 0),
        avgDealSize: avgDealSizeD,
        totalVolume: targetRevenue,
        keyAssumptions: [
          'Combines elements of all scenarios',
          'Weighted by historical seasonality',
          'Q4 conversion and positioning emphasis',
          'Most realistic path based on proven patterns',
        ],
      },
    };

    return [scenarioA, scenarioB, scenarioC, scenarioD];
  }, [historicalPatterns, targetRevenue]);

  return {
    historicalPatterns,
    scenarios,
    targetRevenue,
  };
}
