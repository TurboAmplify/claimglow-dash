import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SalespersonOverview } from "@/components/salesperson/SalespersonOverview";
import { SalespersonGoalsSection } from "@/components/salesperson/SalespersonGoalsSection";
import { CommissionRecordsSection } from "@/components/salesperson/CommissionRecordsSection";
import { PlanSubmissionSection } from "@/components/salesperson/PlanSubmissionSection";
import { ProgressTracker } from "@/components/planning/ProgressTracker";
import { WeeklyDealsTracker } from "@/components/planning/WeeklyDealsTracker";
import { DealPipeline } from "@/components/planning/DealPipeline";
import { useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useSalesGoals } from "@/hooks/useSalesGoals";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { usePlanScenarios } from "@/hooks/usePlanScenarios";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useEffect } from "react";

export default function SalespersonDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use 2025 for current performance/stats, 2026 for planning
  const statsYear = 2025;
  const planningYear = 2026;

  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions(id);
  // Fetch goals for both years to support fallback
  const { data: goals, isLoading: loadingGoals } = useSalesGoals(id);
  const { plan, isLoading: loadingPlan } = useSalesPlan(id, planningYear);
  
  const {
    planInputs,
    setPlanInputs,
    scenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedScenario,
  } = usePlanScenarios();

  // Load saved plan data
  useEffect(() => {
    if (plan) {
      setPlanInputs({
        targetRevenue: Number(plan.target_revenue),
        targetCommission: Number(plan.target_commission),
        avgFeePercent: Number(plan.avg_fee_percent),
        commissionPercent: Number(plan.commission_percent),
      });
      setSelectedScenarioId(plan.selected_scenario);
    }
  }, [plan, setPlanInputs, setSelectedScenarioId]);

  const salesperson = useMemo(() => {
    return salespeople?.find((sp) => sp.id === id);
  }, [salespeople, id]);

  // Get director for notifications
  const director = useMemo(() => {
    return salespeople?.find((sp) => sp.role === "sales_director");
  }, [salespeople]);

  // Calculate stats using the stats year (2025 performance data)
  const stats = useMemo(() => {
    if (!commissions) return null;
    
    const statsYearCommissions = commissions.filter(c => c.year === statsYear);
    const totalDeals = statsYearCommissions.length;
    const totalVolume = statsYearCommissions.reduce((sum, c) => sum + (c.initial_estimate || 0), 0);
    const totalRevisedVolume = statsYearCommissions.reduce((sum, c) => sum + (c.revised_estimate || 0), 0);
    const totalCommissions = statsYearCommissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);
    const totalInsuranceChecks = statsYearCommissions.reduce((sum, c) => sum + (c.insurance_checks_ytd || 0), 0);
    const totalNewRemainder = statsYearCommissions.reduce((sum, c) => sum + (c.new_remainder || 0), 0);
    
    return {
      totalDeals,
      totalVolume,
      totalRevisedVolume,
      totalCommissions,
      totalInsuranceChecks,
      totalNewRemainder,
      avgDealSize: totalDeals > 0 ? totalVolume / totalDeals : 0,
      commissionYield: totalVolume > 0 ? (totalCommissions / totalVolume) * 100 : 0,
    };
  }, [commissions, statsYear]);

  // Actual commissions for progress tracker (use planning year for tracking 2026 progress)
  const actualCommissions = useMemo(() => {
    if (!commissions) {
      return {
        totalVolume: 0,
        totalDeals: 0,
        totalCommission: 0,
        monthlyBreakdown: Array(12).fill({ month: '', volume: 0, deals: 0 }),
      };
    }

    const planningYearCommissions = commissions.filter(c => c.year === planningYear);
    const totalVolume = planningYearCommissions.reduce((sum, c) => sum + (Number(c.revised_estimate) || 0), 0);
    const totalDeals = planningYearCommissions.length;
    const totalCommission = planningYearCommissions.reduce((sum, c) => sum + (Number(c.commissions_paid) || 0), 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = monthNames.map((month, idx) => {
      const monthCommissions = planningYearCommissions.filter(c => {
        if (!c.date_signed) return false;
        const date = new Date(c.date_signed);
        return date.getMonth() === idx;
      });
      return {
        month,
        volume: monthCommissions.reduce((sum, c) => sum + (Number(c.revised_estimate) || 0), 0),
        deals: monthCommissions.length,
      };
    });

    return { totalVolume, totalDeals, totalCommission, monthlyBreakdown };
  }, [commissions, planningYear]);

  // Find goal - prioritize stats year (2025), fallback to planning year (2026)
  const currentGoal = useMemo(() => {
    const statsYearGoal = goals?.find((g) => g.year === statsYear);
    const planningYearGoal = goals?.find((g) => g.year === planningYear);
    return statsYearGoal || planningYearGoal;
  }, [goals, statsYear, planningYear]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const isLoading = loadingSalespeople || loadingCommissions || loadingGoals || loadingPlan;

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

  if (!salesperson) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Salesperson not found</p>
          <Button onClick={() => navigate("/sales/by-person")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales by Person
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/sales/by-person")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sales by Person
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{salesperson.name}</h1>
            <p className="text-muted-foreground">
              {salesperson.role === "sales_director" ? "Sales Director" : "Sales Representative"}
              {salesperson.email && ` • ${salesperson.email}`}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plan">
            <Target className="w-4 h-4 mr-1" />
            Plan
          </TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SalespersonOverview 
            stats={stats} 
            goal={currentGoal}
            salespersonName={salesperson.name}
            statsYear={statsYear}
          />
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          {/* Plan Submission Section */}
          <PlanSubmissionSection
            plan={plan}
            salespersonId={id!}
            directorId={director?.id || ""}
            formatCurrency={formatCurrency}
            onCreatePlan={() => navigate(`/planning/${id}`)}
          />

          {/* Progress Section - only show if plan exists */}
          {plan && (
            <>
              <WeeklyDealsTracker
                commissions={commissions || []}
                scenario={selectedScenario}
                currentYear={planningYear}
                formatCurrency={formatCurrency}
              />

              <ProgressTracker
                scenario={selectedScenario}
                actualCommissions={actualCommissions}
                formatCurrency={formatCurrency}
                currentYear={planningYear}
              />

              <DealPipeline
                salespersonId={id!}
                formatCurrency={formatCurrency}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <SalespersonGoalsSection 
            salespersonId={id!}
            salespersonName={salesperson.name}
            currentStats={stats}
          />
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <CommissionRecordsSection 
            commissions={commissions || []}
            salespersonId={id!}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
