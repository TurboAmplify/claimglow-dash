import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Target, TrendingUp, Flame } from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, format, isWithinInterval, parseISO, differenceInDays } from "date-fns";

interface SalesCommission {
  id: string;
  client_name: string;
  date_signed: string | null;
  initial_estimate: number | null;
  year: number | null;
}

interface ScenarioPath {
  dealCount: number;
  quarterlyBreakdown: {
    q1: { deals: number; volume: number };
    q2: { deals: number; volume: number };
    q3: { deals: number; volume: number };
    q4: { deals: number; volume: number };
  };
}

interface WeeklyDealsTrackerProps {
  commissions: SalesCommission[];
  scenario: ScenarioPath | null;
  currentYear: number;
  formatCurrency: (value: number) => string;
}

export function WeeklyDealsTracker({
  commissions,
  scenario,
  currentYear,
  formatCurrency,
}: WeeklyDealsTrackerProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
  const monthStart = startOfMonth(today);

  const stats = useMemo(() => {
    const yearCommissions = commissions.filter(c => c.year === currentYear);
    
    // This week's deals
    const thisWeekDeals = yearCommissions.filter(c => {
      if (!c.date_signed) return false;
      const date = parseISO(c.date_signed);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });

    // Month-to-date deals
    const mtdDeals = yearCommissions.filter(c => {
      if (!c.date_signed) return false;
      const date = parseISO(c.date_signed);
      return isWithinInterval(date, { start: monthStart, end: today });
    });

    // Calculate weekly target from scenario
    const weeksInYear = 52;
    const weeklyTarget = scenario ? Math.ceil(scenario.dealCount / weeksInYear) : 1;

    // Calculate MTD expected based on day of month
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthProgress = dayOfMonth / daysInMonth;
    const monthlyTarget = scenario ? Math.ceil(scenario.dealCount / 12) : 4;
    const mtdExpected = Math.round(monthlyTarget * monthProgress);

    // Calculate weekly streak (consecutive weeks meeting target)
    let streak = 0;
    let checkDate = new Date(weekStart);
    checkDate.setDate(checkDate.getDate() - 7); // Start from last week

    for (let i = 0; i < 12; i++) { // Check up to 12 weeks back
      const checkWeekStart = startOfWeek(checkDate, { weekStartsOn: 1 });
      const checkWeekEnd = endOfWeek(checkDate, { weekStartsOn: 1 });
      
      const weekDeals = yearCommissions.filter(c => {
        if (!c.date_signed) return false;
        const date = parseISO(c.date_signed);
        return isWithinInterval(date, { start: checkWeekStart, end: checkWeekEnd });
      });

      if (weekDeals.length >= weeklyTarget) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 7);
      } else {
        break;
      }
    }

    const mtdPacing = mtdExpected > 0 ? (mtdDeals.length / mtdExpected) * 100 : 100;
    const thisWeekValue = thisWeekDeals.reduce((sum, d) => sum + (d.initial_estimate || 0), 0);

    return {
      thisWeekDeals,
      thisWeekCount: thisWeekDeals.length,
      thisWeekValue,
      weeklyTarget,
      mtdDeals: mtdDeals.length,
      mtdExpected,
      mtdPacing,
      monthlyTarget,
      streak,
      weekStart,
      weekEnd,
    };
  }, [commissions, scenario, currentYear, weekStart, weekEnd, monthStart, today]);

  const getStatusColor = (actual: number, target: number) => {
    if (actual >= target) return "text-green-500";
    if (actual >= target * 0.75) return "text-yellow-500";
    return "text-red-500";
  };

  const getPacingBadge = (pacing: number) => {
    if (pacing >= 100) return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">On Pace</Badge>;
    if (pacing >= 75) return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Slightly Behind</Badge>;
    return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Behind Pace</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Weekly Deals Tracker
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Week of {format(stats.weekStart, "MMM d")} - {format(stats.weekEnd, "MMM d")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* This Week */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              This Week
            </div>
            <div className={`text-3xl font-bold ${getStatusColor(stats.thisWeekCount, stats.weeklyTarget)}`}>
              {stats.thisWeekCount}
            </div>
            <div className="text-sm text-muted-foreground">
              Target: {stats.weeklyTarget} deal{stats.weeklyTarget !== 1 ? "s" : ""}
            </div>
            {stats.thisWeekDeals.length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Closed this week:</p>
                {stats.thisWeekDeals.slice(0, 2).map(deal => (
                  <p key={deal.id} className="text-xs truncate">
                    {deal.client_name} ({formatCurrency(deal.initial_estimate || 0)})
                  </p>
                ))}
                {stats.thisWeekDeals.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{stats.thisWeekDeals.length - 2} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Month-to-Date */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Month-to-Date
              </div>
              {getPacingBadge(stats.mtdPacing)}
            </div>
            <div className="text-3xl font-bold">
              {stats.mtdDeals} / {stats.monthlyTarget}
            </div>
            <div className="text-sm text-muted-foreground">
              Expected by now: {stats.mtdExpected}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.mtdPacing >= 100 ? "bg-green-500" : stats.mtdPacing >= 75 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(stats.mtdPacing, 100)}%` }}
              />
            </div>
          </div>

          {/* Weekly Streak */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4" />
              Weekly Streak
            </div>
            <div className={`text-3xl font-bold ${stats.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
              {stats.streak} week{stats.streak !== 1 ? "s" : ""}
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.streak > 0 
                ? `Consecutive weeks meeting ${stats.weeklyTarget}+ deal target`
                : "Meet your weekly target to start a streak"
              }
            </div>
            {stats.streak >= 4 && (
              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                🔥 Hot streak!
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
