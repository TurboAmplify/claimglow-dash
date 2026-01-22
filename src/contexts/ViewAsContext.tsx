import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Salesperson {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
}

interface ViewAsContextType {
  viewingAs: Salesperson | null;
  setViewingAs: (person: Salesperson | null) => void;
  isViewingAsOther: boolean;
  effectiveSalesperson: Salesperson | null;
  teamMembers: Salesperson[];
  isDirector: boolean;
  clearViewAs: () => void;
}

const ViewAsContext = createContext<ViewAsContextType | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [viewingAs, setViewingAs] = useState<Salesperson | null>(null);

  // Fetch current user's salesperson record
  const { data: currentSalesperson } = useQuery({
    queryKey: ["current-salesperson-for-viewas", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from("salespeople")
        .select("id, name, role, email")
        .eq("email", user.email)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const isDirector = currentSalesperson?.role === "sales_director";

  // Fetch team members (for directors to view as)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-for-viewas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("id, name, role, email")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
    enabled: isDirector,
  });

  // Clear viewingAs when user logs out
  useEffect(() => {
    if (!user) {
      setViewingAs(null);
    }
  }, [user]);

  const clearViewAs = () => setViewingAs(null);

  // The effective salesperson is either who we're viewing as, or the current user
  const effectiveSalesperson = viewingAs || currentSalesperson || null;
  const isViewingAsOther = viewingAs !== null;

  return (
    <ViewAsContext.Provider
      value={{
        viewingAs,
        setViewingAs,
        isViewingAsOther,
        effectiveSalesperson,
        teamMembers,
        isDirector,
        clearViewAs,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (context === undefined) {
    throw new Error("useViewAs must be used within a ViewAsProvider");
  }
  return context;
}
