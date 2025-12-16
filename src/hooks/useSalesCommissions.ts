import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SalesCommission, Salesperson, YearSummary } from "@/types/sales";

export function useSalespeople() {
  return useQuery({
    queryKey: ["salespeople"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Salesperson[];
    },
  });
}

export function useSalesCommissions(salespersonId?: string, year?: number) {
  return useQuery({
    queryKey: ["sales_commissions", salespersonId, year],
    queryFn: async () => {
      let query = supabase
        .from("sales_commissions")
        .select("*")
        .order("date_signed", { ascending: false });
      
      if (salespersonId) {
        query = query.eq("salesperson_id", salespersonId);
      }
      
      if (year) {
        query = query.eq("year", year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SalesCommission[];
    },
  });
}

export function useYearSummaries(salespersonId?: string) {
  return useQuery({
    queryKey: ["year_summaries", salespersonId],
    queryFn: async () => {
      let query = supabase
        .from("sales_commissions")
        .select("*");
      
      if (salespersonId) {
        query = query.eq("salesperson_id", salespersonId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const commissions = data as SalesCommission[];
      
      // Group by year and calculate summaries
      const yearMap = new Map<number, SalesCommission[]>();
      
      commissions.forEach(c => {
        const year = c.year || new Date(c.date_signed || '').getFullYear();
        if (!yearMap.has(year)) {
          yearMap.set(year, []);
        }
        yearMap.get(year)!.push(c);
      });
      
      const summaries: YearSummary[] = [];
      
      yearMap.forEach((yearCommissions, year) => {
        const totalDeals = yearCommissions.length;
        const totalInitialEstimate = yearCommissions.reduce((sum, c) => sum + (c.initial_estimate || 0), 0);
        const totalRevisedEstimate = yearCommissions.reduce((sum, c) => sum + (c.revised_estimate || 0), 0);
        const avgSplitPercentage = yearCommissions.reduce((sum, c) => sum + (c.split_percentage || 100), 0) / totalDeals;
        const avgFeePercentage = yearCommissions.reduce((sum, c) => sum + (c.fee_percentage || 0), 0) / totalDeals;
        const avgCommissionPercentage = yearCommissions.reduce((sum, c) => sum + (c.commission_percentage || 0), 0) / totalDeals;
        const totalCommissionsPaid = yearCommissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);
        
        // Calculate projected and actual commissions
        const projectedCommission = yearCommissions.reduce((sum, c) => {
          const split = (c.split_percentage || 100) / 100;
          const fee = (c.fee_percentage || 0) / 100;
          const comm = (c.commission_percentage || 0) / 100;
          return sum + (c.initial_estimate || 0) * split * fee * comm;
        }, 0);
        
        const actualCommission = yearCommissions.reduce((sum, c) => {
          const split = (c.split_percentage || 100) / 100;
          const fee = (c.fee_percentage || 0) / 100;
          const comm = (c.commission_percentage || 0) / 100;
          return sum + (c.revised_estimate || 0) * split * fee * comm;
        }, 0);
        
        summaries.push({
          year,
          totalDeals,
          totalInitialEstimate,
          totalRevisedEstimate,
          avgSplitPercentage,
          avgFeePercentage,
          avgCommissionPercentage,
          totalCommissionsPaid,
          projectedCommission,
          actualCommission,
        });
      });
      
      return summaries.sort((a, b) => b.year - a.year);
    },
  });
}

export function useAvailableYears(salespersonId?: string) {
  return useQuery({
    queryKey: ["available_years", salespersonId],
    queryFn: async () => {
      let query = supabase
        .from("sales_commissions")
        .select("year");
      
      if (salespersonId) {
        query = query.eq("salesperson_id", salespersonId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const years = [...new Set(data.map(d => d.year).filter(Boolean))] as number[];
      return years.sort((a, b) => b - a);
    },
  });
}
