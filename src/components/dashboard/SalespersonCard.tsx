import { cn } from "@/lib/utils";
import { User, DollarSign, FileText, Building2, Percent, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export interface SalespersonStats {
  name: string;
  office?: string;
  deals: number;
  volume: number;
  revisedVolume: number;
  commissions: number;
  avgFeePercentage: number;
  avgCommissionPercentage: number;
  avgSplitPercentage: number;
}

interface SalespersonCardProps {
  stats: SalespersonStats;
  onClick?: () => void;
  delay?: number;
}

export function SalespersonCard({ stats, onClick, delay = 0 }: SalespersonCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Commission yield = commissions / volume (how much they earned per dollar of deal volume)
  const commissionYield = stats.volume > 0 ? (stats.commissions / stats.volume) * 100 : 0;
  const avgDealSize = stats.deals > 0 ? stats.volume / stats.deals : 0;
  const volumeChange = stats.volume > 0 ? ((stats.revisedVolume - stats.volume) / stats.volume) * 100 : 0;
  const isPositiveChange = volumeChange >= 0;

  const isHouston = stats.office?.toLowerCase() === "houston";
  const isDallas = stats.office?.toLowerCase() === "dallas";

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
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
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "glass-card p-5 cursor-pointer transition-all duration-300 animate-fade-in border-l-4",
        officeStyles.cardBg,
        officeStyles.borderColor,
        "hover:shadow-lg hover:scale-[1.01]"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{stats.name}</h3>
            {stats.office && (
              <div className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1",
                officeStyles.officeBadge
              )}>
                <Building2 className="w-3 h-3" />
                <span>{stats.office}</span>
              </div>
            )}
          </div>
        </div>
        {/* Commission Yield Badge */}
        <div className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 bg-primary/15 text-primary border border-primary/30">
          <Percent className="w-4 h-4" />
          {commissionYield.toFixed(1)}% yield
        </div>
      </div>

      {/* Primary Stats - Deals, Volume, Commissions */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-3 rounded-xl bg-secondary/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Deals</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.deals}</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Volume</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(stats.volume)}</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Earned</span>
          </div>
          <p className="text-xl font-bold text-primary">{formatCurrency(stats.commissions)}</p>
        </div>
      </div>

      {/* Secondary Stats - Fee % and Avg Deal Size */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-secondary/30">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Avg Fee %
          </div>
          <p className="text-lg font-bold text-foreground">{stats.avgFeePercentage.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-xl bg-secondary/30">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Avg Deal Size
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(avgDealSize)}</p>
        </div>
      </div>

      {/* Expandable Breakdown - Shows on Hover */}
      <div
        className={cn(
          "grid grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ease-out",
          isHovered ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        )}
      >
        {/* Volume Change */}
        <div className={cn(
          "p-3 rounded-xl border",
          isPositiveChange 
            ? "bg-success/10 border-success/20" 
            : "bg-destructive/10 border-destructive/20"
        )}>
          <div className={cn(
            "flex items-center gap-2 mb-1",
            isPositiveChange ? "text-success" : "text-destructive"
          )}>
            {isPositiveChange ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-xs uppercase tracking-wide">Volume Change</span>
          </div>
          <p className={cn(
            "text-lg font-bold",
            isPositiveChange ? "text-success" : "text-destructive"
          )}>
            {isPositiveChange ? "+" : ""}{volumeChange.toFixed(1)}%
          </p>
        </div>

        {/* Commission Rate */}
        <div className="p-3 rounded-xl bg-secondary/30 border border-secondary/20">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Percent className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Comm Rate</span>
          </div>
          <p className="text-lg font-bold text-foreground">{stats.avgCommissionPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-glass-border/20">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-muted-foreground">Initial: </span>
            <span className="font-medium text-foreground">{formatCurrency(stats.volume)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Revised: </span>
            <span className="font-medium text-foreground">{formatCurrency(stats.revisedVolume)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
