import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePlanApproval() {
  const queryClient = useQueryClient();

  const submitForApproval = useMutation({
    mutationFn: async ({ planId, senderId, directorId }: { planId: string; senderId: string; directorId: string }) => {
      // Update plan status
      const { error: planError } = await supabase
        .from("sales_plans")
        .update({ 
          approval_status: "pending_approval",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", planId);
      
      if (planError) throw planError;

      // Create notification for director
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: directorId,
          sender_id: senderId,
          type: "plan_submitted",
          message: "has submitted their sales plan for approval",
          related_entity: "sales_plan",
          related_id: planId,
        });
      
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-plan"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Plan submitted for approval!");
    },
    onError: (error) => {
      console.error("Error submitting plan:", error);
      toast.error("Failed to submit plan. Please try again.");
    },
  });

  const approvePlan = useMutation({
    mutationFn: async ({ planId, salespersonId, directorId, notes }: { 
      planId: string; 
      salespersonId: string; 
      directorId: string;
      notes?: string;
    }) => {
      // Update plan status
      const { error: planError } = await supabase
        .from("sales_plans")
        .update({ 
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          reviewer_notes: notes,
        })
        .eq("id", planId);
      
      if (planError) throw planError;

      // Create notification for salesperson
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: salespersonId,
          sender_id: directorId,
          type: "plan_approved",
          message: "has approved your sales plan",
          related_entity: "sales_plan",
          related_id: planId,
        });
      
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-plan"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Plan approved!");
    },
    onError: (error) => {
      console.error("Error approving plan:", error);
      toast.error("Failed to approve plan.");
    },
  });

  const rejectPlan = useMutation({
    mutationFn: async ({ planId, salespersonId, directorId, notes }: { 
      planId: string; 
      salespersonId: string; 
      directorId: string;
      notes: string;
    }) => {
      // Update plan status
      const { error: planError } = await supabase
        .from("sales_plans")
        .update({ 
          approval_status: "rejected",
          reviewer_notes: notes,
        })
        .eq("id", planId);
      
      if (planError) throw planError;

      // Create notification for salesperson
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: salespersonId,
          sender_id: directorId,
          type: "plan_rejected",
          message: `has requested revisions on your sales plan: ${notes}`,
          related_entity: "sales_plan",
          related_id: planId,
        });
      
      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-plan"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Revision requested");
    },
    onError: (error) => {
      console.error("Error rejecting plan:", error);
      toast.error("Failed to request revision.");
    },
  });

  return {
    submitForApproval: submitForApproval.mutate,
    isSubmitting: submitForApproval.isPending,
    approvePlan: approvePlan.mutate,
    isApproving: approvePlan.isPending,
    rejectPlan: rejectPlan.mutate,
    isRejecting: rejectPlan.isPending,
  };
}
