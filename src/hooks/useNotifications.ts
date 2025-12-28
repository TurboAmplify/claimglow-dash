import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  type: string;
  message: string;
  related_entity: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    name: string;
  };
}

export interface CreateNotificationInput {
  recipient_id: string;
  sender_id: string;
  type: string;
  message: string;
  related_entity?: string;
  related_id?: string;
}

export function useNotifications(recipientId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ["notifications", recipientId],
    queryFn: async () => {
      if (!recipientId) return [];
      
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          sender:salespeople!notifications_sender_id_fkey(name)
        `)
        .eq("recipient_id", recipientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!recipientId,
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const createNotification = useMutation({
    mutationFn: async (input: CreateNotificationInput) => {
      const { data, error } = await supabase
        .from("notifications")
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Error creating notification:", error);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", recipientId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!recipientId) return;
      
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("recipient_id", recipientId)
        .eq("is_read", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", recipientId] });
      toast.success("All notifications marked as read");
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    createNotification: createNotification.mutate,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
}

// Hook to get pending plan approvals for directors
export function usePendingApprovals() {
  const { data: pendingPlans, isLoading, error, refetch } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_plans")
        .select(`
          *,
          salesperson:salespeople!sales_plans_salesperson_id_fkey(id, name, email)
        `)
        .eq("approval_status", "pending_approval")
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return {
    pendingPlans,
    isLoading,
    error,
    refetch,
  };
}
