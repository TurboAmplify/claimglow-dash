import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdjusterRating {
  id: string;
  sales_commission_id: string;
  salesperson_id: string;
  adjuster: string;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRatingInput {
  sales_commission_id: string;
  salesperson_id: string;
  adjuster: string;
  rating: number;
  notes?: string;
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

  // Create a new rating
  const createRating = useMutation({
    mutationFn: async (input: CreateRatingInput) => {
      const { data, error } = await supabase
        .from("adjuster_ratings")
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adjuster_ratings"] });
      toast.success("Rating submitted successfully");
    },
    onError: (error) => {
      console.error("Error creating rating:", error);
      toast.error("Failed to submit rating");
    },
  });

  // Update an existing rating
  const updateRating = useMutation({
    mutationFn: async ({ id, rating, notes }: { id: string; rating: number; notes?: string }) => {
      const { error } = await supabase
        .from("adjuster_ratings")
        .update({ rating, notes })
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

// Hook to get claims that need rating (6+ months old without a rating)
export function useClaimsNeedingRating(salespersonId: string | undefined) {
  return useQuery({
    queryKey: ["claims_needing_rating", salespersonId],
    queryFn: async () => {
      if (!salespersonId) return [];
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Fetch claims older than 6 months for this salesperson
      const { data: claims, error: claimsError } = await supabase
        .from("sales_commissions")
        .select("id, client_name, adjuster, date_signed")
        .eq("salesperson_id", salespersonId)
        .lt("date_signed", sixMonthsAgo.toISOString().split('T')[0])
        .not("adjuster", "is", null)
        .order("date_signed", { ascending: false });
      
      if (claimsError) throw claimsError;
      
      // Fetch existing ratings for this salesperson
      const { data: existingRatings, error: ratingsError } = await supabase
        .from("adjuster_ratings")
        .select("sales_commission_id")
        .eq("salesperson_id", salespersonId);
      
      if (ratingsError) throw ratingsError;
      
      const ratedClaimIds = new Set(existingRatings?.map(r => r.sales_commission_id) || []);
      
      // Filter to only claims that haven't been rated yet
      return (claims || []).filter(claim => !ratedClaimIds.has(claim.id));
    },
    enabled: !!salespersonId,
  });
}

// Hook to get aggregated adjuster ratings for directors
export function useAggregatedAdjusterRatings() {
  return useQuery({
    queryKey: ["aggregated_adjuster_ratings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adjuster_ratings")
        .select("adjuster, rating");
      
      if (error) throw error;
      
      // Aggregate ratings by adjuster
      const aggregated = (data || []).reduce((acc, rating) => {
        if (!acc[rating.adjuster]) {
          acc[rating.adjuster] = { total: 0, count: 0, ratings: [] };
        }
        acc[rating.adjuster].total += rating.rating;
        acc[rating.adjuster].count += 1;
        acc[rating.adjuster].ratings.push(rating.rating);
        return acc;
      }, {} as Record<string, { total: number; count: number; ratings: number[] }>);
      
      // Calculate averages and return sorted list
      return Object.entries(aggregated)
        .map(([adjuster, data]) => ({
          adjuster,
          averageRating: data.total / data.count,
          ratingCount: data.count,
          ratings: data.ratings,
        }))
        .sort((a, b) => b.averageRating - a.averageRating);
    },
  });
}

// Hook to get all team members' claims needing rating (for directors)
export function useTeamClaimsNeedingRating() {
  return useQuery({
    queryKey: ["team_claims_needing_rating"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Fetch all claims older than 6 months with adjuster info
      const { data: claims, error: claimsError } = await supabase
        .from("sales_commissions")
        .select("id, client_name, adjuster, date_signed, salesperson_id")
        .lt("date_signed", sixMonthsAgo.toISOString().split('T')[0])
        .not("adjuster", "is", null)
        .order("date_signed", { ascending: false });
      
      if (claimsError) throw claimsError;
      
      // Fetch all existing ratings
      const { data: existingRatings, error: ratingsError } = await supabase
        .from("adjuster_ratings")
        .select("sales_commission_id, salesperson_id");
      
      if (ratingsError) throw ratingsError;
      
      // Fetch all salespeople for name mapping
      const { data: salespeople, error: spError } = await supabase
        .from("salespeople")
        .select("id, name");
      
      if (spError) throw spError;
      
      const salespersonMap = new Map(salespeople?.map(sp => [sp.id, sp.name]) || []);
      const ratedClaimIds = new Set(existingRatings?.map(r => r.sales_commission_id) || []);
      
      // Filter to unrated claims and group by salesperson
      const unratedClaims = (claims || []).filter(claim => !ratedClaimIds.has(claim.id));
      
      const groupedByPerson = unratedClaims.reduce((acc, claim) => {
        const spId = claim.salesperson_id;
        if (!acc[spId]) {
          acc[spId] = {
            salesperson_id: spId,
            salesperson_name: salespersonMap.get(spId) || "Unknown",
            claims: [],
          };
        }
        acc[spId].claims.push(claim);
        return acc;
      }, {} as Record<string, { salesperson_id: string; salesperson_name: string; claims: typeof unratedClaims }>);
      
      return Object.values(groupedByPerson).sort((a, b) => b.claims.length - a.claims.length);
    },
  });
}
