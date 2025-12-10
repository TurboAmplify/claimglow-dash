import { AdjusterSummary } from "@/types/claims";
import { cn } from "@/lib/utils";
import { User, TrendingUp, TrendingDown, FileText, Building2 } from "lucide-react";

interface AdjusterCardProps {
  summary: AdjusterSummary;
  onClick?: () => void;
  delay?: number;
}

export function AdjusterCard({ summary, onClick, delay = 0 }: AdjusterCardProps) {
  const isPositive = summary.avgPercentChange >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-fade-in",
        isPositive ? "hover:glow-success" : "hover:glow-destructive"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isPositive ? "bg-success/20" : "bg-destructive/20"
            )}
          >
            <User
              className={cn(
                "w-6 h-6",
                isPositive ? "text-success" : "text-destructive"
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{summary.adjuster}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>{summary.office || "Unassigned"}</span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1",
            isPositive
              ? "bg-success/15 text-success border border-success/30"
              : "bg-destructive/15 text-destructive border border-destructive/30"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isPositive ? "+" : ""}
          {summary.avgPercentChange.toFixed(1)}%
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-secondary/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Claims</span>
          </div>
          <p className="text-xl font-bold text-foreground">{summary.totalClaims}</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Difference
          </div>
          <p
            className={cn(
              "text-lg font-bold",
              summary.totalDollarDifference >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {summary.totalDollarDifference >= 0 ? "+" : ""}
            {formatCurrency(summary.totalDollarDifference)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-glass-border/20">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Original: </span>
            <span className="font-medium text-foreground">
              {formatCurrency(summary.totalEstimate)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Revised: </span>
            <span className="font-medium text-foreground">
              {formatCurrency(summary.totalRevised)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
