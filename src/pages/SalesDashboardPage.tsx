import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSalesCommissions, useSalespeople, useAvailableYears, useYearSummaries } from "@/hooks/useSalesCommissions";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2, TrendingUp, TrendingDown, DollarSign, FileText, Percent, Target, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#22c55e', '#f59e0b', '#ef4444'];

export default function SalesDashboardPage() {
  const { data: salespeople } = useSalespeople();
  const { data: availableYears } = useAvailableYears();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Fetch ALL commissions (no salesperson filter) for team-wide dashboard
  const { data: commissions, isLoading } = useSalesCommissions(
    undefined, // No filter - show all salespeople
    selectedYear || undefined
  );
  const { data: yearSummaries } = useYearSummaries(); // No filter - show all

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

  const stats = useMemo(() => {
    if (!commissions || commissions.length === 0) return null;
    
    const totalDeals = commissions.length;
    const totalInitial = commissions.reduce((sum, c) => sum + (c.initial_estimate || 0), 0);
    const totalRevised = commissions.reduce((sum, c) => sum + (c.revised_estimate || 0), 0);
    const avgSplit = commissions.reduce((sum, c) => sum + (c.split_percentage || 100), 0) / totalDeals;
    const avgFee = commissions.reduce((sum, c) => sum + (c.fee_percentage || 0), 0) / totalDeals;
    const avgCommission = commissions.reduce((sum, c) => sum + (c.commission_percentage || 0), 0) / totalDeals;
    const totalPaid = commissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);
    
    // Calculate projected vs actual
    const projectedComm = commissions.reduce((sum, c) => {
      return sum + (c.initial_estimate || 0) * ((c.split_percentage || 100) / 100) * ((c.fee_percentage || 0) / 100) * ((c.commission_percentage || 0) / 100);
    }, 0);
    
    const actualComm = commissions.reduce((sum, c) => {
      return sum + (c.revised_estimate || 0) * ((c.split_percentage || 100) / 100) * ((c.fee_percentage || 0) / 100) * ((c.commission_percentage || 0) / 100);
    }, 0);
    
    return {
      totalDeals,
      totalInitial,
      totalRevised,
      avgSplit,
      avgFee,
      avgCommission,
      totalPaid,
      projectedComm,
      actualComm,
      variance: actualComm - projectedComm,
    };
  }, [commissions]);

  const monthlyData = useMemo(() => {
    if (!commissions) return [];
    
    const monthMap = new Map<string, { initial: number; revised: number; count: number }>();
    
    commissions.forEach(c => {
      if (!c.date_signed) return;
      const month = c.date_signed.substring(0, 7); // YYYY-MM
      const existing = monthMap.get(month) || { initial: 0, revised: 0, count: 0 };
      existing.initial += c.initial_estimate || 0;
      existing.revised += c.revised_estimate || 0;
      existing.count += 1;
      monthMap.set(month, existing);
    });
    
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        initial: data.initial,
        revised: data.revised,
        deals: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [commissions]);

  const yearComparisonData = useMemo(() => {
    if (!yearSummaries) return [];
    return yearSummaries
      .map(s => ({
        year: s.year.toString(),
        volume: s.totalRevisedEstimate,
        deals: s.totalDeals,
        commission: s.totalCommissionsPaid,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // ascending order (oldest first)
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sales Dashboard</h1>
          <p className="text-muted-foreground">
            Team Overview - {salespeople?.length || 0} Salespeople
          </p>
        </div>
        
        <Select
          value={selectedYear?.toString() || "all"}
          onValueChange={(v) => setSelectedYear(v === "all" ? null : parseInt(v))}
        >
          <SelectTrigger className="w-40 bg-background">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {availableYears?.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!commissions || commissions.length === 0 ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">No commission data found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Import your commission data to see analytics.
          </p>
          <Link to="/import-commissions">
            <Button className="mt-6">
              <Upload className="w-4 h-4 mr-2" />
              Import Commission Data
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Total Deals</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats?.totalDeals}</p>
            </div>
            
            <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-sm text-muted-foreground">Total Volume</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.totalRevised || 0)}</p>
            </div>
            
            <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Percent className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-sm text-muted-foreground">Avg Split %</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats?.avgSplit.toFixed(1)}%</p>
            </div>
            
            <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Target className="w-5 h-5 text-cyan-500" />
                </div>
                <span className="text-sm text-muted-foreground">Avg Fee %</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats?.avgFee.toFixed(1)}%</p>
            </div>
          </div>

          {/* Commission Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-5 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Projected Commission</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.projectedComm || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Based on initial estimates</p>
            </div>
            
            <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Actual Commission</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats?.actualComm || 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Based on revised estimates</p>
            </div>
            
            <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-2">
                {(stats?.variance || 0) >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">Variance</span>
              </div>
              <p className={`text-2xl font-bold ${(stats?.variance || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                {(stats?.variance || 0) >= 0 ? '+' : ''}{formatCurrency(stats?.variance || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Actual vs Projected</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Monthly Volume Chart */}
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="revised" name="Revised Volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Year Comparison */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Year-over-Year Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={yearComparisonData}>
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
                  <Line type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Deals Table */}
          <div className="glass-table overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-glass-border/30">
              <h3 className="text-lg font-semibold text-foreground">Commission Details</h3>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-glass-bg">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">Client</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">Salesperson</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Initial Est.</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Revised Est.</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">% Change</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Split %</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Fee %</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Comm. Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.slice(0, 50).map((c) => {
                    const salesperson = salespeople?.find(sp => sp.id === c.salesperson_id);
                    return (
                      <tr key={c.id} className="border-b border-glass-border/20 hover:bg-secondary/20">
                        <td className="px-4 py-3 font-medium text-foreground">{c.client_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{salesperson?.name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.date_signed || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(c.initial_estimate || 0)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(c.revised_estimate || 0)}</td>
                        <td className={`px-4 py-3 text-right font-mono ${(c.percent_change || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                          {(c.percent_change || 0) >= 0 ? '+' : ''}{(c.percent_change || 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{c.split_percentage || 100}%</td>
                        <td className="px-4 py-3 text-right font-mono">{c.fee_percentage || 0}%</td>
                        <td className="px-4 py-3 text-right font-mono text-primary">{formatCurrency(c.commissions_paid || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
