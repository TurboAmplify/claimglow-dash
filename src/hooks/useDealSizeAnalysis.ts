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
    small: number;
    medium: number;
    large: number;
    veryLarge: number;
    enterprise: number;
    mega: number;
    avgDealSize: number;
  };
}

const DEAL_BUCKETS = [
  { label: "Small", min: 0, max: 25000 },
  { label: "Medium", min: 25000, max: 75000 },
  { label: "Large", min: 75000, max: 150000 },
  { label: "Very Large", min: 150000, max: 300000 },
  { label: "Enterprise", min: 300000, max: 500000 },
  { label: "Mega", min: 500000, max: Infinity },
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

  // Function to estimate deal mix based on targets
  const getDealMixEstimate = (targetDeals: number, targetRevenue: number) => {
    const avgDealSize = targetRevenue / (targetDeals || 1);

    // Weight the distribution based on target deal size with new granular buckets
    let weights = { small: 0.20, medium: 0.30, large: 0.25, veryLarge: 0.15, enterprise: 0.07, mega: 0.03 };

    if (avgDealSize < 25000) {
      weights = { small: 0.50, medium: 0.30, large: 0.12, veryLarge: 0.05, enterprise: 0.02, mega: 0.01 };
    } else if (avgDealSize < 75000) {
      weights = { small: 0.20, medium: 0.45, large: 0.20, veryLarge: 0.10, enterprise: 0.04, mega: 0.01 };
    } else if (avgDealSize < 150000) {
      weights = { small: 0.10, medium: 0.25, large: 0.40, veryLarge: 0.15, enterprise: 0.07, mega: 0.03 };
    } else if (avgDealSize < 300000) {
      weights = { small: 0.05, medium: 0.15, large: 0.25, veryLarge: 0.35, enterprise: 0.15, mega: 0.05 };
    } else if (avgDealSize < 500000) {
      weights = { small: 0.03, medium: 0.10, large: 0.15, veryLarge: 0.25, enterprise: 0.35, mega: 0.12 };
    } else {
      weights = { small: 0.02, medium: 0.05, large: 0.10, veryLarge: 0.18, enterprise: 0.25, mega: 0.40 };
    }

    return {
      small: Math.round(targetDeals * weights.small),
      medium: Math.round(targetDeals * weights.medium),
      large: Math.round(targetDeals * weights.large),
      veryLarge: Math.round(targetDeals * weights.veryLarge),
      enterprise: Math.round(targetDeals * weights.enterprise),
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
