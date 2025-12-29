import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { OfficeCard } from "@/components/dashboard/OfficeCard";
import { AdjusterCard } from "@/components/dashboard/AdjusterCard";
import { FilterDropdown } from "@/components/dashboard/FilterDropdown";
import { useClaims, useOfficeSummaries, useAdjusterSummaries } from "@/hooks/useClaims";
import { Loader2, X, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OfficesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOffice = searchParams.get("selected") || "all";
  const [selectedYear, setSelectedYear] = useState<string>("all");
  
  const { data: claims, isLoading, error } = useClaims();

  // Extract available years from claims data
  const availableYears = useMemo(() => {
    if (!claims) return [];
    const years = new Set<number>();
    claims.forEach((c) => {
      if (c.date_signed) {
        const year = new Date(c.date_signed).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [claims]);

  // Filter claims by year first
  const yearFilteredClaims = useMemo(() => {
    if (!claims) return [];
    if (selectedYear === "all") return claims;
    const yearNum = parseInt(selectedYear);
    return claims.filter((c) => {
      if (!c.date_signed) return false;
      const claimYear = new Date(c.date_signed).getFullYear();
      return claimYear === yearNum;
    });
  }, [claims, selectedYear]);

  const officeSummaries = useOfficeSummaries(yearFilteredClaims);
  const adjusterSummaries = useAdjusterSummaries(yearFilteredClaims);

  const offices = useMemo(() => {
    return officeSummaries.map((o) => o.office);
  }, [officeSummaries]);

  const selectedOfficeSummary = selectedOffice !== "all"
    ? officeSummaries.find((o) => o.office === selectedOffice)
    : null;

  const officeAdjusters = useMemo(() => {
    if (!selectedOfficeSummary) return [];
    return adjusterSummaries.filter(
      (a) => a.office === selectedOfficeSummary.office
    );
  }, [adjusterSummaries, selectedOfficeSummary]);

  const handleOfficeSelect = (office: string) => {
    if (office === "all") {
      searchParams.delete("selected");
    } else {
      searchParams.set("selected", office);
    }
    setSearchParams(searchParams);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading offices...</p>
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
          View by Office
        </h1>
        <p className="text-muted-foreground">
          Office locations and team performance
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <FilterDropdown
              label="Filter by Office"
              value={selectedOffice}
              options={offices}
              onChange={handleOfficeSelect}
              placeholder="Select office..."
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Year</label>
            <Select
              value={selectedYear}
              onValueChange={setSelectedYear}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selected Office Detail View */}
      {selectedOfficeSummary && (
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span
                onClick={() => handleOfficeSelect("all")}
                className="hover:text-foreground cursor-pointer transition-colors"
              >
                All Offices
              </span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">
                {selectedOfficeSummary.office}
              </span>
            </div>
            <button
              onClick={() => handleOfficeSelect("all")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
              Back to All
            </button>
          </div>

          {/* Office Summary Card */}
          <div className="mb-8">
            <OfficeCard summary={selectedOfficeSummary} />
          </div>

          {/* Office Adjusters */}
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Team Members ({officeAdjusters.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {officeAdjusters.map((adjuster, index) => (
              <AdjusterCard
                key={adjuster.adjuster}
                summary={adjuster}
                onClick={() => navigate(`/adjusters?selected=${adjuster.adjuster}`)}
                delay={index * 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Office Cards Grid */}
      {!selectedOfficeSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {officeSummaries.map((summary, index) => (
            <OfficeCard
              key={summary.office}
              summary={summary}
              onClick={() => handleOfficeSelect(summary.office)}
              delay={index * 100}
            />
          ))}
        </div>
      )}

      {officeSummaries.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No offices found.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
