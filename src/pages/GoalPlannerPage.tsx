import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useYearSummaries, useSalespeople } from "@/hooks/useSalesCommissions";
import { useState, useMemo } from "react";
import { Loader2, Target, TrendingUp, Calculator, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";

export default function GoalPlannerPage() {
  const { data: salespeople } = useSalespeople();
  const salespersonId = salespeople?.[0]?.id;
  const { data: yearSummaries, isLoading } = useYearSummaries(salespersonId);
  
  const [targetRevenue, setTargetRevenue] = useState(55000000);
  const [maxDeals, setMaxDeals] = useState(50);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const historicalStats = useMemo(() => {
    if (!yearSummaries || yearSummaries.length === 0) return null;
    
    const totalDeals = yearSummaries.reduce((sum, y) => sum + y.totalDeals, 0);
    const totalVolume = yearSummaries.reduce((sum, y) => sum + y.totalRevisedEstimate, 0);
    const avgDealSize = totalVolume / totalDeals;
    const avgDealsPerYear = totalDeals / yearSummaries.length;
    const avgFee = yearSummaries.reduce((sum, y) => sum + y.avgFeePercentage, 0) / yearSummaries.length;
    const avgSplit = yearSummaries.reduce((sum, y) => sum + y.avgSplitPercentage, 0) / yearSummaries.length;
    const avgCommission = yearSummaries.reduce((sum, y) => sum + y.avgCommissionPercentage, 0) / yearSummaries.length;
    
    // Best year
    const bestYear = yearSummaries.reduce((best, y) => 
      y.totalRevisedEstimate > best.totalRevisedEstimate ? y : best
    );
    
    return {
      totalDeals,
      totalVolume,
      avgDealSize,
      avgDealsPerYear,
      avgFee,
      avgSplit,
      avgCommission,
      bestYear,
      years: yearSummaries.length,
    };
  }, [yearSummaries]);

  const projections = useMemo(() => {
    if (!historicalStats) return null;
    
    // Required average deal size to hit target with max deals
    const requiredDealSize = targetRevenue / maxDeals;
    
    // How many deals needed at current average deal size
    const dealsNeededAtCurrentAvg = Math.ceil(targetRevenue / historicalStats.avgDealSize);
    
    // Projected commission at target revenue
    const projectedCommission = targetRevenue * (historicalStats.avgSplit / 100) * (historicalStats.avgFee / 100) * (historicalStats.avgCommission / 100);
    
    // Gap analysis
    const gapFromTarget = targetRevenue - historicalStats.bestYear.totalRevisedEstimate;
    const percentGrowthNeeded = (gapFromTarget / historicalStats.bestYear.totalRevisedEstimate) * 100;
    
    return {
      requiredDealSize,
      dealsNeededAtCurrentAvg,
      projectedCommission,
      gapFromTarget,
      percentGrowthNeeded,
    };
  }, [historicalStats, targetRevenue, maxDeals]);

  const chartData = useMemo(() => {
    if (!yearSummaries) return [];
    
    const data = yearSummaries.map(y => ({
      year: y.year.toString(),
      volume: y.totalRevisedEstimate,
      deals: y.totalDeals,
    })).reverse();
    
    // Add projected year
    if (projections) {
      data.push({
        year: 'Goal',
        volume: targetRevenue,
        deals: maxDeals,
      });
    }
    
    return data;
  }, [yearSummaries, targetRevenue, maxDeals, projections]);

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
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">Goal Planner</h1>
        <p className="text-muted-foreground">
          Plan your sales targets based on historical performance
        </p>
      </div>

      {!yearSummaries || yearSummaries.length === 0 ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No historical data available.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Import your commission data to start planning.
          </p>
        </div>
      ) : (
        <>
          {/* Goal Inputs */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Set Your Goals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="targetRevenue" className="text-muted-foreground">Target Revenue</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="targetRevenue"
                    type="number"
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(Number(e.target.value))}
                    className="pl-9 bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(targetRevenue)}</p>
              </div>
              <div>
                <Label htmlFor="maxDeals" className="text-muted-foreground">Maximum Deals</Label>
                <Input
                  id="maxDeals"
                  type="number"
                  value={maxDeals}
                  onChange={(e) => setMaxDeals(Number(e.target.value))}
                  className="mt-2 bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">Deals you can realistically close</p>
              </div>
            </div>
          </div>

          {/* Projections */}
          {projections && historicalStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Required Avg Deal</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(projections.requiredDealSize)}</p>
                <p className="text-xs text-muted-foreground mt-1">To hit {formatCurrency(targetRevenue)} with {maxDeals} deals</p>
              </div>
              
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Deals at Current Avg</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{projections.dealsNeededAtCurrentAvg}</p>
                <p className="text-xs text-muted-foreground mt-1">At {formatCurrency(historicalStats.avgDealSize)} avg</p>
              </div>
              
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Projected Commission</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(projections.projectedCommission)}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on historical rates</p>
              </div>
              
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Target className="w-5 h-5 text-cyan-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Growth Needed</span>
                </div>
                <p className={`text-2xl font-bold ${projections.percentGrowthNeeded > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {projections.percentGrowthNeeded > 0 ? '+' : ''}{projections.percentGrowthNeeded.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">vs best year ({historicalStats.bestYear.year})</p>
              </div>
            </div>
          )}

          {/* Historical Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">Volume vs Goal</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Volume']}
                  />
                  <ReferenceLine y={targetRevenue} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Goal', fill: 'hsl(var(--destructive))' }} />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Historical Stats */}
            {historicalStats && (
              <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <h3 className="text-lg font-semibold text-foreground mb-4">Historical Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">Total Deals ({historicalStats.years} years)</span>
                    <span className="font-bold text-foreground">{historicalStats.totalDeals}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">Total Volume</span>
                    <span className="font-bold text-foreground">{formatCurrency(historicalStats.totalVolume)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">Average Deal Size</span>
                    <span className="font-bold text-foreground">{formatCurrency(historicalStats.avgDealSize)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">Average Deals/Year</span>
                    <span className="font-bold text-foreground">{historicalStats.avgDealsPerYear.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">Best Year</span>
                    <span className="font-bold text-primary">{historicalStats.bestYear.year} ({formatCurrency(historicalStats.bestYear.totalRevisedEstimate)})</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">Average Fee %</span>
                    <span className="font-bold text-foreground">{historicalStats.avgFee.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strategy Recommendations */}
          {projections && historicalStats && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">Strategy to Hit {formatCurrency(targetRevenue)}</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-foreground font-medium mb-1">Option 1: Increase Deal Size</p>
                  <p className="text-sm text-muted-foreground">
                    Close {maxDeals} deals at an average of <strong>{formatCurrency(projections.requiredDealSize)}</strong> each.
                    {projections.requiredDealSize > historicalStats.avgDealSize && (
                      <span className="text-amber-500"> This is {((projections.requiredDealSize / historicalStats.avgDealSize - 1) * 100).toFixed(0)}% higher than your historical average.</span>
                    )}
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-foreground font-medium mb-1">Option 2: Increase Volume</p>
                  <p className="text-sm text-muted-foreground">
                    Maintain your average deal size of <strong>{formatCurrency(historicalStats.avgDealSize)}</strong> and close <strong>{projections.dealsNeededAtCurrentAvg} deals</strong>.
                    {projections.dealsNeededAtCurrentAvg > historicalStats.avgDealsPerYear && (
                      <span className="text-amber-500"> This is {((projections.dealsNeededAtCurrentAvg / historicalStats.avgDealsPerYear - 1) * 100).toFixed(0)}% more deals than your yearly average.</span>
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-foreground font-medium mb-1">Estimated Commission</p>
                  <p className="text-sm text-muted-foreground">
                    At your historical rates ({historicalStats.avgSplit.toFixed(0)}% split, {historicalStats.avgFee.toFixed(0)}% fee, {historicalStats.avgCommission.toFixed(0)}% commission), 
                    hitting {formatCurrency(targetRevenue)} would yield approximately <strong className="text-emerald-500">{formatCurrency(projections.projectedCommission)}</strong> in commissions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
