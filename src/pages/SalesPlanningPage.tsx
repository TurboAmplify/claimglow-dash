import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useYearSummaries, useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useMemo, useState, useEffect } from "react";
import { Loader2, Target, TrendingUp, BarChart3, Calendar, Map as MapIcon, Layers, Compass, Save, Activity, Users, ShieldAlert, Send, FlaskConical } from "lucide-react";
import { usePlanApproval } from "@/hooks/usePlanApproval";
import { ValuesSection } from "@/components/goals/ValuesSection";
import { PlanCreator } from "@/components/planning/PlanCreator";
import { ScenarioCard } from "@/components/planning/ScenarioCard";
import { ScenarioComparisonChart } from "@/components/planning/ScenarioComparisonChart";
import { QuarterlyBreakdown } from "@/components/planning/QuarterlyBreakdown";
import { StrategicFocusSection } from "@/components/planning/StrategicFocusSection";
import { ProgressTracker } from "@/components/planning/ProgressTracker";
import { WeeklyDealsTracker } from "@/components/planning/WeeklyDealsTracker";
import { DealPipeline } from "@/components/planning/DealPipeline";
import { PlanAlertsIndicator } from "@/components/planning/PlanAlertsIndicator";
import { TeamMemberFilter, TeamMemberSelection } from "@/components/planning/TeamMemberFilter";
import { GoalsSummaryCard } from "@/components/planning/GoalsSummaryCard";
import { WhatIfSandbox } from "@/components/planning/WhatIfSandbox";
import { ScenarioImpactChart } from "@/components/planning/ScenarioImpactChart";
import { usePlanScenarios } from "@/hooks/usePlanScenarios";
import { useRoadmapAnalysis } from "@/hooks/useRoadmapAnalysis";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useTeamMetrics } from "@/hooks/useTeamMetrics";
import { useProgressAlerts } from "@/hooks/useProgressAlerts";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { useSalesGoals, useTeamGoals } from "@/hooks/useSalesGoals";
import { useHypotheticalDeals } from "@/hooks/useHypotheticalDeals";
import { useDealPipeline } from "@/hooks/useDealPipeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from "recharts";

