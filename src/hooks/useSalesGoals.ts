import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesGoal } from "@/types/sales";

export function useSalesGoals(salespersonId?: string, year?: number) {
  return useQuery({
    queryKey: ["sales_goals", salespersonId, year],
    enabled: !!salespersonId,
    queryFn: async () => {
      let query = supabase
        .from("sales_goals")
        .select("*")
        .eq("salesperson_id", salespersonId!);
      
      // Only filter by year if explicitly provided
      if (year !== undefined) {
        query = query.eq("year", year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SalesGoal[];
    },
  });
}

export function useTeamGoals(managerId?: string, year?: number) {
  return useQuery({
    queryKey: ["team_goals", managerId, year],
    enabled: !!managerId,
    queryFn: async () => {
      // Get team members first
      const { data: teamMembers, error: teamError } = await supabase
        .from("salespeople")
        .select("id")
        .eq("manager_id", managerId!);
      
      if (teamError) throw teamError;
      
      // Include the manager's own ID in the team (for full team view)
      const teamIds = teamMembers?.map(t => t.id) || [];
      teamIds.push(managerId!);
      
      let query = supabase
        .from("sales_goals")
        .select("*")
        .in("salesperson_id", teamIds);
      
      if (year) {
        query = query.eq("year", year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SalesGoal[];
    },
  });
}

export function useSaveGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goal: Omit<SalesGoal, 'id' | 'created_at' | 'updated_at'>) => {
      // Try to upsert based on unique constraint (salesperson_id, year, goal_type)
      const { data, error } = await supabase
        .from("sales_goals")
        .upsert(
          {
            salesperson_id: goal.salesperson_id,
            year: goal.year,
            target_revenue: goal.target_revenue,
            target_deals: goal.target_deals,
            goal_type: goal.goal_type,
            notes: goal.notes,
          },
          { 
            onConflict: 'salesperson_id,year,goal_type',
          }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data as SalesGoal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_goals"] });
      queryClient.invalidateQueries({ queryKey: ["team_goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase
        .from("sales_goals")
        .delete()
        .eq("id", goalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_goals"] });
      queryClient.invalidateQueries({ queryKey: ["team_goals"] });
    },
  });
}
