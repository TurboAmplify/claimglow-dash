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
    
    // Build a map of salesperson_id -> plan for quick lookup
    const plansByPerson = new Map(plans.map(p => [p.salesperson_id, p]));
    const goalsByPerson = new Map(goals.map(g => [g.salesperson_id, g]));
    
    // Aggregate targets by combining plan data (if available) with goal data (fallback)
    // This ensures members without plans still have their goals counted
    let totalTargetRevenue = 0;
    let totalTargetCommission = 0;
    let totalFeePercent = 0;
    let totalCommissionPercent = 0;
    let countWithRates = 0;
    
    effectiveIds.forEach(id => {
      const plan = plansByPerson.get(id);
      const goal = goalsByPerson.get(id);
      
      if (plan) {
        // Use plan data
        totalTargetRevenue += Number(plan.target_revenue) || 0;
        totalTargetCommission += Number(plan.target_commission) || 0;
        totalFeePercent += Number(plan.avg_fee_percent) || 7.5;
        totalCommissionPercent += Number(plan.commission_percent) || 20;
        countWithRates++;
      } else if (goal) {
        // Fall back to goal data, estimate commission
        const goalRevenue = Number(goal.target_revenue) || 0;
        totalTargetRevenue += goalRevenue;
        // Estimate commission using default rates (7.5% fee, 20% commission)
        totalTargetCommission += goalRevenue * 0.075 * 0.20;
        totalFeePercent += 7.5;
        totalCommissionPercent += 20;
        countWithRates++;
      }
    });
    
    const avgFeePercent = countWithRates > 0 ? totalFeePercent / countWithRates : 7.5;
    const commissionPercent = countWithRates > 0 ? totalCommissionPercent / countWithRates : 20;

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
