import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DealBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  avgDealSize: number;
  avgFeePercent: number;
}

interface DealSizeAnalysis {
  buckets: DealBucket[];
  overallAvgDealSize: number;
  overallAvgFeePercent: number;
  totalDeals: number;
  getInsightsForTargetDealSize: (avgDealSize: number) => {
    bucket: DealBucket | null;
    suggestedFeePercent: number;
    isRealistic: boolean;
    historicalAvgForBucket: number;
  };
  getDealMixEstimate: (targetDeals: number, targetRevenue: number) => {
    residential: number;
    residentialPlus: number;
    midCommercial: number;
    largeCommercial: number;
    industrial: number;
    mega: number;
    avgDealSize: number;
  };
}

// Business-aligned deal size buckets based on actual historical data
const DEAL_BUCKETS = [
  { label: "Residential", min: 0, max: 350000 },              // Standard residential claims
  { label: "Residential+", min: 350000, max: 750000 },        // High-end residential
  { label: "Mid-Commercial", min: 750000, max: 1500000 },     // Mid-size commercial
  { label: "Large Commercial", min: 1500000, max: 3000000 },  // Large commercial
  { label: "Industrial", min: 3000000, max: 7500000 },        // Industrial / large-loss
  { label: "Mega", min: 7500000, max: Infinity },             // Mega deals $7.5M+
];

export function useDealSizeAnalysis(): {
  analysis: DealSizeAnalysis | null;
  isLoading: boolean;
} {
  const { data: commissions, isLoading } = useQuery({
    queryKey: ["deal-size-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("initial_estimate, fee_percentage")
        .not("initial_estimate", "is", null)
        .not("fee_percentage", "is", null)
        .gt("initial_estimate", 0);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (isLoading || !commissions) {
    return { analysis: null, isLoading };
  }

  // Calculate bucket statistics
  const buckets: DealBucket[] = DEAL_BUCKETS.map((bucket) => {
    const dealsInBucket = commissions.filter(
      (c) => (c.initial_estimate ?? 0) >= bucket.min && (c.initial_estimate ?? 0) < bucket.max
    );

    const count = dealsInBucket.length;
    const avgDealSize =
      count > 0
        ? dealsInBucket.reduce((sum, d) => sum + (d.initial_estimate ?? 0), 0) / count
        : 0;
    const avgFeePercent =
      count > 0
        ? dealsInBucket.reduce((sum, d) => sum + (d.fee_percentage ?? 0), 0) / count
        : 0;

    return {
      label: bucket.label,
      min: bucket.min,
      max: bucket.max,
      count,
      avgDealSize,
      avgFeePercent,
    };
  });

  // Calculate overall statistics
  const totalDeals = commissions.length;
  const overallAvgDealSize =
    commissions.reduce((sum, c) => sum + (c.initial_estimate ?? 0), 0) / totalDeals;
  const overallAvgFeePercent =
    commissions.reduce((sum, c) => sum + (c.fee_percentage ?? 0), 0) / totalDeals;

  // Function to get insights for a target deal size
  const getInsightsForTargetDealSize = (avgDealSize: number) => {
    const bucket = buckets.find(
      (b) => avgDealSize >= b.min && avgDealSize < b.max
    );

    if (!bucket || bucket.count === 0) {
      return {
        bucket: null,
        suggestedFeePercent: overallAvgFeePercent,
        isRealistic: true,
        historicalAvgForBucket: overallAvgDealSize,
      };
    }

    // Check if the target is realistic based on historical data
    const isRealistic = bucket.count >= 5; // Need at least 5 deals in bucket to be confident

    return {
      bucket,
      suggestedFeePercent: bucket.avgFeePercent,
      isRealistic,
      historicalAvgForBucket: bucket.avgDealSize,
    };
  };

  // Function to estimate deal mix based on targets - aligned with business buckets
  const getDealMixEstimate = (targetDeals: number, targetRevenue: number) => {
    const avgDealSize = targetRevenue / (targetDeals || 1);

    // Weight distribution based on realistic deal size ranges for this business
    // Most deals are Residential to Mid-Commercial range
    let weights = { 
      residential: 0.35,      // <$350K
      residentialPlus: 0.25,  // $350K-$750K
      midCommercial: 0.20,    // $750K-$1.5M
      largeCommercial: 0.12,  // $1.5M-$3M
      industrial: 0.05,       // $3M-$7.5M
      mega: 0.03              // $7.5M+
    };

    if (avgDealSize < 350000) {
      // Smaller avg = more residential deals
      weights = { residential: 0.55, residentialPlus: 0.25, midCommercial: 0.12, largeCommercial: 0.05, industrial: 0.02, mega: 0.01 };
    } else if (avgDealSize < 750000) {
      // Mix of residential and residential+
      weights = { residential: 0.30, residentialPlus: 0.40, midCommercial: 0.18, largeCommercial: 0.08, industrial: 0.03, mega: 0.01 };
    } else if (avgDealSize < 1500000) {
      // Targeting mid-commercial range
      weights = { residential: 0.20, residentialPlus: 0.25, midCommercial: 0.35, largeCommercial: 0.12, industrial: 0.05, mega: 0.03 };
    } else if (avgDealSize < 3000000) {
      // Large commercial focus
      weights = { residential: 0.10, residentialPlus: 0.15, midCommercial: 0.25, largeCommercial: 0.30, industrial: 0.15, mega: 0.05 };
    } else if (avgDealSize < 7500000) {
      // Industrial/large-loss focus
      weights = { residential: 0.05, residentialPlus: 0.10, midCommercial: 0.15, largeCommercial: 0.25, industrial: 0.35, mega: 0.10 };
    } else {
      // Mega deal focus (very rare)
      weights = { residential: 0.03, residentialPlus: 0.07, midCommercial: 0.10, largeCommercial: 0.20, industrial: 0.30, mega: 0.30 };
    }

    return {
      residential: Math.round(targetDeals * weights.residential),
      residentialPlus: Math.round(targetDeals * weights.residentialPlus),
      midCommercial: Math.round(targetDeals * weights.midCommercial),
      largeCommercial: Math.round(targetDeals * weights.largeCommercial),
      industrial: Math.round(targetDeals * weights.industrial),
      mega: Math.round(targetDeals * weights.mega),
      avgDealSize,
    };
  };

  return {
    analysis: {
      buckets,
      overallAvgDealSize,
      overallAvgFeePercent,
      totalDeals,
      getInsightsForTargetDealSize,
      getDealMixEstimate,
    },
    isLoading,
  };
}
