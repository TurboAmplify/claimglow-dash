import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Adjuster {
  id: string;
  name: string;
  full_name: string | null;
  office: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAdjusters() {
  return useQuery({
    queryKey: ["adjusters"],
    queryFn: async (): Promise<Adjuster[]> => {
      const { data, error } = await supabase
        .from("adjusters")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateAdjuster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, office, oldName }: { id: string; name: string; office: string; oldName?: string }) => {
      // Update the adjusters table
      const { error: adjusterError } = await supabase
        .from("adjusters")
        .update({ name, full_name: name, office })
        .eq("id", id);

      if (adjusterError) throw adjusterError;

      // If the name changed, also update all matching sales_commissions records
      if (oldName && oldName !== name) {
        const { error: commissionsError } = await supabase
          .from("sales_commissions")
          .update({ adjuster: name })
          .eq("adjuster", oldName);

        if (commissionsError) {
          console.error("Failed to update commissions:", commissionsError);
          // Don't throw - the adjuster was updated, just log the commission sync issue
        }
      }

      // Also update office in commissions if it changed
      const officeCode = office.toLowerCase() === 'houston' ? 'H' : 
                         office.toLowerCase() === 'dallas' ? 'D' : office;
      const { error: officeError } = await supabase
        .from("sales_commissions")
        .update({ office: officeCode })
        .eq("adjuster", name);
      
      if (officeError) {
        console.error("Failed to update commission offices:", officeError);
      }

      return { id, name, office };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjusters"] });
      queryClient.invalidateQueries({ queryKey: ["adjuster-commission-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["sales-commissions"] });
    },
  });
}

export function useDeleteAdjuster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("adjusters")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjusters"] });
    },
  });
}
