import { OfficeSummary } from "@/types/claims";
import { cn } from "@/lib/utils";
import { Building2, Users, FileText, TrendingUp, TrendingDown } from "lucide-react";

interface OfficeCardProps {
  summary: OfficeSummary;
  onClick?: () => void;
  delay?: number;
}

export function OfficeCard({ summary, onClick, delay = 0 }: OfficeCardProps) {
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
        "glass-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-fade-in",
        isPositive ? "hover:glow-success" : "hover:glow-destructive"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{summary.office}</h3>
            <p className="text-sm text-muted-foreground">Office Location</p>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{summary.totalAdjusters}</p>
          <p className="text-xs text-muted-foreground">Adjusters</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <FileText className="w-5 h-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">{summary.totalClaims}</p>
          <p className="text-xs text-muted-foreground">Claims</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30 text-center">
          <TrendingUp className="w-5 h-5 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(summary.totalRevised - summary.totalEstimate)}
          </p>
          <p className="text-xs text-muted-foreground">Net Change</p>
        </div>
      </div>

      {/* Adjusters List */}
      <div className="border-t border-glass-border/20 pt-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
          Team Members
        </p>
        <div className="flex flex-wrap gap-2">
          {summary.adjusters.map((adjuster) => (
            <span
              key={adjuster}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {adjuster}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
