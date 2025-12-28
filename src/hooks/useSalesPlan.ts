import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SalesPlan {
  id: string;
  salesperson_id: string;
  year: number;
  target_revenue: number;
  target_commission: number;
  avg_fee_percent: number;
  commission_percent: number;
  selected_scenario: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  approval_status: string;
  submitted_at: string | null;
  approved_at: string | null;
  reviewer_notes: string | null;
}

export interface SavePlanInput {
  salesperson_id: string;
  year: number;
  target_revenue: number;
  target_commission: number;
  avg_fee_percent: number;
  commission_percent: number;
  selected_scenario: string;
}

export function useSalesPlan(salespersonId: string | undefined, year: number) {
  const queryClient = useQueryClient();

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ["sales-plan", salespersonId, year],
    queryFn: async () => {
      if (!salespersonId) return null;
      
      const { data, error } = await supabase
        .from("sales_plans")
        .select("*")
        .eq("salesperson_id", salespersonId)
        .eq("year", year)
        .maybeSingle();
      
      if (error) throw error;
      return data as SalesPlan | null;
    },
    enabled: !!salespersonId,
  });

  const savePlanMutation = useMutation({
    mutationFn: async (input: SavePlanInput) => {
      const { data: existing } = await supabase
        .from("sales_plans")
        .select("id")
        .eq("salesperson_id", input.salesperson_id)
        .eq("year", input.year)
        .maybeSingle();

      if (existing) {
        // Update existing plan
        const { data, error } = await supabase
          .from("sales_plans")
          .update({
            target_revenue: input.target_revenue,
            target_commission: input.target_commission,
            avg_fee_percent: input.avg_fee_percent,
            commission_percent: input.commission_percent,
            selected_scenario: input.selected_scenario,
          })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new plan
        const { data, error } = await supabase
          .from("sales_plans")
          .insert({
            salesperson_id: input.salesperson_id,
            year: input.year,
            target_revenue: input.target_revenue,
            target_commission: input.target_commission,
            avg_fee_percent: input.avg_fee_percent,
            commission_percent: input.commission_percent,
            selected_scenario: input.selected_scenario,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-plan", salespersonId, year] });
      toast.success("Plan saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan. Please try again.");
    },
  });

  return {
    plan,
    isLoading,
    error,
    savePlan: savePlanMutation.mutate,
    isSaving: savePlanMutation.isPending,
  };
}
