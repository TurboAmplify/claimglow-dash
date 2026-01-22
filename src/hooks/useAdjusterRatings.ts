import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdjusterRating {
  id: string;
  sales_commission_id: string;
  salesperson_id: string;
  adjuster: string;
  rating: number | null;
  rating_communication: number | null;
  rating_settlement: number | null;
  rating_overall: number | null;
  claim_milestone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRatingInput {
  sales_commission_id: string;
  salesperson_id: string;
  adjuster: string;
  rating_communication: number;
  rating_settlement: number;
  rating_overall: number;
  claim_milestone: string;
  notes?: string;
}

export type ClaimMilestone = '2_weeks' | '3_months' | '6_months' | 'completed';

export interface ClaimAlert {
  id: string;
  client_name: string;
  adjuster: string;
  date_signed: string | null;
  salesperson_id: string;
  status: string | null;
  milestone: ClaimMilestone;
}

export function useAdjusterRatings(salespersonId?: string) {
  const queryClient = useQueryClient();

  // Fetch all ratings (optionally filtered by salesperson)
  const { data: ratings, isLoading, error } = useQuery({
    queryKey: ["adjuster_ratings", salespersonId],
    queryFn: async () => {
      let query = supabase
        .from("adjuster_ratings")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (salespersonId) {
        query = query.eq("salesperson_id", salespersonId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AdjusterRating[];
    },
  });

  // Create a new rating with 3-question survey
  const createRating = useMutation({
    mutationFn: async (input: CreateRatingInput) => {
      // Calculate average rating for backward compatibility
      const avgRating = Math.round(
        (input.rating_communication + input.rating_settlement + input.rating_overall) / 3
      );
      
      const { data, error } = await supabase
        .from("adjuster_ratings")
        .insert({
          ...input,
          rating: avgRating, // Store average for backward compatibility
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjuster_ratings"] });
      queryClient.invalidateQueries({ queryKey: ["claim_alerts"] });
      queryClient.invalidateQueries({ queryKey: ["team_claim_alerts"] });
      toast.success("Rating submitted successfully");
    },
    onError: (error) => {
      console.error("Error creating rating:", error);
      toast.error("Failed to submit rating");
    },
  });

  // Update an existing rating
  const updateRating = useMutation({
    mutationFn: async ({ 
      id, 
      rating_communication, 
      rating_settlement, 
      rating_overall, 
      notes 
    }: { 
      id: string; 
      rating_communication: number;
      rating_settlement: number;
      rating_overall: number;
      notes?: string;
    }) => {
      const avgRating = Math.round(
        (rating_communication + rating_settlement + rating_overall) / 3
      );
      
      const { error } = await supabase
        .from("adjuster_ratings")
        .update({ 
          rating: avgRating,
          rating_communication, 
          rating_settlement, 
          rating_overall, 
          notes 
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjuster_ratings"] });
      toast.success("Rating updated");
    },
    onError: (error) => {
      console.error("Error updating rating:", error);
      toast.error("Failed to update rating");
    },
  });

  return {
    ratings,
    isLoading,
    error,
    createRating: createRating.mutate,
    updateRating: updateRating.mutate,
    isCreating: createRating.isPending,
    isUpdating: updateRating.isPending,
  };
}

// Helper function to calculate milestone dates
function getMilestoneDates() {
  const now = new Date();
  
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return { twoWeeksAgo, threeMonthsAgo, sixMonthsAgo };
}

// Hook to get claims that need rating based on milestones
export function useClaimAlerts(salespersonId: string | undefined) {
  return useQuery({
    queryKey: ["claim_alerts", salespersonId],
    queryFn: async () => {
      if (!salespersonId) return [];
      
      const { twoWeeksAgo, threeMonthsAgo, sixMonthsAgo } = getMilestoneDates();
      
      console.log('[ClaimAlerts] Milestone dates:', {
        twoWeeksAgo: twoWeeksAgo.toISOString(),
        threeMonthsAgo: threeMonthsAgo.toISOString(),
        sixMonthsAgo: sixMonthsAgo.toISOString(),
        salespersonId
      });
      
      // Fetch all claims for this salesperson with adjuster info
      const { data: claims, error: claimsError } = await supabase
        .from("sales_commissions")
        .select("id, client_name, adjuster, date_signed, salesperson_id, status")
        .eq("salesperson_id", salespersonId)
        .not("adjuster", "is", null)
        .order("date_signed", { ascending: false });
      
      if (claimsError) throw claimsError;
      
      // Fetch existing ratings for this salesperson with milestone info
      const { data: existingRatings, error: ratingsError } = await supabase
        .from("adjuster_ratings")
        .select("sales_commission_id, claim_milestone")
        .eq("salesperson_id", salespersonId);
      
      if (ratingsError) throw ratingsError;
      
      console.log('[ClaimAlerts] Fetched claims:', claims?.length, 'Ratings:', existingRatings?.length);
      
      // Create a map of claim_id -> set of milestones already rated
      const ratedMilestones = new Map<string, Set<string>>();
      existingRatings?.forEach(r => {
        if (!ratedMilestones.has(r.sales_commission_id)) {
          ratedMilestones.set(r.sales_commission_id, new Set());
        }
        if (r.claim_milestone) {
          ratedMilestones.get(r.sales_commission_id)!.add(r.claim_milestone);
        }
      });
      
      const alerts: ClaimAlert[] = [];
      
      for (const claim of claims || []) {
        if (!claim.date_signed) continue;
        
        const dateSigned = new Date(claim.date_signed);
        const ratedSet = ratedMilestones.get(claim.id) || new Set();
        const isCompleted = claim.status === 'paid' || claim.status === 'released';
        
        // If completed, only show completed milestone (skip time-based ones)
        if (isCompleted) {
          if (!ratedSet.has('completed')) {
            alerts.push({
              ...claim,
              milestone: 'completed',
            });
          }
          continue;
        }
        
        // Check each time-based milestone
        if (dateSigned <= sixMonthsAgo && !ratedSet.has('6_months')) {
          alerts.push({ ...claim, milestone: '6_months' });
        } else if (dateSigned <= threeMonthsAgo && !ratedSet.has('3_months') && !ratedSet.has('6_months')) {
          alerts.push({ ...claim, milestone: '3_months' });
        } else if (dateSigned <= twoWeeksAgo && !ratedSet.has('2_weeks') && !ratedSet.has('3_months') && !ratedSet.has('6_months')) {
          alerts.push({ ...claim, milestone: '2_weeks' });
        }
      }
      
      console.log('[ClaimAlerts] Final alerts:', alerts.length, alerts.slice(0, 3).map(a => ({ client: a.client_name, milestone: a.milestone })));
      
      return alerts;
    },
    enabled: !!salespersonId,
  });
}

// Legacy hook for backward compatibility
export function useClaimsNeedingRating(salespersonId: string | undefined) {
  return useClaimAlerts(salespersonId);
}

// Hook to get aggregated adjuster ratings for directors
export function useAggregatedAdjusterRatings() {
  return useQuery({
    queryKey: ["aggregated_adjuster_ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adjuster_ratings")
        .select("adjuster, rating, rating_communication, rating_settlement, rating_overall");
      
      if (error) throw error;
      
      // Aggregate ratings by adjuster
      const aggregated = (data || []).reduce((acc, rating) => {
        if (!acc[rating.adjuster]) {
          acc[rating.adjuster] = { 
            total: 0, 
            count: 0, 
            ratings: [],
            communication: { total: 0, count: 0 },
            settlement: { total: 0, count: 0 },
            overall: { total: 0, count: 0 },
          };
        }
        
        // Use new ratings if available, otherwise fall back to old rating
        if (rating.rating_overall) {
          acc[rating.adjuster].total += rating.rating_overall;
          acc[rating.adjuster].count += 1;
          acc[rating.adjuster].ratings.push(rating.rating_overall);
        } else if (rating.rating) {
          acc[rating.adjuster].total += rating.rating;
          acc[rating.adjuster].count += 1;
          acc[rating.adjuster].ratings.push(rating.rating);
        }
        
        if (rating.rating_communication) {
          acc[rating.adjuster].communication.total += rating.rating_communication;
          acc[rating.adjuster].communication.count += 1;
        }
        if (rating.rating_settlement) {
          acc[rating.adjuster].settlement.total += rating.rating_settlement;
          acc[rating.adjuster].settlement.count += 1;
        }
        if (rating.rating_overall) {
          acc[rating.adjuster].overall.total += rating.rating_overall;
          acc[rating.adjuster].overall.count += 1;
        }
        
        return acc;
      }, {} as Record<string, { 
        total: number; 
        count: number; 
        ratings: number[];
        communication: { total: number; count: number };
        settlement: { total: number; count: number };
        overall: { total: number; count: number };
      }>);
      
      // Calculate averages and return sorted list
      return Object.entries(aggregated)
        .map(([adjuster, data]) => ({
          adjuster,
          averageRating: data.count > 0 ? data.total / data.count : 0,
          ratingCount: data.count,
          ratings: data.ratings,
          avgCommunication: data.communication.count > 0 ? data.communication.total / data.communication.count : null,
          avgSettlement: data.settlement.count > 0 ? data.settlement.total / data.settlement.count : null,
          avgOverall: data.overall.count > 0 ? data.overall.total / data.overall.count : null,
        }))
        .sort((a, b) => b.averageRating - a.averageRating);
    },
  });
}

// Hook to get all team members' claims needing rating (for directors)
export function useTeamClaimAlerts() {
  return useQuery({
    queryKey: ["team_claim_alerts"],
    queryFn: async () => {
      const { twoWeeksAgo, threeMonthsAgo, sixMonthsAgo } = getMilestoneDates();
      
      // Fetch all claims with adjuster info
      const { data: claims, error: claimsError } = await supabase
        .from("sales_commissions")
        .select("id, client_name, adjuster, date_signed, salesperson_id, status")
        .not("adjuster", "is", null)
        .order("date_signed", { ascending: false });
      
      if (claimsError) throw claimsError;
      
      // Fetch all existing ratings with milestone info
      const { data: existingRatings, error: ratingsError } = await supabase
        .from("adjuster_ratings")
        .select("sales_commission_id, salesperson_id, claim_milestone");
      
      if (ratingsError) throw ratingsError;
      
      // Fetch all salespeople for name mapping
      const { data: salespeople, error: spError } = await supabase
        .from("salespeople")
        .select("id, name");
      
      if (spError) throw spError;
      
      const salespersonMap = new Map(salespeople?.map(sp => [sp.id, sp.name]) || []);
      
      // Create a map of claim_id -> set of milestones already rated
      const ratedMilestones = new Map<string, Set<string>>();
      existingRatings?.forEach(r => {
        if (!ratedMilestones.has(r.sales_commission_id)) {
          ratedMilestones.set(r.sales_commission_id, new Set());
        }
        if (r.claim_milestone) {
          ratedMilestones.get(r.sales_commission_id)!.add(r.claim_milestone);
        }
      });
      
      const alerts: (ClaimAlert & { salesperson_name: string })[] = [];
      
      for (const claim of claims || []) {
        if (!claim.date_signed || !claim.salesperson_id) continue;
        
        const dateSigned = new Date(claim.date_signed);
        const ratedSet = ratedMilestones.get(claim.id) || new Set();
        const isCompleted = claim.status === 'paid' || claim.status === 'released';
        
        // If completed, only show completed milestone
        if (isCompleted) {
          if (!ratedSet.has('completed')) {
            alerts.push({
              ...claim,
              salesperson_id: claim.salesperson_id,
              milestone: 'completed',
              salesperson_name: salespersonMap.get(claim.salesperson_id) || 'Unknown',
            });
          }
          continue;
        }
        
        // Check each time-based milestone
        if (dateSigned <= sixMonthsAgo && !ratedSet.has('6_months')) {
          alerts.push({ 
            ...claim, 
            salesperson_id: claim.salesperson_id,
            milestone: '6_months',
            salesperson_name: salespersonMap.get(claim.salesperson_id) || 'Unknown',
          });
        } else if (dateSigned <= threeMonthsAgo && !ratedSet.has('3_months') && !ratedSet.has('6_months')) {
          alerts.push({ 
            ...claim, 
            salesperson_id: claim.salesperson_id,
            milestone: '3_months',
            salesperson_name: salespersonMap.get(claim.salesperson_id) || 'Unknown',
          });
        } else if (dateSigned <= twoWeeksAgo && !ratedSet.has('2_weeks') && !ratedSet.has('3_months') && !ratedSet.has('6_months')) {
          alerts.push({ 
            ...claim, 
            salesperson_id: claim.salesperson_id,
            milestone: '2_weeks',
            salesperson_name: salespersonMap.get(claim.salesperson_id) || 'Unknown',
          });
        }
      }
      
      // Group by salesperson
      const groupedByPerson = alerts.reduce((acc, alert) => {
        const spId = alert.salesperson_id;
        if (!acc[spId]) {
          acc[spId] = {
            salesperson_id: spId,
            salesperson_name: alert.salesperson_name,
            alerts: [],
          };
        }
        acc[spId].alerts.push(alert);
        return acc;
      }, {} as Record<string, { salesperson_id: string; salesperson_name: string; alerts: typeof alerts }>);
      
      return Object.values(groupedByPerson).sort((a, b) => b.alerts.length - a.alerts.length);
    },
  });
}

// Legacy hook for backward compatibility
export function useTeamClaimsNeedingRating() {
  return useTeamClaimAlerts();
}
