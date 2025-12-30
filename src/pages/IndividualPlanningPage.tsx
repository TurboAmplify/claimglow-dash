import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useYearSummaries, useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useMemo, useState, useEffect } from "react";
import { Loader2, Target, TrendingUp, BarChart3, Map as MapIcon, Layers, Compass, Save, Activity, ArrowLeft, User, Send } from "lucide-react";
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

import { usePlanScenarios } from "@/hooks/usePlanScenarios";
import { useRoadmapAnalysis } from "@/hooks/useRoadmapAnalysis";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useSalesGoals } from "@/hooks/useSalesGoals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
} from "recharts";

export default function IndividualPlanningPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentYear = 2026;

  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions(id);
  const { data: yearSummaries, isLoading: loadingSummaries } = useYearSummaries(id);
  const { data: goals, isLoading: loadingGoals } = useSalesGoals(id, currentYear);

  const salesperson = useMemo(() => {
    return salespeople?.find(sp => sp.id === id);
  }, [salespeople, id]);

  const currentGoal = useMemo(() => {
    return goals?.[0] || null;
  }, [goals]);

  const {
    planInputs,
    updatePlanInput,
    setPlanInputs,
    scenarios,
    selectedScenarioId,
    setSelectedScenarioId,
    selectedScenario,
    monthlyProjections,
  } = usePlanScenarios({ salespersonName: salesperson?.name });

  const { plan, savePlan, isSaving, isLoading: loadingPlan } = useSalesPlan(id, currentYear);
  const { submitForApproval, isSubmitting } = usePlanApproval();

  // Get director ID for submission
  const directorId = useMemo(() => {
    return salespeople?.find(sp => sp.role === "sales_director")?.id;
  }, [salespeople]);

  // Load saved plan on mount, or initialize from goals if no plan exists
  useEffect(() => {
    if (plan) {
      setPlanInputs({
        targetRevenue: Number(plan.target_revenue),
        targetCommission: Number(plan.target_commission),
        targetDeals: plan.target_deals ?? 40,
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

    const currentYearCommissions = commissions.filter(c => c.year === currentYear);
    
    const totalVolume = currentYearCommissions.reduce((sum, c) => sum + (Number(c.revised_estimate) || 0), 0);
    const totalDeals = currentYearCommissions.length;
    const totalCommission = currentYearCommissions.reduce((sum, c) => sum + (Number(c.commissions_paid) || 0), 0);

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

  const handleSavePlan = () => {
    if (!id) return;
    
    savePlan({
      salesperson_id: id,
      year: currentYear,
      target_revenue: planInputs.targetRevenue,
      target_commission: planInputs.targetCommission,
      target_deals: planInputs.targetDeals,
      avg_fee_percent: planInputs.avgFeePercent,
      commission_percent: planInputs.commissionPercent,
      selected_scenario: selectedScenarioId,
    });
  };

  const handleSubmitForReview = () => {
    if (!plan || !id || !directorId) return;
    submitForApproval({
      planId: plan.id,
      senderId: id,
      directorId,
    });
  };

  const canSubmitForReview = plan && 
    plan.approval_status !== 'pending' && 
    plan.approval_status !== 'pending_approval' && 
    plan.approval_status !== 'approved' &&
    directorId;

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

  const isLoading = loadingSalespeople || loadingCommissions || loadingSummaries || loadingPlan || loadingGoals;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
      {/* Individual Plan Banner - Visually distinct from main planning page */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-600/20 via-primary/20 to-purple-600/20 border-2 border-primary/30 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/sales/person/${id}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{salesperson.name}'s Personal Plan</span>
          </div>
        </div>
      </div>

      {/* Values Section at the top */}
      <div className="mb-6">
        <ValuesSection />
      </div>


      {/* Header - More personalized */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-blue-600/30 border border-primary/20">
            <MapIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Sales Plan {currentYear}</h1>
            <p className="text-muted-foreground">
              Create your annual plan and choose your path to success
            </p>
          </div>
        </div>
        
        {/* Target Reference */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">My Target Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(planInputs.targetRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">My Projected Commission</p>
                <p className="text-2xl font-bold text-emerald-500">{formatCurrency(selectedScenario.projectedCommission)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="glass-card p-1 flex-wrap gap-1">
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
              disabled={isSaving || !id}
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

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          <StrategicFocusSection 
            selectedScenarioId={selectedScenarioId}
            salespersonName={salesperson?.name || "Salesperson"}
            salespersonId={id}
            targetRevenue={planInputs.targetRevenue}
            targetDeals={planInputs.targetDeals}
            avgFeePercent={planInputs.avgFeePercent}
            commissionPercent={planInputs.commissionPercent}
            isTeamView={false}
            teamMemberCount={1}
          />
        </TabsContent>

        {/* Your Plan Tab */}
        <TabsContent value="plan" className="space-y-6">
          <PlanCreator 
            planInputs={planInputs}
            updatePlanInput={updatePlanInput}
            formatCurrency={formatCurrency}
            salespersonName={salesperson?.name}
          />

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
          <WeeklyDealsTracker
            commissions={commissions || []}
            scenario={selectedScenario}
            currentYear={currentYear}
            formatCurrency={formatCurrency}
          />

          <ProgressTracker
            scenario={selectedScenario}
            actualCommissions={actualCommissions}
            formatCurrency={formatCurrency}
            currentYear={currentYear}
          />

          {id && (
            <DealPipeline
              salespersonId={id}
              formatCurrency={formatCurrency}
            />
          )}
        </TabsContent>

        {/* Choose Your Path Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-2">Choose Your Path to {formatCurrency(planInputs.targetRevenue)}</h3>
            <p className="text-muted-foreground mb-6">
              Select the approach that best matches your market opportunity and personal style.
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

          <QuarterlyBreakdown
            scenario={selectedScenario}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* Historical Context Tab */}
        <TabsContent value="historical" className="space-y-6">
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
                </div>

                <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Gap to {currentYear} Target</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(planInputs.targetRevenue - historicalStats.bestYear.totalRevisedEstimate)}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({((planInputs.targetRevenue - historicalStats.bestYear.totalRevisedEstimate) / historicalStats.bestYear.totalRevisedEstimate * 100).toFixed(1)}% growth needed)
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
