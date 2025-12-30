import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { ClaimsTable } from "@/components/dashboard/ClaimsTable";
import { AdjusterBarChart, TrendLineChart, OfficeComparisonChart } from "@/components/dashboard/Charts";
import { 
  useClaims, 
  useAdjusterSummaries, 
  useOfficeSummaries, 
  useDashboardStats 
} from "@/hooks/useClaims";
import { useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useAdjusters } from "@/hooks/useAdjusters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Users, Building2, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { FilterDropdown } from "@/components/dashboard/FilterDropdown";

const Index = () => {
  const navigate = useNavigate();
  const { data: claims, isLoading: claimsLoading, error } = useClaims();
  const { data: adjustersData, isLoading: adjustersLoading } = useAdjusters();
  
  const isLoading = claimsLoading || adjustersLoading;
  const totalAdjustersCount = adjustersData?.length || 0;
  
  // Fetch salespeople for filter
  const { data: salespeople } = useQuery({
    queryKey: ["salespeople"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSalespeople, setSelectedSalespeople] = useState<string[]>([]);
  const [selectedAdjusters, setSelectedAdjusters] = useState<string[]>([]);

  // Get unique years and adjusters from claims
  const years = useMemo(() => {
    if (!claims) return [];
    const yearSet = new Set<string>();
    claims.forEach((c) => {
      if (c.date_signed) {
        const year = new Date(c.date_signed).getFullYear().toString();
        yearSet.add(year);
      }
    });
    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [claims]);

  const adjusters = useMemo(() => {
    if (!claims) return [];
    const adjusterSet = new Set<string>();
    claims.forEach((c) => {
      if (c.adjuster) adjusterSet.add(c.adjuster);
    });
    return Array.from(adjusterSet).sort();
  }, [claims]);

  const salespeopleNames = useMemo(() => {
    return salespeople?.map((sp) => sp.name) || [];
  }, [salespeople]);

  // Filter claims based on selections
  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    return claims.filter((c) => {
      // Year filter
      if (selectedYear !== "all" && c.date_signed) {
        const claimYear = new Date(c.date_signed).getFullYear().toString();
        if (claimYear !== selectedYear) return false;
      }
      // Adjuster filter
      if (selectedAdjusters.length > 0 && !selectedAdjusters.includes(c.adjuster)) {
        return false;
      }
      return true;
    });
  }, [claims, selectedYear, selectedAdjusters]);

  const adjusterSummaries = useAdjusterSummaries(filteredClaims);
  const officeSummaries = useOfficeSummaries(filteredClaims);
  const stats = useDashboardStats(filteredClaims);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 text-center max-w-md">
            <p className="text-destructive mb-2 font-semibold">Error loading data</p>
            <p className="text-muted-foreground text-sm">{error.message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 lg:mb-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 lg:mb-2">
              Adjuster Dashboard
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Adjuster Performance Overview
            </p>
          </div>
          
          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3 flex-wrap">
            <FilterDropdown
              label="Year"
              value={selectedYear}
              options={years}
              onChange={setSelectedYear}
              placeholder="All Years"
            />
            <MultiSelectFilter
              label="Salesperson"
              options={salespeopleNames}
              selected={selectedSalespeople}
              onChange={setSelectedSalespeople}
              placeholder="All Salespeople"
            />
            <MultiSelectFilter
              label="Adjuster"
              options={adjusters}
              selected={selectedAdjusters}
              onChange={setSelectedAdjusters}
              placeholder="All Adjusters"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Claims"
          value={stats.totalClaims}
          subtitle="Active claims"
          icon={FileText}
          glowColor="primary"
          delay={0}
        />
        <KPICard
          title="Adjusters"
          value={totalAdjustersCount}
          subtitle="Team members"
          icon={Users}
          glowColor="accent"
          delay={100}
        />
        <KPICard
          title="Avg % Change"
          value={`${stats.avgPercentChange >= 0 ? "+" : ""}${stats.avgPercentChange.toFixed(1)}%`}
          subtitle="Revision trend"
          icon={TrendingUp}
          trend={stats.avgPercentChange >= 0 ? "up" : "down"}
          glowColor={stats.avgPercentChange >= 0 ? "success" : "destructive"}
          delay={200}
        />
        <KPICard
          title="Offices"
          value={stats.officeCount}
          subtitle="Active locations"
          icon={Building2}
          glowColor="primary"
          delay={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AdjusterBarChart data={adjusterSummaries} />
        <TrendLineChart claims={filteredClaims || []} />
      </div>

      {/* Office Chart & Recent Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OfficeComparisonChart data={officeSummaries} />
        </div>
        <div className="lg:col-span-2">
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Recent Claims
              </h3>
              <button
                onClick={() => navigate("/claims")}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All →
              </button>
            </div>
            <ClaimsTable
              claims={(filteredClaims || []).slice(0, 7)}
              onAdjusterClick={(adjuster) => navigate(`/adjusters?selected=${adjuster}`)}
              onOfficeClick={(office) => navigate(`/offices?selected=${office}`)}
              hideSearch
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
