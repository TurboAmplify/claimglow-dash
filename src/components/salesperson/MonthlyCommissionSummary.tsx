import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { format, startOfYear, endOfYear, parseISO, getMonth, getYear } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MonthlyCommissionSummaryProps {
  year?: number;
  salespersonId?: string;
}

interface CommissionCheck {
  id: string;
  sales_commission_id: string;
  check_amount: number;
  received_date: string;
  deposited_date: string;
  commission_earned: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function MonthlyCommissionSummary({ year = new Date().getFullYear(), salespersonId }: MonthlyCommissionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: checks = [] } = useQuery({
    queryKey: ["commission_checks", year, salespersonId],
    queryFn: async () => {
      const startDate = format(startOfYear(new Date(year, 0, 1)), "yyyy-MM-dd");
      const endDate = format(endOfYear(new Date(year, 11, 31)), "yyyy-MM-dd");
      
      let query = supabase
        .from("commission_checks")
        .select(`
          id,
          sales_commission_id,
          check_amount,
          received_date,
          deposited_date,
          commission_earned
        `)
        .gte("deposited_date", startDate)
        .lte("deposited_date", endDate)
        .order("deposited_date", { ascending: true });

      // If filtering by salesperson, we need to join through sales_commissions
      if (salespersonId) {
        // First get the sales_commission_ids for this salesperson
        const { data: commissions } = await supabase
          .from("sales_commissions")
          .select("id")
          .eq("salesperson_id", salespersonId);
        
        if (commissions && commissions.length > 0) {
          const commissionIds = commissions.map(c => c.id);
          query = query.in("sales_commission_id", commissionIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommissionCheck[];
    },
  });

  const monthlyData = useMemo(() => {
    const data = MONTHS.map((month, index) => ({
      month,
      monthIndex: index,
      totalChecks: 0,
      totalCommission: 0,
      checkCount: 0,
    }));

    checks.forEach((check) => {
      const depositDate = parseISO(check.deposited_date);
      const monthIndex = getMonth(depositDate);
      
      if (getYear(depositDate) === year) {
        data[monthIndex].totalChecks += check.check_amount;
        data[monthIndex].totalCommission += check.commission_earned;
        data[monthIndex].checkCount += 1;
      }
    });

    return data;
  }, [checks, year]);

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, month) => ({
        totalChecks: acc.totalChecks + month.totalChecks,
        totalCommission: acc.totalCommission + month.totalCommission,
        checkCount: acc.checkCount + month.checkCount,
      }),
      { totalChecks: 0, totalCommission: 0, checkCount: 0 }
    );
  }, [monthlyData]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const currentMonth = new Date().getMonth();

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-secondary/20 transition-colors rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                Monthly Commission ({year})
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary font-bold">{formatCurrency(totals.totalCommission)}</span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-secondary/30">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">YTD Checks</p>
                <p className="font-bold text-sm whitespace-nowrap">{formatCurrency(totals.totalChecks)}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground">YTD Commission</p>
                <p className="font-bold text-sm text-primary whitespace-nowrap">{formatCurrency(totals.totalCommission)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Checks</p>
                <p className="font-bold text-sm">{totals.checkCount}</p>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium mb-2">Monthly Breakdown</p>
              <div className="grid grid-cols-4 gap-1">
                {monthlyData.map((month, index) => {
                  const hasData = month.totalCommission > 0;
                  const isCurrent = index === currentMonth;
                  const isPast = index < currentMonth;
                  
                  return (
                    <div
                      key={month.month}
                      className={`p-2 rounded text-center text-xs transition-colors ${
                        isCurrent 
                          ? 'bg-primary/20 border border-primary/30' 
                          : hasData 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : isPast 
                              ? 'bg-muted/50' 
                              : 'bg-secondary/20'
                      }`}
                    >
                      <p className={`font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                        {month.month}
                      </p>
                      <p className={`font-bold ${hasData ? 'text-green-600' : 'text-muted-foreground/50'}`}>
                        {hasData ? formatCurrency(month.totalCommission) : '-'}
                      </p>
                      {hasData && (
                        <p className="text-muted-foreground text-[10px]">
                          {month.checkCount} check{month.checkCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trend indicator */}
            {totals.totalCommission > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-muted-foreground">
                  Avg. monthly: <span className="font-medium text-foreground">{formatCurrency(totals.totalCommission / (currentMonth + 1))}</span>
                </span>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
