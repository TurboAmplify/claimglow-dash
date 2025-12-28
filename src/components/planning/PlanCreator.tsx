import { Target, DollarSign, Percent, Calculator } from "lucide-react";
import { PlanInputs } from "@/hooks/usePlanScenarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlanCreatorProps {
  planInputs: PlanInputs;
  updatePlanInput: <K extends keyof PlanInputs>(key: K, value: PlanInputs[K]) => void;
  formatCurrency: (value: number) => string;
}

export function PlanCreator({ planInputs, updatePlanInput, formatCurrency }: PlanCreatorProps) {
  const { targetRevenue, targetCommission, avgFeePercent, commissionPercent } = planInputs;

  // Calculated values
  const companyFee = targetRevenue * (avgFeePercent / 100);
  const calculatedCommission = companyFee * (commissionPercent / 100);

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
          <p className="text-sm text-muted-foreground">Set your annual targets and commission structure</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Target Revenue */}
        <div className="space-y-2">
          <Label htmlFor="targetRevenue" className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            Target Revenue
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="targetRevenue"
              type="text"
              value={targetRevenue.toLocaleString()}
              onChange={(e) => handleNumberChange('targetRevenue', e.target.value)}
              className="pl-7 text-lg font-semibold"
            />
          </div>
          <p className="text-xs text-muted-foreground">{formatCurrency(targetRevenue)} annual goal</p>
        </div>

        {/* Average Fee % */}
        <div className="space-y-2">
          <Label htmlFor="avgFeePercent" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Percent className="w-4 h-4" />
            Average Fee %
          </Label>
          <div className="relative">
            <Input
              id="avgFeePercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={avgFeePercent}
              onChange={(e) => updatePlanInput('avgFeePercent', parseFloat(e.target.value) || 0)}
              className="pr-7 text-lg font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">Company fee: {formatCurrency(companyFee)}</p>
        </div>

        {/* Commission % */}
        <div className="space-y-2">
          <Label htmlFor="commissionPercent" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Percent className="w-4 h-4" />
            Commission %
          </Label>
          <div className="relative">
            <Input
              id="commissionPercent"
              type="number"
              step="1"
              min="0"
              max="100"
              value={commissionPercent}
              onChange={(e) => updatePlanInput('commissionPercent', parseFloat(e.target.value) || 0)}
              className="pr-7 text-lg font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">Your split of company fee</p>
        </div>

        {/* Projected Commission */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calculator className="w-4 h-4" />
            Projected Commission
          </Label>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-2xl font-bold text-primary">{formatCurrency(calculatedCommission)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {avgFeePercent}% fee × {commissionPercent}% split
          </p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Formula: </span>
            <span className="font-mono text-foreground">
              Revenue × Fee% × Commission% = Your Commission
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Calculation: </span>
            <span className="font-mono text-foreground">
              {formatCurrency(targetRevenue)} × {avgFeePercent}% × {commissionPercent}% = {formatCurrency(calculatedCommission)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
