import { Claim } from "@/types/claims";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Minus, Search } from "lucide-react";
import { useState, useMemo } from "react";

interface ClaimsTableProps {
  claims: Claim[];
  onAdjusterClick?: (adjuster: string) => void;
  onOfficeClick?: (office: string) => void;
  compact?: boolean;
}

export function ClaimsTable({
  claims,
  onAdjusterClick,
  onOfficeClick,
  compact = false,
}: ClaimsTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof Claim>("date_signed");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredClaims = useMemo(() => {
    let filtered = claims.filter(
      (claim) =>
        claim.name.toLowerCase().includes(search.toLowerCase()) ||
        claim.adjuster.toLowerCase().includes(search.toLowerCase()) ||
        (claim.office?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : 1;
      }
      return aVal > bVal ? -1 : 1;
    });
  }, [claims, search, sortBy, sortOrder]);

  const handleSort = (column: keyof Claim) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="glass-table overflow-hidden animate-fade-in">
      {/* Search */}
      <div className="p-4 border-b border-glass-border/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search claims, adjusters, offices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-glass-border/30 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th
                className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("name")}
              >
                Claim Name
              </th>
              {!compact && (
                <th
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("adjuster")}
                >
                  Adjuster
                </th>
              )}
              {!compact && (
                <th
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("office")}
                >
                  Office
                </th>
              )}
              <th
                className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort("date_signed")}
              >
                Date
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors text-right"
                onClick={() => handleSort("estimate_of_loss")}
              >
                Original Est.
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors text-right"
                onClick={() => handleSort("revised_estimate_of_loss")}
              >
                Revised Est.
              </th>
              <th
                className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors text-right"
                onClick={() => handleSort("percent_change")}
              >
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map((claim, index) => (
              <tr
                key={claim.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{claim.name}</span>
                </td>
                {!compact && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAdjusterClick?.(claim.adjuster)}
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {claim.adjuster}
                    </button>
                  </td>
                )}
                {!compact && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => claim.office && onOfficeClick?.(claim.office)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {claim.office || "—"}
                    </button>
                  </td>
                )}
                <td className="px-4 py-3 text-muted-foreground">
                  {claim.date_signed
                    ? format(new Date(claim.date_signed), "MMM d, yyyy")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {formatCurrency(claim.estimate_of_loss)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  {formatCurrency(claim.revised_estimate_of_loss)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={cn(
                        "badge-neutral",
                        claim.change_indicator === "increase" && "badge-increase",
                        claim.change_indicator === "decrease" && "badge-decrease"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {claim.change_indicator === "increase" && (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {claim.change_indicator === "decrease" && (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {claim.change_indicator === "no_change" && (
                          <Minus className="w-3 h-3" />
                        )}
                        {formatPercent(claim.percent_change)}
                      </span>
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClaims.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No claims found matching your search.
        </div>
      )}
    </div>
  );
}
