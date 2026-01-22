import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditAdjusterDialog } from "@/components/dashboard/EditAdjusterDialog";
import { AdjusterCard } from "@/components/dashboard/AdjusterCard";
import { useAdjusters, Adjuster } from "@/hooks/useAdjusters";
import { useAdjusterCommissionSummaries, useCommissionYears } from "@/hooks/useAdjusterCommissionSummaries";
import { AdjusterSummary } from "@/types/claims";
import { Loader2, Edit2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


interface MergedAdjuster {
  adjuster: Adjuster;
  summary: AdjusterSummary;
}

// Hook to get unique salespeople from commissions
function useSalespeopleFromCommissions() {
  return useQuery({
    queryKey: ["salespeople-from-commissions"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("salesperson_id, salespeople!inner(name)")
        .not("salesperson_id", "is", null);
      
      if (error) throw error;
      
      const names = [...new Set((data || []).map(d => (d.salespeople as any)?.name).filter(Boolean))];
      return names.sort();
    },
  });
}

export default function AdjustersPage() {
  const [selectedAdjusters, setSelectedAdjusters] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedSalespeople, setSelectedSalespeople] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAdjuster, setEditingAdjuster] = useState<Adjuster | null>(null);

  const { data: adjusters, isLoading: adjustersLoading, error: adjustersError } = useAdjusters();
  const { data: availableYears, isLoading: yearsLoading } = useCommissionYears();
  const { data: salespeople, isLoading: salespeopleLoading } = useSalespeopleFromCommissions();
  
  // Convert selected years to numbers for the hook
  const selectedYearsNumbers = useMemo(() => 
    selectedYears.map(y => parseInt(y, 10)).filter(y => !isNaN(y)),
    [selectedYears]
  );
  
  const { data: commissionSummaries, isLoading: summariesLoading } = useAdjusterCommissionSummaries(
    selectedYearsNumbers.length > 0 ? selectedYearsNumbers : undefined,
    selectedSalespeople.length > 0 ? selectedSalespeople : undefined
  );

  const isLoading = adjustersLoading || summariesLoading || yearsLoading || salespeopleLoading;

  // Merge adjusters table with commission summaries
  const mergedAdjusters = useMemo((): MergedAdjuster[] => {
    if (!adjusters) return [];
    
    const summaries = commissionSummaries || [];

    return adjusters.map((adjuster) => {
      // Find matching summary by name (case-insensitive, trim whitespace)
      const existingSummary = summaries.find(
        (s) => s.adjuster.toLowerCase().trim() === adjuster.name.toLowerCase().trim()
      );

      // Create a default summary with zeros if no claims data exists
      const summary: AdjusterSummary = existingSummary || {
        adjuster: adjuster.name,
        office: adjuster.office,
        totalClaims: 0,
        positiveClaims: 0,
        negativeClaims: 0,
        totalDollarDifference: 0,
        positiveDifference: 0,
        negativeDifference: 0,
        avgPercentChange: 0,
        totalEstimate: 0,
        totalRevised: 0,
        claims: [],
      };

      return { adjuster, summary };
    });
  }, [adjusters, commissionSummaries]);

  const offices = useMemo(() => {
    if (!adjusters) return [];
    return [...new Set(adjusters.map((a) => a.office).filter(Boolean))];
  }, [adjusters]);

  // Get year options as strings for MultiSelectFilter
  const yearOptions = useMemo(() => {
    return (availableYears || []).map(y => String(y));
  }, [availableYears]);

  const adjusterNames = useMemo(() => {
    if (!adjusters) return [];
    return adjusters.map((a) => a.name);
  }, [adjusters]);

  const filteredAdjusters = useMemo(() => {
    let filtered = mergedAdjusters;

    if (selectedOffices.length > 0) {
      filtered = filtered.filter((m) => selectedOffices.includes(m.adjuster.office));
    }

    if (selectedAdjusters.length > 0) {
      filtered = filtered.filter((m) => selectedAdjusters.includes(m.adjuster.name));
    }

    // When salesperson filter is active, only show adjusters with claims
    if (selectedSalespeople.length > 0) {
      filtered = filtered.filter((m) => m.summary.totalClaims > 0);
    }

    // Sort by total claims descending, those without claims go to end
    return filtered.sort((a, b) => {
      const aTotal = a.summary?.totalClaims ?? -1;
      const bTotal = b.summary?.totalClaims ?? -1;
      return bTotal - aTotal;
    });
  }, [mergedAdjusters, selectedOffices, selectedAdjusters, selectedSalespeople]);

  const handleEditAdjuster = (adjuster: Adjuster) => {
    setEditingAdjuster(adjuster);
    setEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading adjusters...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (adjustersError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 text-center">
            <p className="text-destructive">Error loading data</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Sticky Header + Filters */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 md:-mx-6 md:px-6">
        {/* Header */}
        <div className="pt-4 animate-fade-in">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              View by Adjuster
            </h1>
            <p className="text-sm text-muted-foreground">
              All adjusters and their performance metrics
              {selectedYears.length > 0 && (
                <span className="ml-1 text-primary">
                  ({selectedYears.join(", ")})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="glass-card p-3 mt-3 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MultiSelectFilter
              label="Year"
              options={yearOptions}
              selected={selectedYears}
              onChange={setSelectedYears}
              placeholder="All years"
            />
            <MultiSelectFilter
              label="Salesperson"
              options={salespeople || []}
              selected={selectedSalespeople}
              onChange={setSelectedSalespeople}
              placeholder="All salespeople"
            />
            <MultiSelectFilter
              label="Adjuster"
              options={adjusterNames}
              selected={selectedAdjusters}
              onChange={setSelectedAdjusters}
              placeholder="All adjusters"
            />
            <MultiSelectFilter
              label="Office"
              options={offices}
              selected={selectedOffices}
              onChange={setSelectedOffices}
              placeholder="All offices"
            />
          </div>
        </div>
      </div>

      {/* Adjuster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
        {filteredAdjusters.map((merged, index) => (
          <AdjusterCardWithEdit
            key={merged.adjuster.id}
            summary={merged.summary}
            adjuster={merged.adjuster}
            delay={index * 50}
            onEdit={() => handleEditAdjuster(merged.adjuster)}
          />
        ))}
      </div>

      {filteredAdjusters.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No adjusters found matching filters.</p>
        </div>
      )}

      <EditAdjusterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        adjuster={editingAdjuster}
        offices={offices}
      />
    </DashboardLayout>
  );
}

// Wrapper for AdjusterCard with edit button overlay
interface AdjusterCardWithEditProps {
  summary: AdjusterSummary;
  adjuster: Adjuster;
  delay?: number;
  onEdit: () => void;
}

function AdjusterCardWithEdit({ summary, adjuster, delay = 0, onEdit }: AdjusterCardWithEditProps) {
  return (
    <div className="relative group">
      <AdjusterCard summary={summary} delay={delay} />
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="absolute top-4 right-4 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary/80 hover:bg-secondary z-10"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
