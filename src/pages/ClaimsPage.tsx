import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ClaimsTable } from "@/components/dashboard/ClaimsTable";
import { FilterDropdown } from "@/components/dashboard/FilterDropdown";
import { useClaims, useAdjusterSummaries, useOfficeSummaries } from "@/hooks/useClaims";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function ClaimsPage() {
  const navigate = useNavigate();
  const [adjusterFilter, setAdjusterFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  
  const { data: claims, isLoading, error } = useClaims();
  const adjusterSummaries = useAdjusterSummaries(claims);
  const officeSummaries = useOfficeSummaries(claims);

  const adjusters = useMemo(() => {
    return adjusterSummaries.map((a) => a.adjuster);
  }, [adjusterSummaries]);

  const offices = useMemo(() => {
    return officeSummaries.map((o) => o.office);
  }, [officeSummaries]);

  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    
    let filtered = claims;
    
    if (adjusterFilter !== "all") {
      filtered = filtered.filter((c) => c.adjuster === adjusterFilter);
    }
    
    if (officeFilter !== "all") {
      filtered = filtered.filter((c) => c.office === officeFilter);
    }
    
    return filtered;
  }, [claims, adjusterFilter, officeFilter]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading claims...</p>
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
          All Claims
        </h1>
        <p className="text-muted-foreground">
          Complete list of all claims with filtering options
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FilterDropdown
            label="Filter by Adjuster"
            value={adjusterFilter}
            options={adjusters}
            onChange={setAdjusterFilter}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 text-center animate-fade-in">
          <p className="text-2xl font-bold text-foreground">{filteredClaims.length}</p>
          <p className="text-sm text-muted-foreground">Total Claims</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "50ms" }}>
          <p className="text-2xl font-bold text-success">
            {filteredClaims.filter((c) => c.change_indicator === "increase").length}
          </p>
          <p className="text-sm text-muted-foreground">Increases</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-2xl font-bold text-destructive">
            {filteredClaims.filter((c) => c.change_indicator === "decrease").length}
          </p>
          <p className="text-sm text-muted-foreground">Decreases</p>
        </div>
      </div>

      {/* Claims Table */}
      <ClaimsTable
        claims={filteredClaims}
        onAdjusterClick={(adjuster) => navigate(`/adjusters?selected=${adjuster}`)}
        onOfficeClick={(office) => navigate(`/offices?selected=${office}`)}
      />
    </DashboardLayout>
  );
}
