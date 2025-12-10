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
import { FileText, Users, Building2, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { data: claims, isLoading, error } = useClaims();
  const adjusterSummaries = useAdjusterSummaries(claims);
  const officeSummaries = useOfficeSummaries(claims);
  const stats = useDashboardStats(claims);

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
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 lg:mb-2">
          Commission Dashboard
        </h1>
        <p className="text-sm lg:text-base text-muted-foreground">
          2025 Adjuster Performance Overview
        </p>
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
          value={stats.totalAdjusters}
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
        <TrendLineChart claims={claims || []} />
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
              claims={(claims || []).slice(0, 7)}
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
