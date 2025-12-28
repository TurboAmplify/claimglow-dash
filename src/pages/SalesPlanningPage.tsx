import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useYearSummaries, useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useMemo, useState, useEffect } from "react";
import { Loader2, Target, TrendingUp, BarChart3, Calendar, Map as MapIcon, Layers, Compass, Save, Activity } from "lucide-react";
import { ValuesSection } from "@/components/goals/ValuesSection";
import { PlanCreator } from "@/components/planning/PlanCreator";
import { ScenarioCard } from "@/components/planning/ScenarioCard";
import { ScenarioComparisonChart } from "@/components/planning/ScenarioComparisonChart";
import { QuarterlyBreakdown } from "@/components/planning/QuarterlyBreakdown";
import { StrategicFocusSection } from "@/components/planning/StrategicFocusSection";
import { ProgressTracker } from "@/components/planning/ProgressTracker";
import { WeeklyDealsTracker } from "@/components/planning/WeeklyDealsTracker";
import { DealPipeline } from "@/components/planning/DealPipeline";
import { PendingApprovalsPanel } from "@/components/planning/PendingApprovalsPanel";
import { SalespersonSelector } from "@/components/planning/SalespersonSelector";
import { usePlanScenarios } from "@/hooks/usePlanScenarios";
import { useRoadmapAnalysis } from "@/hooks/useRoadmapAnalysis";
import { useSalesPlan } from "@/hooks/useSalesPlan";
import { useProgressAlerts } from "@/hooks/useProgressAlerts";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

  const { salesperson: currentUser, isDirector, isLoading: loadingCurrentUser } = useCurrentSalesperson();
  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  
  // For directors, allow selecting any salesperson; for reps, use their own ID
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string | undefined>(undefined);
  
  // Set initial selection once data loads
  useEffect(() => {
    if (currentUser && !selectedSalespersonId) {
      setSelectedSalespersonId(currentUser.id);
    }
  }, [currentUser, selectedSalespersonId]);

  const salespersonId = selectedSalespersonId;
  const selectedSalesperson = salespeople?.find(sp => sp.id === salespersonId);
  const salespersonName = selectedSalesperson?.name || 'Salesperson';
  
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions(salespersonId);
  const { data: yearSummaries, isLoading: loadingSummaries } = useYearSummaries(salespersonId);

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

  const { plan, savePlan, isSaving, isLoading: loadingPlan } = useSalesPlan(salespersonId, currentYear);

  // Load saved plan on mount
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

  const isLoading = loadingSalespeople || loadingCommissions || loadingSummaries || loadingPlan || loadingCurrentUser;

  // Get director ID for notifications
  const directorId = salespeople?.find(sp => sp.role === "sales_director")?.id;

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
      {/* Pending Approvals for Directors */}
      {isDirector && directorId && (
        <div className="mb-6">
          <PendingApprovalsPanel 
            directorId={directorId} 
            formatCurrency={formatCurrency} 
          />
        </div>
      )}

      {/* Values Section at the top */}
      <div className="mb-6">
        <ValuesSection />
      </div>

      {/* Header with Salesperson Selector */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
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
          
          {/* Salesperson Selector for Directors */}
          {isDirector && (
            <SalespersonSelector
              selectedId={selectedSalespersonId}
              onSelect={setSelectedSalespersonId}
              showTeamOption
            />
          )}
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

          <Button 
            onClick={handleSavePlan} 
            disabled={isSaving || !salespersonId}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : plan ? "Update Plan" : "Save Plan"}
          </Button>
        </div>

        {/* Your Plan Tab */}
        <TabsContent value="plan" className="space-y-6">
          <PlanCreator 
            planInputs={planInputs}
            updatePlanInput={updatePlanInput}
            formatCurrency={formatCurrency}
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
