import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Claim, AdjusterSummary, OfficeSummary, DashboardStats } from "@/types/claims";

export function useClaims() {
  return useQuery({
    queryKey: ["claims"],
    queryFn: async (): Promise<Claim[]> => {
      const { data, error } = await supabase
        .from("claims_2025")
        .select("*")
        .order("date_signed", { ascending: false });

      if (error) throw error;
      return (data || []).map((claim) => ({
        ...claim,
        estimate_of_loss: Number(claim.estimate_of_loss) || 0,
        revised_estimate_of_loss: Number(claim.revised_estimate_of_loss) || 0,
        percent_change: Number(claim.percent_change) || 0,
        dollar_difference: Number(claim.dollar_difference) || 0,
        change_indicator: claim.change_indicator as 'increase' | 'decrease' | 'no_change',
      }));
    },
  });
}

export function useAdjusterSummaries(claims: Claim[] | undefined): AdjusterSummary[] {
  if (!claims) return [];

  const adjusterMap = new Map<string, Claim[]>();
  claims.forEach((claim) => {
    const existing = adjusterMap.get(claim.adjuster) || [];
    adjusterMap.set(claim.adjuster, [...existing, claim]);
  });

  return Array.from(adjusterMap.entries()).map(([adjuster, adjusterClaims]) => {
    const totalEstimate = adjusterClaims.reduce((sum, c) => sum + c.estimate_of_loss, 0);
    const totalRevised = adjusterClaims.reduce((sum, c) => sum + c.revised_estimate_of_loss, 0);
    const avgPercentChange = adjusterClaims.reduce((sum, c) => sum + c.percent_change, 0) / adjusterClaims.length;
    const totalDollarDifference = adjusterClaims.reduce((sum, c) => sum + c.dollar_difference, 0);
    
    const positiveClaims = adjusterClaims.filter(c => c.dollar_difference > 0);
    const negativeClaims = adjusterClaims.filter(c => c.dollar_difference < 0);
    const positiveDifference = positiveClaims.reduce((sum, c) => sum + c.dollar_difference, 0);
    const negativeDifference = negativeClaims.reduce((sum, c) => sum + c.dollar_difference, 0);

    return {
      adjuster,
      office: adjusterClaims[0]?.office || null,
      totalClaims: adjusterClaims.length,
      totalEstimate,
      totalRevised,
      avgPercentChange,
      totalDollarDifference,
      positiveClaims: positiveClaims.length,
      negativeClaims: negativeClaims.length,
      positiveDifference,
      negativeDifference,
      claims: adjusterClaims,
    };
  });
}

export function useOfficeSummaries(claims: Claim[] | undefined): OfficeSummary[] {
  if (!claims) return [];

  const officeMap = new Map<string, Claim[]>();
  claims.forEach((claim) => {
    const office = claim.office || "Unassigned";
    const existing = officeMap.get(office) || [];
    officeMap.set(office, [...existing, claim]);
  });

  return Array.from(officeMap.entries()).map(([office, officeClaims]) => {
    const adjusters = [...new Set(officeClaims.map((c) => c.adjuster))];
    const avgPercentChange = officeClaims.reduce((sum, c) => sum + c.percent_change, 0) / officeClaims.length;
    const totalEstimate = officeClaims.reduce((sum, c) => sum + c.estimate_of_loss, 0);
    const totalRevised = officeClaims.reduce((sum, c) => sum + c.revised_estimate_of_loss, 0);

    return {
      office,
      adjusters,
      totalAdjusters: adjusters.length,
      totalClaims: officeClaims.length,
      avgPercentChange,
      totalEstimate,
      totalRevised,
    };
  });
}

export function useDashboardStats(claims: Claim[] | undefined): DashboardStats {
  if (!claims || claims.length === 0) {
    return {
      totalClaims: 0,
      totalAdjusters: 0,
      avgPercentChange: 0,
      officeCount: 0,
      totalEstimate: 0,
      totalRevised: 0,
    };
  }

  const adjusters = new Set(claims.map((c) => c.adjuster));
  const offices = new Set(claims.map((c) => c.office).filter(Boolean));
  const avgPercentChange = claims.reduce((sum, c) => sum + c.percent_change, 0) / claims.length;
  const totalEstimate = claims.reduce((sum, c) => sum + c.estimate_of_loss, 0);
  const totalRevised = claims.reduce((sum, c) => sum + c.revised_estimate_of_loss, 0);

  return {
    totalClaims: claims.length,
    totalAdjusters: adjusters.size,
    avgPercentChange,
    officeCount: offices.size,
    totalEstimate,
    totalRevised,
  };
}
