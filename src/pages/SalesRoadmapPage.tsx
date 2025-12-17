import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSalesCommissions, useSalespeople, useYearSummaries } from "@/hooks/useSalesCommissions";
import { useRoadmapAnalysis, ScenarioProjection } from "@/hooks/useRoadmapAnalysis";
import { useState, useMemo } from "react";
import { Loader2, Map as MapIcon, TrendingUp, Calendar, BarChart3, Target, Info, CheckCircle2, Layers } from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  ReferenceLine
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SCENARIO_COLORS = {
  'steady-residential': 'hsl(var(--primary))',
  'quarterly-impact': '#22c55e',
  'relationship-driven': '#f59e0b',
  'hybrid-adaptive': '#06b6d4',
};

const TARGET_REVENUE = 55000000;

export default function SalesRoadmapPage() {
  const { data: salespeople } = useSalespeople();
  const salespersonId = salespeople?.[0]?.id;
  const salespersonName = salespeople?.[0]?.name || 'Matthew Aldrich';
  
  const { data: commissions, isLoading } = useSalesCommissions(salespersonId);
  const { data: yearSummaries } = useYearSummaries(salespersonId);
  
  const { historicalPatterns, scenarios } = useRoadmapAnalysis(commissions, TARGET_REVENUE);
  
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['hybrid-adaptive']);
  const [activeTab, setActiveTab] = useState('roadmap');

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioId) 
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  // YTD actual data for comparison (2025)
  const ytdActual = useMemo(() => {
    if (!commissions) return [];
    
    const currentYear = 2025;
    const currentYearCommissions = commissions.filter(c => c.year === currentYear);
    
    const monthlyActual = new globalThis.Map<number, number>();
    currentYearCommissions.forEach(c => {
      if (!c.date_signed) return;
      const month = new Date(c.date_signed).getMonth() + 1;
      monthlyActual.set(month, (monthlyActual.get(month) || 0) + (c.revised_estimate || c.initial_estimate || 0));
    });

    let cumulative = 0;
    return Array.from({ length: 12 }, (_, i) => {
      const volume = monthlyActual.get(i + 1) || 0;
      cumulative += volume;
      return { month: i + 1, volume, cumulative };
    });
  }, [commissions]);

  // Combined chart data for scenario comparison
  const comparisonChartData = useMemo(() => {
    if (!scenarios.length) return [];
    
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return MONTHS.map((monthName, i) => {
      const dataPoint: Record<string, number | string> = { month: monthName };
      
      scenarios.forEach(scenario => {
        const mp = scenario.monthlyProjections[i];
        dataPoint[scenario.id] = mp?.cumulativeVolume || 0;
      });
      
      // Add actual YTD
      const actual = ytdActual[i];
      if (actual) {
        dataPoint['actual'] = actual.cumulative;
      }
      
      return dataPoint;
    });
  }, [scenarios, ytdActual]);

  // Historical seasonality data
  const seasonalityData = useMemo(() => {
    if (!historicalPatterns) return [];
    return historicalPatterns.monthlyPatterns.map(mp => ({
      month: mp.monthName,
      avgVolume: mp.avgVolume,
      avgDeals: mp.avgDeals,
    }));
  }, [historicalPatterns]);

  // Year-over-year comparison
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
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <MapIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Roadmap</h1>
            <p className="text-muted-foreground">
              {salespersonName} — Scenario Planning for 2026
            </p>
          </div>
        </div>
        
        {/* North Star Reference */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Annual Pursued Opportunity Objective</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(TARGET_REVENUE)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-md">
              This roadmap reflects how {salespersonName} has actually performed in the past and shows multiple realistic ways to reach this objective.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-card p-1">
          <TabsTrigger value="roadmap" className="data-[state=active]:bg-primary/20">
            <MapIcon className="w-4 h-4 mr-2" />
            Roadmap Scenarios
          </TabsTrigger>
          <TabsTrigger value="historical" className="data-[state=active]:bg-primary/20">
            <BarChart3 className="w-4 h-4 mr-2" />
            Historical Patterns
          </TabsTrigger>
          <TabsTrigger value="planning" className="data-[state=active]:bg-primary/20">
            <Calendar className="w-4 h-4 mr-2" />
            Planning Context
          </TabsTrigger>
        </TabsList>

        {/* Roadmap Scenarios Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          {/* Scenario Selector */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Select Scenarios to Compare
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => toggleScenario(scenario.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all duration-200",
                    selectedScenarios.includes(scenario.id)
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SCENARIO_COLORS[scenario.id as keyof typeof SCENARIO_COLORS] }}
                    />
                    {scenario.isHistoricallyProven ? (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Proven
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Info className="w-3 h-3 mr-1" />
                        Modeled
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm">{scenario.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scenario.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cumulative Trajectory Chart */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Cumulative Trajectory to {formatCurrency(TARGET_REVENUE)}</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    const label = scenarios.find(s => s.id === name)?.name || (name === 'actual' ? '2025 Actual' : name);
                    return [formatCurrency(value), label];
                  }}
                />
                <Legend 
                  formatter={(value) => scenarios.find(s => s.id === value)?.name || (value === 'actual' ? '2025 Actual (YTD)' : value)}
                />
                <ReferenceLine y={TARGET_REVENUE} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                
                {selectedScenarios.includes('steady-residential') && (
                  <Area 
                    type="monotone" 
                    dataKey="steady-residential" 
                    stroke={SCENARIO_COLORS['steady-residential']}
                    fill={SCENARIO_COLORS['steady-residential']}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                {selectedScenarios.includes('quarterly-impact') && (
                  <Area 
                    type="monotone" 
                    dataKey="quarterly-impact" 
                    stroke={SCENARIO_COLORS['quarterly-impact']}
                    fill={SCENARIO_COLORS['quarterly-impact']}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                {selectedScenarios.includes('relationship-driven') && (
                  <Area 
                    type="monotone" 
                    dataKey="relationship-driven" 
                    stroke={SCENARIO_COLORS['relationship-driven']}
                    fill={SCENARIO_COLORS['relationship-driven']}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                {selectedScenarios.includes('hybrid-adaptive') && (
                  <Area 
                    type="monotone" 
                    dataKey="hybrid-adaptive" 
                    stroke={SCENARIO_COLORS['hybrid-adaptive']}
                    fill={SCENARIO_COLORS['hybrid-adaptive']}
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#ef4444"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Scenario Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scenarios.filter(s => selectedScenarios.includes(s.id)).map((scenario, index) => (
              <div 
                key={scenario.id} 
                className="glass-card p-6 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: SCENARIO_COLORS[scenario.id as keyof typeof SCENARIO_COLORS] }}
                  />
                  <h4 className="text-lg font-semibold text-foreground">{scenario.name}</h4>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Total Deals</p>
                    <p className="text-xl font-bold text-foreground">{scenario.summary.totalDeals}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(scenario.summary.avgDealSize)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Total Volume</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(scenario.summary.totalVolume)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Assumptions</p>
                  <ul className="space-y-1">
                    {scenario.summary.keyAssumptions.map((assumption, i) => (
                      <li key={i} className={cn(
                        "text-sm flex items-start gap-2",
                        assumption.startsWith('*') ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        <span className="text-primary mt-0.5">•</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Historical Patterns Tab */}
        <TabsContent value="historical" className="space-y-6">
          {historicalPatterns && (
            <>
              {/* Yearly Performance */}
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
                      formatter={(value: number, name: string) => [
                        name === 'volume' ? formatCurrency(value) : value,
                        name === 'volume' ? 'Total Volume' : name === 'deals' ? 'Deals' : 'Avg Deal Size'
                      ]}
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Average monthly volume based on historical data
                  </p>
                </div>

                {/* Quarterly Distribution */}
                <div className="glass-card p-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quarterly Concentration</h3>
                  <div className="space-y-4">
                    {historicalPatterns.quarterlyPatterns.map((q) => (
                      <div key={q.quarter}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Q{q.quarter}</span>
                          <span className="text-foreground font-medium">{q.percentOfYear.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${q.percentOfYear}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          ~{q.avgDeals.toFixed(1)} deals • {formatCurrency(q.avgVolume)} avg
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall Historical Stats */}
              <div className="glass-card p-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-foreground mb-4">Historical Performance Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(historicalPatterns.overallStats.avgDealSize)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Median Deal</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(historicalPatterns.overallStats.medianDealSize)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Deals/Year</p>
                    <p className="text-xl font-bold text-foreground">{historicalPatterns.overallStats.avgDealsPerYear.toFixed(1)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Avg Volume/Year</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(historicalPatterns.overallStats.avgVolumePerYear)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/20 border border-primary/30">
                    <p className="text-xs text-muted-foreground">Best Year</p>
                    <p className="text-xl font-bold text-primary">{historicalPatterns.overallStats.bestYear}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/20 border border-primary/30">
                    <p className="text-xs text-muted-foreground">Best Year Volume</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(historicalPatterns.overallStats.bestYearVolume)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Planning Context Tab */}
        <TabsContent value="planning" className="space-y-6">
          {/* Opportunity Size Bands */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Opportunity Size Bands (Contextual)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border/50">
                <p className="font-semibold text-foreground">Large Residential</p>
                <p className="text-2xl font-bold text-primary mt-2">$350K–$750K+</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {historicalPatterns?.sizeBands.largeResidential.count || 0} historical deals
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/50">
                <p className="font-semibold text-foreground">Mid-Commercial</p>
                <p className="text-2xl font-bold text-emerald-500 mt-2">$1M–$2M</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {historicalPatterns?.sizeBands.midCommercial.count || 0} historical deals
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/50">
                <p className="font-semibold text-foreground">Large Commercial/Industrial</p>
                <p className="text-2xl font-bold text-amber-500 mt-2">$5M–$10M+</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {historicalPatterns?.sizeBands.largeCommercial.count || 0} historical deals
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/50">
                <p className="font-semibold text-foreground">Religious/Campus</p>
                <p className="text-2xl font-bold text-cyan-500 mt-2">$1M+</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Specialized category
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              These bands are for categorization and modeling context, not gating logic.
            </p>
          </div>

          {/* Monthly Planning Ranges */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Monthly & Quarterly Planning Context</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Typical Monthly Pursued Range</p>
                  <Badge variant="outline">Rolling Average</Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency((historicalPatterns?.overallStats.avgVolumePerYear || 0) / 12 * 0.7)} – {formatCurrency((historicalPatterns?.overallStats.avgVolumePerYear || 0) / 12 * 1.3)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on historical monthly variance
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Typical Quarterly Concentration</p>
                  <Badge variant="outline">Historical Pattern</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {historicalPatterns?.quarterlyPatterns.map(q => (
                    <div key={q.quarter} className="text-center p-2 rounded-lg bg-background/50">
                      <p className="text-xs text-muted-foreground">Q{q.quarter}</p>
                      <p className="font-bold text-foreground">{q.percentOfYear.toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Q4 Phase Overlay */}
          <div className="glass-card p-6 animate-fade-in border-l-4 border-l-cyan-500">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <Calendar className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Q4 Phase Context</h3>
                <p className="text-muted-foreground mb-4">
                  Based on {salespersonName}'s historical Q4 behavior, this period typically emphasizes:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    Conversion of existing pipeline opportunities
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    Pipeline cleanup and positioning for next year
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    Early next-year relationship building
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4 italic">
                  This is contextual insight, not instruction. Q4 historically represents {historicalPatterns?.quarterlyPatterns[3]?.percentOfYear.toFixed(0) || 25}% of annual volume.
                </p>
              </div>
            </div>
          </div>

          {/* Pre-Loss Relationships Note */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Pre-Loss / Positioned Relationships</h3>
            <p className="text-muted-foreground mb-4">
              Positioned and pre-loss relationships represent future leverage, not short-term pressure. These are opportunities where relationships have been established before a loss occurs.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <Info className="w-4 h-4 inline mr-2" />
                The Relationship-Driven scenario (Scenario C) models the potential contribution of these relationships based on historical conversion patterns.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
