import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdjusterSummary } from "@/types/claims";

interface CommissionRecord {
  adjuster: string | null;
  office: string | null;
  initial_estimate: number | null;
  revised_estimate: number | null;
}

export function useAdjusterCommissionSummaries() {
  return useQuery({
    queryKey: ["adjuster-commission-summaries"],
    queryFn: async (): Promise<AdjusterSummary[]> => {
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("adjuster, office, initial_estimate, revised_estimate")
        .not("adjuster", "is", null);

      if (error) throw error;

      // Group by adjuster
      const adjusterMap = new Map<string, CommissionRecord[]>();
      (data || []).forEach((record) => {
        if (!record.adjuster) return;
        const key = record.adjuster.toLowerCase().trim();
        const existing = adjusterMap.get(key) || [];
        adjusterMap.set(key, [...existing, record]);
      });

      // Calculate summaries
      return Array.from(adjusterMap.entries()).map(([key, records]) => {
        const totalEstimate = records.reduce((sum, r) => sum + (Number(r.initial_estimate) || 0), 0);
        const totalRevised = records.reduce((sum, r) => sum + (Number(r.revised_estimate) || 0), 0);
        const totalDollarDifference = totalRevised - totalEstimate;
        
        const percentChanges = records.map((r) => {
          const initial = Number(r.initial_estimate) || 0;
          const revised = Number(r.revised_estimate) || 0;
          return initial > 0 ? ((revised - initial) / initial) * 100 : 0;
        });
        const avgPercentChange = percentChanges.length > 0 
          ? percentChanges.reduce((sum, p) => sum + p, 0) / percentChanges.length 
          : 0;

        const positiveClaims = records.filter(r => 
          (Number(r.revised_estimate) || 0) > (Number(r.initial_estimate) || 0)
        );
        const negativeClaims = records.filter(r => 
          (Number(r.revised_estimate) || 0) < (Number(r.initial_estimate) || 0)
        );
        
        const positiveDifference = positiveClaims.reduce((sum, r) => 
          sum + ((Number(r.revised_estimate) || 0) - (Number(r.initial_estimate) || 0)), 0
        );
        const negativeDifference = negativeClaims.reduce((sum, r) => 
          sum + ((Number(r.revised_estimate) || 0) - (Number(r.initial_estimate) || 0)), 0
        );

        // Use the first record's adjuster name (preserve original casing)
        const adjusterName = records[0]?.adjuster || key;
        // Get most common office
        const officeCounts = new Map<string, number>();
        records.forEach(r => {
          if (r.office) {
            const normalized = r.office.toLowerCase() === 'h' ? 'Houston' :
                              r.office.toLowerCase() === 'd' ? 'Dallas' :
                              r.office.toLowerCase() === 'houston' ? 'Houston' :
                              r.office.toLowerCase() === 'dallas' ? 'Dallas' : r.office;
            officeCounts.set(normalized, (officeCounts.get(normalized) || 0) + 1);
          }
        });
        let office: string | null = null;
        let maxCount = 0;
        officeCounts.forEach((count, off) => {
          if (count > maxCount) {
            maxCount = count;
            office = off;
          }
        });

        return {
          adjuster: adjusterName,
          office,
          totalClaims: records.length,
          totalEstimate,
          totalRevised,
          avgPercentChange,
          totalDollarDifference,
          positiveClaims: positiveClaims.length,
          negativeClaims: negativeClaims.length,
          positiveDifference,
          negativeDifference,
          claims: [], // Not needed for display
        };
      });
    },
  });
}