export default function SalesPlanningPage() {
  const currentYear = 2026;
  const navigate = useNavigate();

  const { salesperson: currentUser, isDirector, isSalesRep, isLoading: loadingCurrentUser } = useCurrentSalesperson();
  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  
  // Team member selection state for directors
  const [teamSelection, setTeamSelection] = useState<TeamMemberSelection>({
    mode: "individual",
    selectedIds: [],
  });
  
  // Set initial selection once data loads
  useEffect(() => {
    if (currentUser && teamSelection.selectedIds.length === 0) {
      setTeamSelection({
        mode: "individual",
        selectedIds: [currentUser.id],
      });
    }
  }, [currentUser, teamSelection.selectedIds.length]);

  // Determine view mode and get display name
  const isTeamView = teamSelection.mode === "team" || teamSelection.selectedIds.length > 1;
  const salespersonId = teamSelection.selectedIds.length === 1 ? teamSelection.selectedIds[0] : undefined;
  const selectedSalesperson = salespeople?.find(sp => sp.id === salespersonId);
  
  const salespersonName = useMemo(() => {
    if (teamSelection.mode === "team") return "Entire Team";
    if (teamSelection.selectedIds.length > 1) {
      return `${teamSelection.selectedIds.length} Team Members`;
    }
    return selectedSalesperson?.name || "Salesperson";
  }, [teamSelection, selectedSalesperson]);

  // Fetch team metrics when viewing team or multiple members
  const { metrics: teamMetrics, isLoading: loadingTeamMetrics } = useTeamMetrics(teamSelection, currentYear);
  
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions(salespersonId);
  const { data: yearSummaries, isLoading: loadingSummaries } = useYearSummaries(salespersonId);
  
  // Fetch goals for individual or team
  const { data: individualGoals, isLoading: loadingIndividualGoals } = useSalesGoals(salespersonId, currentYear);
  const { data: teamGoals, isLoading: loadingTeamGoals } = useTeamGoals(
    currentUser?.role === "sales_director" ? currentUser.id : undefined, 
    currentYear
  );

  const currentGoal = useMemo(() => {
    return individualGoals?.[0] || null;
  }, [individualGoals]);

  const {
    planInputs,
    updatePlanInput,
    setPlanInputs,
    scenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedScenario,
    monthlyProjections,
  } = usePlanScenarios();

  // Hypothetical deals for What-If Sandbox
  const {
    deals: hypotheticalDeals,
    isActive: sandboxActive,
    toggleSandbox,
    addDeal: addHypotheticalDeal,
    removeDeal: removeHypotheticalDeal,
    clearAll: clearHypotheticals,
    aggregates: hypotheticalAggregates,
  } = useHypotheticalDeals();

  // Deal pipeline for converting hypotheticals
  const { addDeal: addToPipeline } = useDealPipeline(salespersonId);

  const handleConvertToPipeline = (deal: typeof hypotheticalDeals[0]) => {
    if (!salespersonId) return;
    addToPipeline({
      salesperson_id: salespersonId,
      client_name: deal.client_name,
      expected_value: deal.expected_value,
      expected_close_date: deal.expected_close_date,
      probability: deal.probability,
      notes: deal.notes,
      stage: 'prospecting',
    });
    removeHypotheticalDeal(deal.id);
    toast.success("Deal moved to pipeline!");
  };

  const { plan, savePlan, isSaving, isLoading: loadingPlan } = useSalesPlan(salespersonId, currentYear);

  // Get director ID for notifications - defined early so it can be used in handleSubmitForReview
  const directorId = salespeople?.find(sp => sp.role === "sales_director")?.id;

  // Load saved plan on mount, or initialize from goals if no plan exists
  useEffect(() => {
    if (plan) {
      setPlanInputs({
        targetRevenue: Number(plan.target_revenue),
        targetCommission: Number(plan.target_commission),
        avgFeePercent: Number(plan.avg_fee_percent),
        commissionPercent: Number(plan.commission_percent),
      });
      setSelectedScenarioId(plan.selected_scenario);
    } else if (currentGoal?.target_revenue) {
      // Initialize from salesperson's goal if no saved plan exists
      updatePlanInput('targetRevenue', Number(currentGoal.target_revenue));
    }
  }, [plan, currentGoal, setPlanInputs, setSelectedScenarioId, updatePlanInput]);

  const { historicalPatterns } = useRoadmapAnalysis(commissions, planInputs.targetRevenue);

  // Redirect non-directors to their individual planning page - AFTER all hooks
  if (!loadingCurrentUser && currentUser && !isDirector) {
    return <Navigate to={`/planning/${currentUser.id}`} replace />;
  }
  const [activeTab, setActiveTab] = useState('strategy');

  // Calculate actual commissions data for progress tracking
  const actualCommissions = useMemo(() => {
    if (!commissions) {
      return {
        totalVolume: 0,
        totalDeals: 0,
        totalCommission: 0,
        monthlyBreakdown: Array(12).fill({ month: '', volume: 0, deals: 0 }),
      };
    }

    // Filter to current year
    const currentYearCommissions = commissions.filter(c => c.year === currentYear);
    
    const totalVolume = currentYearCommissions.reduce((sum, c) => sum + (Number(c.revised_estimate) || 0), 0);
    const totalDeals = currentYearCommissions.length;
    const totalCommission = currentYearCommissions.reduce((sum, c) => sum + (Number(c.commissions_paid) || 0), 0);

    // Monthly breakdown
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = monthNames.map((month, idx) => {
      const monthCommissions = currentYearCommissions.filter(c => {
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
  }, [commissions, currentYear]);

  const { submitForApproval, isSubmitting } = usePlanApproval();

  const handleSavePlan = () => {
    if (!salespersonId) return;
    
    savePlan({
      salesperson_id: salespersonId,
      year: currentYear,
      target_revenue: planInputs.targetRevenue,
      target_commission: planInputs.targetCommission,
      avg_fee_percent: planInputs.avgFeePercent,
      commission_percent: planInputs.commissionPercent,
      selected_scenario: selectedScenarioId,
    });
  };

  const handleSubmitForReview = () => {
    if (!plan || !salespersonId || !directorId) return;
    submitForApproval({
      planId: plan.id,
      senderId: salespersonId,
      directorId,
    });
  };

  const canSubmitForReview = plan && 
    plan.approval_status !== 'pending' && 
    plan.approval_status !== 'pending_approval' && 
    plan.approval_status !== 'approved' &&
    directorId &&
    !isDirector; // Directors shouldn't submit to themselves

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

  // Historical data for charts
  const yearOverYearData = useMemo(() => {
    if (!yearSummaries) return [];
    return yearSummaries
      .filter(y => y.year >= 2020 && y.year <= 2025)
      .map(y => ({
        year: y.year.toString(),
        volume: y.totalRevisedEstimate,
        deals: y.totalDeals,
        avgDealSize: y.totalRevisedEstimate / y.totalDeals,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [yearSummaries]);

  const seasonalityData = useMemo(() => {
    if (!historicalPatterns) return [];
    return historicalPatterns.monthlyPatterns.map(mp => ({
      month: mp.monthName,
      avgVolume: mp.avgVolume,
      avgDeals: mp.avgDeals,
    }));
  }, [historicalPatterns]);

  const historicalStats = useMemo(() => {
    if (!yearSummaries || yearSummaries.length === 0) return null;
    
    const totalDeals = yearSummaries.reduce((sum, y) => sum + y.totalDeals, 0);
    const totalVolume = yearSummaries.reduce((sum, y) => sum + y.totalRevisedEstimate, 0);
    const avgDealSize = totalVolume / totalDeals;
    const avgDealsPerYear = totalDeals / yearSummaries.length;
    const avgFee = yearSummaries.reduce((sum, y) => sum + y.avgFeePercentage, 0) / yearSummaries.length;
    
    const bestYear = yearSummaries.reduce((best, y) => 
      y.totalRevisedEstimate > best.totalRevisedEstimate ? y : best
    );
    
    return {
      totalDeals,
      totalVolume,
      avgDealSize,
      avgDealsPerYear,
      avgFee,
      bestYear,
      years: yearSummaries.length,
    };
  }, [yearSummaries]);

  const isLoading = loadingSalespeople || loadingCommissions || loadingSummaries || loadingPlan || loadingCurrentUser || (isTeamView && loadingTeamMetrics) || loadingIndividualGoals;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Plan Alerts Indicator for Directors - positioned at top right */}
      {isDirector && directorId && (
        <div className="flex justify-end mb-4">
          <PlanAlertsIndicator 
            directorId={directorId} 
            formatCurrency={formatCurrency}
            currentYear={currentYear}
          />
        </div>
      )}

      {/* Values Section at the top */}
      <div className="mb-6">
        <ValuesSection />
      </div>

      {/* Team Member Selector - Always visible at the top */}
      <div className="mb-6 glass-card p-4 animate-fade-in border-2 border-primary/30">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 min-w-fit">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">View Team Member:</span>
            </div>
            <TeamMemberFilter
              selection={teamSelection}
              onSelectionChange={setTeamSelection}
              className="flex-1"
            />
          </div>
          
          {/* Team Metrics Summary when viewing team/multiple members */}
          {isTeamView && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/50">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">Team Members</p>
                <p className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {teamMetrics.memberCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Combined Target</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(teamMetrics.totalTargetRevenue)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground">Team Deals YTD</p>
                <p className="text-xl font-bold text-foreground">
                  {teamMetrics.actualCommissions.totalDeals}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-muted-foreground">Team Volume YTD</p>
                <p className="text-xl font-bold text-emerald-500">
                  {formatCurrency(teamMetrics.actualCommissions.totalVolume)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2026 Goals Card - Show for individual view */}
      {!isTeamView && (
        <div className="mb-6">
          <GoalsSummaryCard
            goal={currentGoal}
            salespersonName={salespersonName}
            currentPlanRevenue={planInputs.targetRevenue}
            formatCurrency={formatCurrency}
            hasSavedPlan={!!plan}
            isLoading={loadingIndividualGoals}
            planData={plan ? {
              target_revenue: plan.target_revenue,
              target_commission: plan.target_commission,
              approval_status: plan.approval_status,
              submitted_at: plan.submitted_at,
              approved_at: plan.approved_at
            } : null}
          />
        </div>
      )}

      {/* Team Goals Summary - Show for team view */}
      {isTeamView && teamGoals && teamGoals.length > 0 && (
        <div className="mb-6 glass-card p-6 animate-fade-in">
          {(() => {
            // Filter goals to only show selected members
            const filteredGoals = teamSelection.mode === "team" 
              ? teamGoals 
              : teamGoals.filter(g => teamSelection.selectedIds.includes(g.salesperson_id));
            
            if (filteredGoals.length === 0) return null;
            
            return (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Team 2026 Goals</h3>
                    <p className="text-sm text-muted-foreground">{filteredGoals.length} team member{filteredGoals.length !== 1 ? 's' : ''} with goals set</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Target Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(filteredGoals.reduce((sum, g) => sum + (Number(g.target_revenue) || 0), 0))}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Target Deals</p>
                    <p className="text-2xl font-bold text-foreground">
                      {filteredGoals.reduce((sum, g) => sum + (g.target_deals || 0), 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Per Member</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(filteredGoals.reduce((sum, g) => sum + (Number(g.target_revenue) || 0), 0) / filteredGoals.length)}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <MapIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Planning {currentYear}</h1>
            <p className="text-muted-foreground">
              {salespersonName} — Create your annual plan and choose your path to success
            </p>
          </div>
        </div>
        
        {/* Target Reference */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Target Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(planInputs.targetRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Projected Commission</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(selectedScenario.projectedCommission)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="glass-card p-1 flex-wrap">
            <TabsTrigger value="strategy" className="data-[state=active]:bg-primary/20">
              <Compass className="w-4 h-4 mr-2" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:bg-primary/20">
              <Target className="w-4 h-4 mr-2" />
              Your Plan
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-primary/20">
              <Activity className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="data-[state=active]:bg-primary/20">
              <Layers className="w-4 h-4 mr-2" />
              Choose Your Path
            </TabsTrigger>
            <TabsTrigger value="historical" className="data-[state=active]:bg-primary/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Historical Context
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button 
              onClick={handleSavePlan} 
              disabled={isSaving || isTeamView || !salespersonId}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : plan ? "Update Plan" : "Save Plan"}
            </Button>
            {canSubmitForReview && (
              <Button 
                onClick={handleSubmitForReview} 
                disabled={isSubmitting}
                variant="outline"
                className="gap-2 border-primary text-primary hover:bg-primary/10"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            )}
          </div>
        </div>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-6">
          {/* Show plan creator only for individual view */}
          {!isTeamView && (
            <PlanCreator 
              planInputs={planInputs}
              updatePlanInput={updatePlanInput}
              formatCurrency={formatCurrency}
            />
          )}
          
          {/* Team View Notice */}
          {isTeamView && (
            <div className="glass-card p-6 animate-fade-in border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Viewing Team Aggregated Data</h3>
                  <p className="text-sm text-muted-foreground">
                    To edit plan details, select an individual team member. Team view shows combined metrics across {teamMetrics.memberCount} team member{teamMetrics.memberCount !== 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Scenario Preview */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Paths to {formatCurrency(planInputs.targetRevenue)}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => {
                    setSelectedScenarioId(scenario.id);
                    setActiveTab('scenarios');
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedScenarioId === scenario.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <span className="font-semibold text-foreground">{scenario.name}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">{scenario.dealCount} deals</p>
                  <p className="text-sm text-muted-foreground">@ {formatCurrency(scenario.avgDealSize)} avg</p>
                </button>
              ))}
            </div>
          </div>

          {/* Trajectory Chart */}
          <ScenarioComparisonChart
            scenarios={scenarios}
            monthlyProjections={monthlyProjections}
            targetRevenue={planInputs.targetRevenue}
            formatCurrency={formatCurrency}
            selectedScenarioId={selectedScenarioId}
          />
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {/* What-If Sandbox Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Track Your Progress</h3>
            <Button
              variant={sandboxActive ? "default" : "outline"}
              onClick={toggleSandbox}
              className={sandboxActive ? "bg-violet-600 hover:bg-violet-700" : "border-violet-500/50 text-violet-600 hover:bg-violet-500/10"}
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              {sandboxActive ? "Exit Sandbox" : "What-If Sandbox"}
            </Button>
          </div>

          {/* What-If Sandbox */}
          {sandboxActive && (
            <>
              <WhatIfSandbox
                deals={hypotheticalDeals}
                aggregates={hypotheticalAggregates}
                onAddDeal={addHypotheticalDeal}
                onRemoveDeal={removeHypotheticalDeal}
                onClearAll={clearHypotheticals}
                onConvertToPipeline={salespersonId ? handleConvertToPipeline : undefined}
                formatCurrency={formatCurrency}
              />
              {hypotheticalDeals.length > 0 && (
                <ScenarioImpactChart
                  baseVolume={actualCommissions.totalVolume}
                  baseDeals={actualCommissions.totalDeals}
                  hypotheticalVolume={hypotheticalAggregates.weightedValue}
                  hypotheticalDeals={hypotheticalAggregates.dealCount}
                  formatCurrency={formatCurrency}
                />
              )}
            </>
          )}

          {/* Weekly Deals Tracker */}
          <WeeklyDealsTracker
            commissions={commissions || []}
            scenario={selectedScenario}
            currentYear={currentYear}
            formatCurrency={formatCurrency}
          />

          {/* Main Progress Tracker */}
          <ProgressTracker
            scenario={selectedScenario}
            actualCommissions={actualCommissions}
            formatCurrency={formatCurrency}
            currentYear={currentYear}
            hypotheticalDeals={sandboxActive ? hypotheticalDeals : undefined}
          />

          {/* Deal Pipeline */}
          {salespersonId && (
            <DealPipeline
              salespersonId={salespersonId}
              formatCurrency={formatCurrency}
            />
          )}
        </TabsContent>

        {/* Choose Your Path Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-2">Choose Your Path to {formatCurrency(planInputs.targetRevenue)}</h3>
            <p className="text-muted-foreground mb-6">
              Select the approach that best matches your market opportunity and personal style. Each path reaches the same destination through different means.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  isSelected={selectedScenarioId === scenario.id}
                  onSelect={() => setSelectedScenarioId(scenario.id)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>

          {/* Selected Scenario Breakdown */}
          <QuarterlyBreakdown
            scenario={selectedScenario}
            formatCurrency={formatCurrency}
          />

          {/* Selected Scenario Details */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {selectedScenario.name} — Key Assumptions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">What This Path Requires</h4>
                <ul className="space-y-2">
                  {selectedScenario.keyAssumptions.map((assumption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">Monthly Activity Target</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Deals per Month</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(selectedScenario.dealCount / 12).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Monthly Volume</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(selectedScenario.totalVolume / 12)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Deals per Week</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(selectedScenario.dealCount / 52).toFixed(1)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground">Monthly Commission</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedScenario.projectedCommission / 12)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <StrategicFocusSection selectedScenarioId={selectedScenarioId} />
        </TabsContent>

        {/* Historical Context Tab */}
        <TabsContent value="historical" className="space-y-6">
          {/* Year-over-Year Performance */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Year-over-Year Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearOverYearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Total Volume']}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Seasonality */}
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Seasonality Pattern</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={seasonalityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Avg Volume']}
                  />
                  <Bar dataKey="avgVolume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Historical Stats */}
            {historicalStats && (
              <div className="glass-card p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-foreground mb-4">Historical Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(historicalStats.avgDealSize)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Deals/Year</p>
                    <p className="text-xl font-bold text-foreground">{historicalStats.avgDealsPerYear.toFixed(0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Best Year</p>
                    <p className="text-xl font-bold text-primary">{historicalStats.bestYear.year}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Best Volume</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(historicalStats.bestYear.totalRevisedEstimate)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Fee %</p>
                    <p className="text-xl font-bold text-foreground">{historicalStats.avgFee.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Total Deals</p>
                    <p className="text-xl font-bold text-foreground">{historicalStats.totalDeals}</p>
                  </div>
                </div>

                {/* Gap Analysis */}
                <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Gap to {currentYear} Target</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(planInputs.targetRevenue - historicalStats.bestYear.totalRevisedEstimate)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({((planInputs.targetRevenue - historicalStats.bestYear.totalRevisedEstimate) / historicalStats.bestYear.totalRevisedEstimate * 100).toFixed(1)}% growth needed vs best year)
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Comparison to Scenarios */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">How Scenarios Compare to History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Scenario</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Deals</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Deal Size</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">vs Historical Avg</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalStats && (
                    <tr className="border-b border-border/50 bg-secondary/20">
                      <td className="py-3 px-4 font-medium text-foreground">Historical Average</td>
                      <td className="py-3 px-4 text-right text-foreground">{historicalStats.avgDealsPerYear.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right text-foreground">{formatCurrency(historicalStats.avgDealSize)}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">—</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">—</td>
                    </tr>
                  )}
                  {scenarios.map((scenario) => {
                    const dealDiff = historicalStats 
                      ? ((scenario.dealCount - historicalStats.avgDealsPerYear) / historicalStats.avgDealsPerYear * 100) 
                      : 0;
                    const sizeDiff = historicalStats
                      ? ((scenario.avgDealSize - historicalStats.avgDealSize) / historicalStats.avgDealSize * 100)
                      : 0;
                    
                    return (
                      <tr key={scenario.id} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: scenario.color }}
                            />
                            <span className="font-medium text-foreground">{scenario.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-foreground">{scenario.dealCount}</td>
                        <td className="py-3 px-4 text-right text-foreground">{formatCurrency(scenario.avgDealSize)}</td>
                        <td className={`py-3 px-4 text-right ${sizeDiff >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {sizeDiff >= 0 ? '+' : ''}{sizeDiff.toFixed(0)}% avg size
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {formatCurrency(scenario.projectedCommission)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
