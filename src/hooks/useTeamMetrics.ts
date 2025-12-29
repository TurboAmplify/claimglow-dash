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

  // Fetch all goals for the selected members (fallback when no plans exist)
  const { data: allGoals, isLoading: loadingGoals } = useQuery({
    queryKey: ["team-goals-metrics", effectiveIds, year],
    queryFn: async () => {
      if (effectiveIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("sales_goals")
        .select("*")
        .in("salesperson_id", effectiveIds)
        .eq("year", year);
      
      if (error) throw error;
      return data;
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
    const goals = allGoals || [];
    const commissions = allCommissions || [];
    
    // Aggregate plan targets - fall back to goals if no plans exist
    const totalTargetRevenue = plans.length > 0
      ? plans.reduce((sum, p) => sum + Number(p.target_revenue), 0)
      : goals.reduce((sum, g) => sum + Number(g.target_revenue || 0), 0);
    
    const totalTargetCommission = plans.length > 0
      ? plans.reduce((sum, p) => sum + Number(p.target_commission), 0)
      : totalTargetRevenue * 0.075 * 0.20; // Estimate based on default rates if no plans
    
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
  }, [allPlans, allGoals, allCommissions, effectiveIds]);

  return {
    metrics: teamMetrics,
    isLoading: loadingPlans || loadingGoals || loadingCommissions,
    effectiveIds,
  };
}
