import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CurrentSalesperson {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  manager_id: string | null;
  is_active: boolean;
}

export function useCurrentSalesperson() {
  const { user } = useAuth();

  const { data: salesperson, isLoading, error } = useQuery({
    queryKey: ["current-salesperson", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      
      if (error) throw error;
      return data as CurrentSalesperson | null;
    },
    enabled: !!user?.email,
  });

  const isDirector = salesperson?.role === "sales_director";
  const isSalesRep = salesperson?.role === "sales_rep";

  return {
    salesperson,
    isLoading,
    error,
    isDirector,
    isSalesRep,
    isAuthenticated: !!user,
  };
}
