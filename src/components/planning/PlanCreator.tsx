import { Target, DollarSign, Hash, TrendingUp, Info } from "lucide-react";
import { PlanInputs } from "@/hooks/usePlanScenarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hardcoded commission percentages per salesperson
const SALESPERSON_COMMISSION: Record<string, number> = {
  "Matt Aldrich": 20,
  "Jason Roetter": 25,
  "Richard Goldsmith": 15, // Will change to 20% then 25% at TBD points
};

interface DealInsights {
  bucket: { label: string; avgFeePercent: number; count: number } | null;
  suggestedFeePercent: number;
  historicalAvgForBucket: number;
}

interface DealMixEstimate {
  small: number;
  medium: number;
  large: number;
  veryLarge: number;
  avgDealSize: number;
}

interface PlanCreatorProps {
  planInputs: PlanInputs;
  updatePlanInput: <K extends keyof PlanInputs>(key: K, value: PlanInputs[K]) => void;
  formatCurrency: (value: number) => string;
  salespersonName?: string;
  dealInsights?: DealInsights | null;
  dealMix?: DealMixEstimate | null;
}

export function PlanCreator({ 
  planInputs, 
  updatePlanInput, 
  formatCurrency, 
  salespersonName,
  dealInsights,
  dealMix 
}: PlanCreatorProps) {
  const { targetRevenue, targetCommission, targetDeals, avgFeePercent } = planInputs;
  
  // Get hardcoded commission for this salesperson
  const commissionPercent = salespersonName ? (SALESPERSON_COMMISSION[salespersonName] ?? 20) : 20;

  // Calculate required volume from target commission
  const requiredVolume = avgFeePercent > 0 && commissionPercent > 0
    ? targetCommission / (avgFeePercent / 100) / (commissionPercent / 100)
    : 0;

  const avgDealSize = requiredVolume / (targetDeals || 1);

  const handleCommissionChange = (value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    updatePlanInput('targetCommission', numValue);
  };

  const handleRevenueChange = (value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    // Calculate commission from revenue: Commission = Revenue × Fee% × Commission%
    const calculatedCommission = numValue * (avgFeePercent / 100) * (commissionPercent / 100);
    updatePlanInput('targetCommission', calculatedCommission);
  };

  // Check if there's a fee suggestion that differs significantly from current
  const hasFeeInsight = dealInsights?.bucket && 
    Math.abs(dealInsights.suggestedFeePercent - avgFeePercent) > 0.5;

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              type="number"
              min="1"
              value={targetDeals}
              onChange={(e) => updatePlanInput('targetDeals', parseInt(e.target.value) || 1)}
              className="text-lg font-semibold"
            />
          </div>
          <p className="text-xs text-muted-foreground">Avg deal size: {formatCurrency(avgDealSize)}</p>
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
              value={Math.round(requiredVolume).toLocaleString()}
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">Based on analysis of historical deal data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              <p className="text-xs text-muted-foreground mb-1">Avg Fee for This Deal Size</p>
              <p className="text-sm font-medium text-foreground">
                {dealInsights.suggestedFeePercent.toFixed(2)}%
                {hasFeeInsight && (
                  <span className={`ml-2 text-xs ${dealInsights.suggestedFeePercent > avgFeePercent ? 'text-green-500' : 'text-amber-500'}`}>
                    ({dealInsights.suggestedFeePercent > avgFeePercent ? '+' : ''}{(dealInsights.suggestedFeePercent - avgFeePercent).toFixed(2)}% vs target)
                  </span>
                )}
              </p>
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
            {dealMix.small > 0 && (
              <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs">
                {dealMix.small} Small (&lt;$25K)
              </span>
            )}
            {dealMix.medium > 0 && (
              <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs">
                {dealMix.medium} Medium ($25K-$75K)
              </span>
            )}
            {dealMix.large > 0 && (
              <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                {dealMix.large} Large ($75K-$200K)
              </span>
            )}
            {dealMix.veryLarge > 0 && (
              <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs">
                {dealMix.veryLarge} Very Large (&gt;$200K)
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
              {formatCurrency(targetCommission)} ÷ {avgFeePercent}% ÷ {commissionPercent}% = {formatCurrency(requiredVolume)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
