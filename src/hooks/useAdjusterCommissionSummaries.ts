import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdjusterSummary } from "@/types/claims";

interface CommissionRecord {
  adjuster: string | null;
  office: string | null;
  initial_estimate: number | null;
  revised_estimate: number | null;
  year: number | null;
}

// Normalize adjuster name for matching - handles variations like "Daman G." matching "Daman Garrison"
function normalizeAdjusterName(name: string): string {
  return name.toLowerCase().trim()
    .replace(/\s+/g, ' ') // normalize whitespace
    .replace(/\.+$/, '') // remove trailing dots
    .replace(/\./g, ''); // remove all dots (e.g., "Daman G." -> "daman g")
}

// Get the first name from a full name
function getFirstName(name: string): string {
  return normalizeAdjusterName(name).split(' ')[0];
}

// Check if two names likely refer to the same person
function namesMatch(commissionName: string, registryName: string, registryFullName?: string | null): boolean {
  const n1 = normalizeAdjusterName(commissionName);
  const n2 = normalizeAdjusterName(registryName);
  const n3 = registryFullName ? normalizeAdjusterName(registryFullName) : null;
  
  // Exact match
  if (n1 === n2) return true;
  if (n3 && n1 === n3) return true;
  
  const parts1 = n1.split(' ');
  const firstName1 = parts1[0];
  
  // Single name in commission data - match by first name
  if (parts1.length === 1) {
    // Check if first names match
    if (getFirstName(registryName) === firstName1) return true;
    if (n3 && getFirstName(registryFullName!) === firstName1) return true;
    return false;
  }
  
  // Check if one is an abbreviation of the other
  // "Daman G" should match "Daman Garrison"
  const parts2 = n2.split(' ');
  const parts3 = n3?.split(' ') || [];
  
  // First name must match
  if (parts1[0] !== parts2[0] && parts1[0] !== parts3[0]) return false;
  
  // Check if second part is abbreviation (e.g., "g" for "garrison")
  if (parts1.length >= 2 && parts2.length >= 2) {
    const abbrev = parts1[1].replace(/\./g, '');
    if (abbrev.length <= 2 && parts2[1].startsWith(abbrev)) {
      return true;
    }
  }
  
  if (parts1.length >= 2 && parts3.length >= 2) {
    const abbrev = parts1[1].replace(/\./g, '');
    if (abbrev.length <= 2 && parts3[1].startsWith(abbrev)) {
      return true;
    }
  }
  
  // Also check Jeffrey/Jeff type variations
  // NOTE: Art and Artie are DIFFERENT people (Art Jansen and Artie Jansen), so they're excluded
  const nicknames: Record<string, string[]> = {
    'jeff': ['jeffrey', 'jeff'],
    'jeffrey': ['jeffrey', 'jeff'],
    'phil': ['philip', 'phillip', 'phil'],
    'philip': ['philip', 'phillip', 'phil'],
    'phillip': ['philip', 'phillip', 'phil'],
    'chris': ['christopher', 'chris'],
    'christopher': ['christopher', 'chris'],
    'dan': ['daniel', 'dan'],
    'daniel': ['daniel', 'dan'],
    // Art and Artie are separate individuals, NOT aliases
  };
  
  const nickGroup = nicknames[firstName1];
  if (nickGroup) {
    const regFirstName = getFirstName(registryName);
    const regFullFirstName = n3 ? getFirstName(registryFullName!) : null;
    if (nickGroup.includes(regFirstName)) return true;
    if (regFullFirstName && nickGroup.includes(regFullFirstName)) return true;
  }
  
  return false;
}

export function useAdjusterCommissionSummaries(selectedYears?: number[]) {
  return useQuery({
    queryKey: ["adjuster-commission-summaries", selectedYears],
    queryFn: async (): Promise<AdjusterSummary[]> => {
      let query = supabase
        .from("sales_commissions")
        .select("adjuster, office, initial_estimate, revised_estimate, year")
        .not("adjuster", "is", null);
      
      // Apply year filter if specified
      if (selectedYears && selectedYears.length > 0) {
        query = query.in("year", selectedYears);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Also fetch the canonical adjuster names from adjusters table
      const { data: adjustersData } = await supabase
        .from("adjusters")
        .select("name, full_name, office");
      
      const canonicalAdjusters = (adjustersData || []).map(a => ({
        name: a.name,
        fullName: a.full_name,
        office: a.office,
      }));

      // Group by canonical adjuster name
      const adjusterMap = new Map<string, { canonicalName: string; office: string | null; records: CommissionRecord[] }>();
      
      (data || []).forEach((record) => {
        if (!record.adjuster) return;
        
      // Find matching canonical adjuster
      const canonical = canonicalAdjusters.find(ca => 
        namesMatch(record.adjuster!, ca.name, ca.fullName)
      );
        
        const key = canonical 
          ? normalizeAdjusterName(canonical.name)
          : normalizeAdjusterName(record.adjuster);
        
        const canonicalName = canonical?.name || record.adjuster;
        const canonicalOffice = canonical?.office || null;
        
        const existing = adjusterMap.get(key);
        if (existing) {
          existing.records.push(record);
        } else {
          adjusterMap.set(key, {
            canonicalName,
            office: canonicalOffice,
            records: [record],
          });
        }
      });

      // Calculate summaries
      return Array.from(adjusterMap.values()).map(({ canonicalName, office, records }) => {
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

        // Normalize office from records if not set from canonical
        if (!office) {
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
          let maxCount = 0;
          officeCounts.forEach((count, off) => {
            if (count > maxCount) {
              maxCount = count;
              office = off;
            }
          });
        }

        return {
          adjuster: canonicalName,
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
          claims: [],
        };
      });
    },
  });
}

// Hook to get available years from commission data
export function useCommissionYears() {
  return useQuery({
    queryKey: ["commission-years"],
    queryFn: async (): Promise<number[]> => {
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("year")
        .not("year", "is", null);

      if (error) throw error;

      const years = [...new Set((data || []).map(d => d.year as number))];
      return years.sort((a, b) => b - a); // Descending order
    },
  });
}
