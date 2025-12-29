import { Target, DollarSign, Hash } from "lucide-react";
import { PlanInputs } from "@/hooks/usePlanScenarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function PlanCreator({ planInputs, updatePlanInput, formatCurrency, salespersonName }: PlanCreatorProps) {
  const { targetRevenue, targetCommission, targetDeals, avgFeePercent } = planInputs;
  
  // Get hardcoded commission for this salesperson
  const commissionPercent = salespersonName ? (SALESPERSON_COMMISSION[salespersonName] ?? 20) : 20;

  // Calculate required volume from target commission
  const requiredVolume = avgFeePercent > 0 && commissionPercent > 0
    ? targetCommission / (avgFeePercent / 100) / (commissionPercent / 100)
    : 0;

  const handleNumberChange = (key: keyof PlanInputs, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
    updatePlanInput(key, numValue);
  };

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
              onChange={(e) => handleNumberChange('targetCommission', e.target.value)}
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
          <p className="text-xs text-muted-foreground">Avg deal size: {formatCurrency(requiredVolume / (targetDeals || 1))}</p>
        </div>

        {/* Required Revenue (Calculated) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            Required Revenue
          </Label>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-2xl font-bold text-primary">{formatCurrency(requiredVolume)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Volume needed @ {avgFeePercent}% fee × {commissionPercent}% split
          </p>
        </div>
      </div>

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
