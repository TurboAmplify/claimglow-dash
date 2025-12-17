import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Salesperson } from "@/types/sales";

export function useTeamMembers(managerId?: string) {
  return useQuery({
    queryKey: ["team_members", managerId],
    enabled: !!managerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("manager_id", managerId!)
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Salesperson[];
    },
  });
}

export function useSalesDirector() {
  return useQuery({
    queryKey: ["sales_director"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("role", "sales_director")
        .maybeSingle();
      
      if (error) throw error;
      return data as Salesperson | null;
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, email, managerId }: { name: string; email?: string; managerId: string }) => {
      const { data, error } = await supabase
        .from("salespeople")
        .insert({
          name,
          email: email || null,
          manager_id: managerId,
          role: 'sales_rep',
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Salesperson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["salespeople"] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, email, is_active }: { id: string; name?: string; email?: string; is_active?: boolean }) => {
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      const { data, error } = await supabase
        .from("salespeople")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Salesperson;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["salespeople"] });
    },
  });
}
