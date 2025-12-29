import { TrendingUp, TrendingDown, Equal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioImpactChartProps {
  baseVolume: number;
  baseDeals: number;
  hypotheticalVolume: number;
  hypotheticalDeals: number;
  formatCurrency: (value: number) => string;
}

export function ScenarioImpactChart({
  baseVolume,
  baseDeals,
  hypotheticalVolume,
  hypotheticalDeals,
  formatCurrency,
}: ScenarioImpactChartProps) {
  const volumeChange = hypotheticalVolume;
  const volumePercent = baseVolume > 0 ? (volumeChange / baseVolume) * 100 : 0;
  const dealsChange = hypotheticalDeals;

  const getChangeIcon = (percent: number) => {
    if (percent > 0) return TrendingUp;
    if (percent < 0) return TrendingDown;
    return Equal;
  };

  const getChangeColor = (percent: number) => {
    if (percent > 10) return "text-emerald-500";
    if (percent > 0) return "text-emerald-400";
    if (percent < -10) return "text-destructive";
    if (percent < 0) return "text-amber-500";
    return "text-muted-foreground";
  };

  const VolumeIcon = getChangeIcon(volumePercent);

  return (
    <div className="glass-card p-6 animate-fade-in border-l-4 border-l-violet-500">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-violet-500" />
        Impact of Hypothetical Deals
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Volume Impact */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Volume Impact</p>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold", getChangeColor(volumePercent))}>
              +{formatCurrency(volumeChange)}
            </span>
            <VolumeIcon className={cn("w-5 h-5", getChangeColor(volumePercent))} />
          </div>
          <p className="text-xs text-muted-foreground">
            {volumePercent > 0 ? "+" : ""}{volumePercent.toFixed(1)}% of current actuals
          </p>
        </div>

        {/* Deals Impact */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Deals Impact</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-violet-600">
              +{dealsChange}
            </span>
            <span className="text-sm text-muted-foreground">deals</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Would bring total to {baseDeals + dealsChange} deals
          </p>
        </div>

        {/* New Total */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Projected Total</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(baseVolume + volumeChange)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Actuals ({formatCurrency(baseVolume)}) + Hypotheticals
          </p>
        </div>
      </div>

      {/* Visual bar comparison */}
      <div className="mt-6 space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Current Actuals</span>
            <span className="font-medium text-foreground">{formatCurrency(baseVolume)}</span>
          </div>
          <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/60 rounded-full transition-all"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">With Hypotheticals</span>
            <span className="font-medium text-violet-600">
              {formatCurrency(baseVolume + volumeChange)}
            </span>
          </div>
          <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all flex"
              style={{ width: `${Math.min(((baseVolume + volumeChange) / baseVolume) * 100, 200)}%` }}
            >
              <div 
                className="bg-primary/60"
                style={{ width: `${baseVolume / (baseVolume + volumeChange) * 100}%` }}
              />
              <div 
                className="bg-violet-500/60"
                style={{ width: `${volumeChange / (baseVolume + volumeChange) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
