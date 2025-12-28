import { useMemo } from "react";
import { useSalespeople, useSalesCommissions, useYearSummaries } from "./useSalesCommissions";
import { useSalesPlan, SalesPlan } from "./useSalesPlan";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamMemberSelection } from "@/components/planning/TeamMemberFilter";

export interface TeamMetrics {
  totalTargetRevenue: number;
  totalTargetCommission: number;
  avgFeePercent: number;
  commissionPercent: number;
  memberCount: number;
  plans: SalesPlan[];
  actualCommissions: {
    totalVolume: number;
    totalDeals: number;
    totalCommission: number;
    monthlyBreakdown: Array<{ month: string; volume: number; deals: number }>;
  };
}

export function useTeamMetrics(selection: TeamMemberSelection, year: number) {
  const { data: salespeople } = useSalespeople();
  
  // Determine which IDs to fetch
  const effectiveIds = useMemo(() => {
    if (selection.mode === "team") {
      return salespeople?.map(sp => sp.id) || [];
    }
    return selection.selectedIds;
  }, [selection, salespeople]);

  // Fetch all plans for the selected members
  const { data: allPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ["team-plans", effectiveIds, year],
    queryFn: async () => {
      if (effectiveIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("sales_plans")
        .select("*")
        .in("salesperson_id", effectiveIds)
        .eq("year", year);
      
      if (error) throw error;
      return data as SalesPlan[];
    },
    enabled: effectiveIds.length > 0,
  });

  // Fetch all commissions for the selected members
  const { data: allCommissions, isLoading: loadingCommissions } = useQuery({
    queryKey: ["team-commissions", effectiveIds, year],
    queryFn: async () => {
      if (effectiveIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("*")
        .in("salesperson_id", effectiveIds)
        .eq("year", year);
      
      if (error) throw error;
      return data;
    },
    enabled: effectiveIds.length > 0,
  });

  // Aggregate metrics
  const teamMetrics = useMemo<TeamMetrics>(() => {
    const plans = allPlans || [];
    const commissions = allCommissions || [];
    
    // Aggregate plan targets
    const totalTargetRevenue = plans.reduce((sum, p) => sum + Number(p.target_revenue), 0);
    const totalTargetCommission = plans.reduce((sum, p) => sum + Number(p.target_commission), 0);
    
    // Average fee/commission percentages (weighted by target revenue or simple avg)
    const avgFeePercent = plans.length > 0
      ? plans.reduce((sum, p) => sum + Number(p.avg_fee_percent), 0) / plans.length
      : 7.5;
    const commissionPercent = plans.length > 0
      ? plans.reduce((sum, p) => sum + Number(p.commission_percent), 0) / plans.length
      : 20;

    // Aggregate actual commissions
    const totalVolume = commissions.reduce((sum, c) => sum + (Number(c.revised_estimate) || 0), 0);
    const totalDeals = commissions.length;
    const totalCommission = commissions.reduce((sum, c) => sum + (Number(c.commissions_paid) || 0), 0);

    // Monthly breakdown
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = monthNames.map((month, idx) => {
      const monthCommissions = commissions.filter(c => {
        if (!c.date_signed) return false;
        const date = new Date(c.date_signed);
        return date.getMonth() === idx;
      });
      return {
        month,
        volume: monthCommissions.reduce((sum, c) => sum + (Number(c.revised_estimate) || 0), 0),
        deals: monthCommissions.length,
      };
    });

    return {
      totalTargetRevenue,
      totalTargetCommission,
      avgFeePercent,
      commissionPercent,
      memberCount: effectiveIds.length,
      plans,
      actualCommissions: {
        totalVolume,
        totalDeals,
        totalCommission,
        monthlyBreakdown,
      },
    };
  }, [allPlans, allCommissions, effectiveIds]);

  return {
    metrics: teamMetrics,
    isLoading: loadingPlans || loadingCommissions,
    effectiveIds,
  };
}
