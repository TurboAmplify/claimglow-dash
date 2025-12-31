import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CommissionCheck {
  id: string;
  sales_commission_id: string;
  check_amount: number;
  received_date: string;
  deposited_date: string;
  check_number: string | null;
  notes: string | null;
  commission_earned: number;
  created_at: string;
  updated_at: string;
}

export function useCommissionChecks(salesCommissionId?: string) {
  return useQuery({
    queryKey: ["commission_checks", salesCommissionId],
    queryFn: async () => {
      let query = supabase
        .from("commission_checks")
        .select("*")
        .order("received_date", { ascending: false });

      if (salesCommissionId) {
        query = query.eq("sales_commission_id", salesCommissionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommissionCheck[];
    },
    enabled: !!salesCommissionId,
  });
}

export function useUpdateCommissionCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkId,
      updates,
      salesCommissionId,
      oldAmount,
      oldCommission,
    }: {
      checkId: string;
      updates: Partial<CommissionCheck>;
      salesCommissionId: string;
      oldAmount: number;
      oldCommission: number;
    }) => {
      // Update the check record
      const { error: checkError } = await supabase
        .from("commission_checks")
        .update(updates)
        .eq("id", checkId);

      if (checkError) throw checkError;

      // If amount changed, update the sales commission totals
      if (updates.check_amount !== undefined) {
        const newAmount = updates.check_amount;
        const newCommission = updates.commission_earned || 0;
        const amountDiff = newAmount - oldAmount;
        const commissionDiff = newCommission - oldCommission;

        // Get current totals
        const { data: commission, error: fetchError } = await supabase
          .from("sales_commissions")
          .select("insurance_checks_ytd, commissions_paid, revised_estimate")
          .eq("id", salesCommissionId)
          .single();

        if (fetchError) throw fetchError;

        const newTotalChecks = (commission.insurance_checks_ytd || 0) + amountDiff;
        const newCommissionsPaid = (commission.commissions_paid || 0) + commissionDiff;
        const newRemainder = Math.max(0, (commission.revised_estimate || 0) - newTotalChecks);

        const { error: updateError } = await supabase
          .from("sales_commissions")
          .update({
            insurance_checks_ytd: newTotalChecks,
            commissions_paid: newCommissionsPaid,
            new_remainder: newRemainder,
            updated_at: new Date().toISOString(),
          })
          .eq("id", salesCommissionId);

        if (updateError) throw updateError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_checks"] });
      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      toast({
        title: "Check updated",
        description: "The check record has been updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating check:", error);
      toast({
        title: "Error",
        description: "Failed to update check. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCommissionCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checkId,
      salesCommissionId,
      checkAmount,
      commissionEarned,
    }: {
      checkId: string;
      salesCommissionId: string;
      checkAmount: number;
      commissionEarned: number;
    }) => {
      // Delete the check record
      const { error: deleteError } = await supabase
        .from("commission_checks")
        .delete()
        .eq("id", checkId);

      if (deleteError) throw deleteError;

      // Update the sales commission totals
      const { data: commission, error: fetchError } = await supabase
        .from("sales_commissions")
        .select("insurance_checks_ytd, commissions_paid, revised_estimate")
        .eq("id", salesCommissionId)
        .single();

      if (fetchError) throw fetchError;

      const newTotalChecks = Math.max(0, (commission.insurance_checks_ytd || 0) - checkAmount);
      const newCommissionsPaid = Math.max(0, (commission.commissions_paid || 0) - commissionEarned);
      const newRemainder = Math.max(0, (commission.revised_estimate || 0) - newTotalChecks);

      const { error: updateError } = await supabase
        .from("sales_commissions")
        .update({
          insurance_checks_ytd: newTotalChecks,
          commissions_paid: newCommissionsPaid,
          new_remainder: newRemainder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", salesCommissionId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_checks"] });
      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      toast({
        title: "Check deleted",
        description: "The check record has been removed.",
      });
    },
    onError: (error) => {
      console.error("Error deleting check:", error);
      toast({
        title: "Error",
        description: "Failed to delete check. Please try again.",
        variant: "destructive",
      });
    },
  });
}
