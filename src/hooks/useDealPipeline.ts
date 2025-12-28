import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PipelineDeal {
  id: string;
  salesperson_id: string;
  client_name: string;
  expected_value: number;
  expected_close_date: string;
  stage: string;
  probability: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewPipelineDeal {
  salesperson_id: string;
  client_name: string;
  expected_value: number;
  expected_close_date: string;
  stage?: string;
  probability?: number;
  notes?: string;
}

export function useDealPipeline(salespersonId?: string) {
  const queryClient = useQueryClient();

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ["deal-pipeline", salespersonId],
    queryFn: async () => {
      let query = supabase
        .from("deal_pipeline")
        .select("*")
        .order("expected_close_date", { ascending: true });

      if (salespersonId) {
        query = query.eq("salesperson_id", salespersonId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PipelineDeal[];
    },
    enabled: !!salespersonId,
  });

  const addDealMutation = useMutation({
    mutationFn: async (deal: NewPipelineDeal) => {
      const { data, error } = await supabase
        .from("deal_pipeline")
        .insert(deal)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-pipeline"] });
      toast.success("Deal added to pipeline");
    },
    onError: (error) => {
      console.error("Error adding deal:", error);
      toast.error("Failed to add deal");
    },
  });

  const updateDealMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PipelineDeal> }) => {
      const { data, error } = await supabase
        .from("deal_pipeline")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-pipeline"] });
      toast.success("Deal updated");
    },
    onError: (error) => {
      console.error("Error updating deal:", error);
      toast.error("Failed to update deal");
    },
  });

  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("deal_pipeline")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-pipeline"] });
      toast.success("Deal removed from pipeline");
    },
    onError: (error) => {
      console.error("Error deleting deal:", error);
      toast.error("Failed to remove deal");
    },
  });

  const convertToCommissionMutation = useMutation({
    mutationFn: async (deal: PipelineDeal) => {
      // Insert into sales_commissions
      const { error: insertError } = await supabase
        .from("sales_commissions")
        .insert({
          salesperson_id: deal.salesperson_id,
          client_name: deal.client_name,
          initial_estimate: deal.expected_value,
          date_signed: new Date().toISOString().split("T")[0],
          year: new Date().getFullYear(),
          status: "open",
        });
      if (insertError) throw insertError;

      // Delete from pipeline
      const { error: deleteError } = await supabase
        .from("deal_pipeline")
        .delete()
        .eq("id", deal.id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["sales-commissions"] });
      toast.success("Deal converted to commission record");
    },
    onError: (error) => {
      console.error("Error converting deal:", error);
      toast.error("Failed to convert deal");
    },
  });

  return {
    deals: deals || [],
    isLoading,
    error,
    addDeal: addDealMutation.mutate,
    updateDeal: updateDealMutation.mutate,
    deleteDeal: deleteDealMutation.mutate,
    convertToCommission: convertToCommissionMutation.mutate,
    isAdding: addDealMutation.isPending,
    isUpdating: updateDealMutation.isPending,
    isDeleting: deleteDealMutation.isPending,
    isConverting: convertToCommissionMutation.isPending,
  };
}
