import { FlaskConical, Trash2, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HypotheticalDeal } from "@/hooks/useHypotheticalDeals";
import { AddHypotheticalDealDialog } from "./AddHypotheticalDealDialog";
import { cn } from "@/lib/utils";

interface WhatIfSandboxProps {
  deals: HypotheticalDeal[];
  aggregates: {
    totalValue: number;
    weightedValue: number;
    dealCount: number;
    byQuarter: Record<string, { value: number; weighted: number; count: number }>;
    byCategory: Record<string, { value: number; weighted: number; count: number }>;
  };
  onAddDeal: (deal: Omit<HypotheticalDeal, 'id'>) => HypotheticalDeal;
  onRemoveDeal: (id: string) => void;
  onClearAll: () => void;
  onConvertToPipeline?: (deal: HypotheticalDeal) => void;
  formatCurrency: (value: number) => string;
}

const CATEGORY_COLORS: Record<string, string> = {
  residential: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  commercial: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  industrial: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  religious: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  school: "bg-rose-500/20 text-rose-600 border-rose-500/30",
};

export function WhatIfSandbox({
  deals,
  aggregates,
  onAddDeal,
  onRemoveDeal,
  onClearAll,
  onConvertToPipeline,
  formatCurrency,
}: WhatIfSandboxProps) {
  return (
    <div className="space-y-4 p-6 rounded-xl border-2 border-dashed border-violet-500/50 bg-violet-500/5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <FlaskConical className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">What-If Sandbox</h3>
            <p className="text-sm text-muted-foreground">
              These deals are hypothetical — they won't be saved to your actual pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddHypotheticalDealDialog onAdd={onAddDeal} />
          {deals.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearAll}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Aggregate Summary */}
      {deals.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-muted-foreground">Hypothetical Deals</p>
            <p className="text-xl font-bold text-foreground">{aggregates.dealCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold text-foreground whitespace-nowrap tabular-nums">
              {formatCurrency(aggregates.totalValue)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-muted-foreground">Weighted Value</p>
            <p className="text-xl font-bold text-violet-600 whitespace-nowrap tabular-nums">
              {formatCurrency(aggregates.weightedValue)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-muted-foreground">Avg Probability</p>
            <p className="text-xl font-bold text-foreground">
              {deals.length > 0 
                ? Math.round(deals.reduce((sum, d) => sum + d.probability, 0) / deals.length)
                : 0}%
            </p>
          </div>
        </div>
      )}

      {/* By Quarter Breakdown */}
      {deals.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
            <div 
              key={q} 
              className={cn(
                "p-2 rounded-lg text-center border",
                aggregates.byQuarter[q].count > 0 
                  ? "bg-violet-500/10 border-violet-500/20" 
                  : "bg-muted/10 border-border/30"
              )}
            >
              <p className="text-xs font-medium text-muted-foreground">{q}</p>
              <p className="text-sm font-bold text-foreground">
                {aggregates.byQuarter[q].count} deal{aggregates.byQuarter[q].count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-violet-600">
                {formatCurrency(aggregates.byQuarter[q].weighted)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Deal Cards */}
      {deals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hypothetical deals yet.</p>
          <p className="text-xs">Add deals to see how they'd impact your projections.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {deals.map((deal) => {
            const month = new Date(deal.expected_close_date).toLocaleString('default', { month: 'short' });
            
            return (
              <div 
                key={deal.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-dashed border-violet-500/30 hover:border-violet-500/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge className={cn("capitalize text-xs", CATEGORY_COLORS[deal.category])}>
                    {deal.category}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{deal.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {month} • {deal.probability}% probability
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground whitespace-nowrap tabular-nums">
                      {formatCurrency(deal.expected_value)}
                    </p>
                    <p className="text-xs text-violet-600 whitespace-nowrap tabular-nums">
                      {formatCurrency(deal.expected_value * deal.probability / 100)} weighted
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {onConvertToPipeline && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onConvertToPipeline(deal)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Move to Pipeline"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveDeal(deal.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
