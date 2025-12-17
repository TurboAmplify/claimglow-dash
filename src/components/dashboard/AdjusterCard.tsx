import { AdjusterSummary } from "@/types/claims";
import { cn } from "@/lib/utils";
import { User, TrendingUp, TrendingDown, FileText, Building2, Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface AdjusterCardProps {
  summary: AdjusterSummary;
  onClick?: () => void;
  delay?: number;
}

export function AdjusterCard({ summary, onClick, delay = 0 }: AdjusterCardProps) {
  const isPositive = summary.avgPercentChange >= 0;
  const isHouston = summary.office?.toLowerCase() === "houston";
  const isDallas = summary.office?.toLowerCase() === "dallas";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Office-based styling
  const getOfficeStyles = () => {
    if (isHouston) {
      return {
        cardBg: "bg-blue-950/40",
        borderColor: "border-l-blue-500",
        officeBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      };
    }
    if (isDallas) {
      return {
        cardBg: "bg-cyan-950/30",
        borderColor: "border-l-cyan-400",
        officeBadge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      };
    }
    return {
      cardBg: "bg-secondary/30",
      borderColor: "border-l-muted-foreground",
      officeBadge: "bg-muted/20 text-muted-foreground border-muted/30",
    };
  };

  const officeStyles = getOfficeStyles();

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            "glass-card p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-fade-in border-l-4",
            officeStyles.cardBg,
            officeStyles.borderColor,
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
                <div className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1",
                  officeStyles.officeBadge
                )}>
                  <Building2 className="w-3 h-3" />
                  <span>{summary.office || "Unassigned"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground/50" />
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
          </div>

          {/* Compact Stats - Total Claims & Total Difference */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs uppercase tracking-wide">Total Claims</span>
              </div>
              <p className="text-xl font-bold text-foreground">{summary.totalClaims}</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Total Difference
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
      </HoverCardTrigger>

      {/* Hover Popup with Positive/Negative Breakdown */}
      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-72 p-4 glass-card border border-glass-border/30"
      >
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground mb-3">Claims Breakdown</div>
          
          {/* Positive Claims */}
          <div className="p-3 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Positive</span>
              </div>
              <span className="text-lg font-bold text-success">{summary.positiveClaims}</span>
            </div>
            <div className="mt-1 text-sm text-success">
              +{formatCurrency(summary.positiveDifference)}
            </div>
          </div>

          {/* Negative Claims */}
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-medium">Negative</span>
              </div>
              <span className="text-lg font-bold text-destructive">{summary.negativeClaims}</span>
            </div>
            <div className="mt-1 text-sm text-destructive">
              {formatCurrency(summary.negativeDifference)}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
