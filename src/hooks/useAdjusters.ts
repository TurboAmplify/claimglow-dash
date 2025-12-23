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
    mutationFn: async ({ id, name, office }: { id: string; name: string; office: string }) => {
      const { error } = await supabase
        .from("adjusters")
        .update({ name, full_name: name, office })
        .eq("id", id);

      if (error) throw error;
      return { id, name, office };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjusters"] });
    },
  });
}
