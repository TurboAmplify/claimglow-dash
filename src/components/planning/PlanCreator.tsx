import { Target, DollarSign, Hash, TrendingUp, Info, Sparkles } from "lucide-react";
import { PlanInputs } from "@/hooks/usePlanScenarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDealSizeAnalysis } from "@/hooks/useDealSizeAnalysis";
import { useMemo } from "react";

// Hardcoded commission percentages per salesperson
const SALESPERSON_COMMISSION: Record<string, number> = {
  "Matt Aldrich": 20,
  "Jason Roetter": 25,
  "Richard Goldsmith": 15, // Will change to 20% then 25% at TBD points
};

interface PlanCreatorProps {
  planInputs: PlanInputs;
  updatePlanInput: <K extends keyof PlanInputs>(key: K, value: PlanInputs[K]) => void;
  formatCurrency: (value: number) => string;
  salespersonName?: string;
}

export function PlanCreator({ 
  planInputs, 
  updatePlanInput, 
  formatCurrency, 
  salespersonName,
}: PlanCreatorProps) {
  const { targetRevenue, targetCommission, targetDeals, avgFeePercent } = planInputs;
  
  // Get hardcoded commission for this salesperson
  const commissionPercent = salespersonName ? (SALESPERSON_COMMISSION[salespersonName] ?? 20) : 20;
  const avgDealSize = targetRevenue / (targetDeals || 1);

  // Get deal analysis directly in component so it reacts to calculated values
  const { analysis: dealAnalysis } = useDealSizeAnalysis();

  // Calculate insights based on current avgDealSize - use avgDealSize as primary dependency
  const dealInsights = useMemo(() => {
    if (!dealAnalysis) return null;
    // Call the function with the current avgDealSize
    return dealAnalysis.getInsightsForTargetDealSize(avgDealSize);
  }, [dealAnalysis, avgDealSize, targetDeals, targetCommission, avgFeePercent]);

  // Calculate deal mix based on current targets
  const dealMix = useMemo(() => {
    if (!dealAnalysis) return null;
    return dealAnalysis.getDealMixEstimate(targetDeals, targetRevenue);
  }, [dealAnalysis, targetDeals, targetRevenue]);

  const handleCommissionChange = (value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    updatePlanInput('targetCommission', numValue);
    // Also update targetRevenue to stay in sync: Revenue = Commission / Fee% / Commission%
    const calculatedRevenue = avgFeePercent > 0 && commissionPercent > 0
      ? numValue / (avgFeePercent / 100) / (commissionPercent / 100)
      : 0;
    updatePlanInput('targetRevenue', calculatedRevenue);
  };

  const handleRevenueChange = (value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    // Update targetRevenue directly
    updatePlanInput('targetRevenue', numValue);
    // Calculate commission from revenue: Commission = Revenue × Fee% × Commission%
    const calculatedCommission = numValue * (avgFeePercent / 100) * (commissionPercent / 100);
    updatePlanInput('targetCommission', calculatedCommission);
  };

  // Check if there's a valid fee insight (always show when bucket exists)
  const hasFeeInsight = dealInsights?.bucket && dealInsights.suggestedFeePercent > 0;

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your 2026 Plan</h2>
          <p className="text-sm text-muted-foreground">Set your commission target and see how to achieve it</p>
        </div>
      </div>

      {/* Average Fee & Commission Note */}
      <div className="mb-6 px-4 py-2 bg-muted/30 rounded-lg border border-border/50">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Average Target Fee Goal:</span> {avgFeePercent}%
          <span className="mx-3">•</span>
          <span className="font-medium text-foreground">Commission:</span> {commissionPercent}%
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Target Commission (Editable) */}
        <div className="space-y-2">
          <Label htmlFor="targetCommission" className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            Target Commission
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="targetCommission"
              type="text"
              value={targetCommission.toLocaleString()}
              onChange={(e) => handleCommissionChange(e.target.value)}
              className="pl-7 text-lg font-semibold border-primary/50 focus:border-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground">Your annual commission goal</p>
        </div>

        {/* Number of Deals */}
        <div className="space-y-2">
          <Label htmlFor="targetDeals" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="w-4 h-4" />
            Number of Deals
          </Label>
          <div className="relative">
            <Input
              id="targetDeals"
              type="text"
              inputMode="numeric"
              value={targetDeals.toString()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                const numValue = cleaned === '' ? 1 : parseInt(cleaned, 10);
                updatePlanInput('targetDeals', numValue);
                // Recalculate commission based on new deal count (keeping avg deal size stable means adjusting revenue)
                // OR keep revenue stable and just update the deal count (current behavior)
                // The user sees the avg deal size change, which is the expected behavior
              }}
              className="text-lg font-semibold"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Avg deal size:</p>
            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-semibold transition-all">
              {formatCurrency(avgDealSize)}
            </span>
            {dealInsights?.bucket && (
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs transition-all">
                {dealInsights.bucket.label}
              </span>
            )}
          </div>
        </div>

        {/* Required Revenue (Editable - bidirectional) */}
        <div className="space-y-2">
          <Label htmlFor="requiredRevenue" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            Required Revenue
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="requiredRevenue"
              type="text"
              value={Math.round(targetRevenue).toLocaleString()}
              onChange={(e) => handleRevenueChange(e.target.value)}
              className="pl-7 text-lg font-semibold border-primary/50 focus:border-primary"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Volume needed @ {avgFeePercent}% fee × {commissionPercent}% split
          </p>
        </div>
      </div>

      {/* Historical Insights Section */}
      {dealInsights && (
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Historical Insights</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">Based on analysis of historical deal data</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Deal Size Category */}
            {dealInsights.bucket && (
              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Deal Size Category</p>
                <p className="text-sm font-medium text-foreground">
                  {dealInsights.bucket.label} deals
                  <span className="text-muted-foreground font-normal"> ({dealInsights.bucket.count} historical)</span>
                </p>
              </div>
            )}

            {/* Historical Fee for This Size */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs text-muted-foreground">Avg Fee for This Deal Size</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="inline-flex">
                      <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="w-72 p-3">
                    <p className="text-xs font-semibold mb-2">Historical Avg Fee by Deal Size</p>
                    <div className="space-y-1.5">
                      {dealAnalysis?.buckets.map((bucket) => (
                        <div key={bucket.label} className="flex justify-between text-xs">
                          <span className={`${dealInsights?.bucket?.label === bucket.label ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {bucket.label} {bucket.max === Infinity ? `(>$${(bucket.min / 1000000).toFixed(1)}M)` : `($${bucket.min >= 1000000 ? (bucket.min / 1000000).toFixed(1) + 'M' : Math.round(bucket.min / 1000) + 'K'}-$${bucket.max >= 1000000 ? (bucket.max / 1000000).toFixed(1) + 'M' : Math.round(bucket.max / 1000) + 'K'})`}
                          </span>
                          <span className={`font-mono ${dealInsights?.bucket?.label === bucket.label ? 'text-primary font-semibold' : 'text-foreground'}`}>
                            {bucket.count > 0 ? `${bucket.avgFeePercent.toFixed(2)}%` : '—'}
                            <span className="text-muted-foreground ml-1">({bucket.count})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                      Current selection highlighted. Count shows historical deals.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {dealInsights.suggestedFeePercent.toFixed(2)}%
                  {hasFeeInsight && (
                    <span className={`ml-2 text-xs ${dealInsights.suggestedFeePercent > avgFeePercent ? 'text-green-500' : 'text-amber-500'}`}>
                      ({dealInsights.suggestedFeePercent > avgFeePercent ? '+' : ''}{(dealInsights.suggestedFeePercent - avgFeePercent).toFixed(2)}% vs target)
                    </span>
                  )}
                </p>
                {hasFeeInsight && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => {
                      const newFee = Math.round(dealInsights.suggestedFeePercent * 100) / 100;
                      // Recalculate commission based on current revenue and new fee
                      const newCommission = targetRevenue * (newFee / 100) * (commissionPercent / 100);
                      updatePlanInput('avgFeePercent', newFee);
                      updatePlanInput('targetCommission', Math.round(newCommission));
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Apply
                  </Button>
                )}
              </div>
            </div>

            {/* Historical Avg Deal Size */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Historical Avg in Category</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(dealInsights.historicalAvgForBucket)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Deal Mix Estimate */}
      {dealMix && targetDeals > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Estimated Deal Mix (based on avg deal size of {formatCurrency(dealMix.avgDealSize)})</p>
          <div className="flex flex-wrap gap-2">
            {dealMix.residential > 0 && (
              <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                {dealMix.residential} Residential (&lt;$350K)
              </span>
            )}
            {dealMix.residentialPlus > 0 && (
              <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                {dealMix.residentialPlus} Residential+ ($350K-$750K)
              </span>
            )}
            {dealMix.midCommercial > 0 && (
              <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                {dealMix.midCommercial} Mid-Commercial ($750K-$1.5M)
              </span>
            )}
            {dealMix.largeCommercial > 0 && (
              <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs">
                {dealMix.largeCommercial} Large Commercial ($1.5M-$3M)
              </span>
            )}
            {dealMix.industrial > 0 && (
              <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
                {dealMix.industrial} Industrial ($3M-$7.5M)
              </span>
            )}
            {dealMix.mega > 0 && (
              <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs">
                {dealMix.mega} Mega (&gt;$7.5M)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Formula: </span>
            <span className="font-mono text-foreground">
              Commission ÷ Fee% ÷ Split% = Required Revenue
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Calculation: </span>
            <span className="font-mono text-foreground">
              {formatCurrency(targetCommission)} ÷ {avgFeePercent}% ÷ {commissionPercent}% = {formatCurrency(targetRevenue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
