import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdjusterCard } from "@/components/dashboard/AdjusterCard";
import { ClaimsTable } from "@/components/dashboard/ClaimsTable";
import { FilterDropdown } from "@/components/dashboard/FilterDropdown";
import { useClaims, useAdjusterSummaries } from "@/hooks/useClaims";
import { Loader2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export default function AdjustersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAdjuster = searchParams.get("selected") || "all";
  const [officeFilter, setOfficeFilter] = useState("all");
  
  const { data: claims, isLoading, error } = useClaims();
  const adjusterSummaries = useAdjusterSummaries(claims);

  const offices = useMemo(() => {
    return [...new Set(adjusterSummaries.map((a) => a.office).filter(Boolean))] as string[];
  }, [adjusterSummaries]);

  const adjusters = useMemo(() => {
    return adjusterSummaries.map((a) => a.adjuster);
  }, [adjusterSummaries]);

  const filteredSummaries = useMemo(() => {
    let filtered = adjusterSummaries;
    
    if (officeFilter !== "all") {
      filtered = filtered.filter((a) => a.office === officeFilter);
    }
    
    if (selectedAdjuster !== "all") {
      filtered = filtered.filter((a) => a.adjuster === selectedAdjuster);
    }
    
    return filtered;
  }, [adjusterSummaries, officeFilter, selectedAdjuster]);

  const selectedSummary = selectedAdjuster !== "all" 
    ? adjusterSummaries.find((a) => a.adjuster === selectedAdjuster)
    : null;

  const handleAdjusterSelect = (adjuster: string) => {
    if (adjuster === "all") {
      searchParams.delete("selected");
    } else {
      searchParams.set("selected", adjuster);
    }
    setSearchParams(searchParams);
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

  if (error) {
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
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          View by Adjuster
        </h1>
        <p className="text-muted-foreground">
          Individual adjuster performance and claims
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FilterDropdown
            label="Filter by Adjuster"
            value={selectedAdjuster}
            options={adjusters}
            onChange={handleAdjusterSelect}
            placeholder="Select adjuster..."
          />
          <FilterDropdown
            label="Filter by Office"
            value={officeFilter}
            options={offices}
            onChange={setOfficeFilter}
            placeholder="Select office..."
          />
        </div>
      </div>

      {/* Selected Adjuster Detail View */}
      {selectedSummary && (
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              {selectedSummary.adjuster}'s Claims
            </h2>
            <button
              onClick={() => handleAdjusterSelect("all")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Selection
            </button>
          </div>
          <ClaimsTable
            claims={selectedSummary.claims}
            compact
          />
        </div>
      )}

      {/* Adjuster Cards Grid */}
      {!selectedSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSummaries.map((summary, index) => (
            <AdjusterCard
              key={summary.adjuster}
              summary={summary}
              onClick={() => handleAdjusterSelect(summary.adjuster)}
              delay={index * 50}
            />
          ))}
        </div>
      )}

      {filteredSummaries.length === 0 && !selectedSummary && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No adjusters found matching filters.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
