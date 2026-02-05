import { useState, useMemo, useEffect, useRef } from "react";
import { SalesCommission } from "@/types/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { AddClientDealForm } from "./AddClientDealForm";
import { DealCard } from "./DealCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CommissionEstimatorProps {
  commissions: SalesCommission[];
  salespersonId: string;
  highlightDealId?: string;
}

export function CommissionEstimator({ commissions, salespersonId, highlightDealId }: CommissionEstimatorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted deal
  useEffect(() => {
    if (highlightDealId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightDealId]);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(commissions.map((c) => c.year).filter(Boolean))];
    return uniqueYears.sort((a, b) => (b || 0) - (a || 0));
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const matchesSearch = searchTerm === "" || 
        c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.adjuster?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = yearFilter === "all" || c.year?.toString() === yearFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      
      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [commissions, searchTerm, yearFilter, statusFilter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalVolume = filteredCommissions.reduce((sum, c) => sum + (c.revised_estimate || c.initial_estimate || 0), 0);
    const totalCollected = filteredCommissions.reduce((sum, c) => sum + (c.insurance_checks_ytd || 0), 0);
    const totalCommissionEarned = filteredCommissions.reduce((sum, c) => {
      const checks = c.insurance_checks_ytd || 0;
      const fee = (c.fee_percentage || 0) / 100;
      const commission = (c.commission_percentage || 0) / 100;
      const split = (c.split_percentage || 100) / 100;
      return sum + (checks * fee * commission * split);
    }, 0);
    const totalCommissionPaid = filteredCommissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);
    const pendingCommission = totalCommissionEarned - totalCommissionPaid;

    return {
      dealCount: filteredCommissions.length,
      totalVolume,
      totalCollected,
      collectionRate: totalVolume > 0 ? (totalCollected / totalVolume) * 100 : 0,
      totalCommissionEarned,
      totalCommissionPaid,
      pendingCommission,
    };
  }, [filteredCommissions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Add New Deal Collapsible */}
      <Collapsible open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between glass-card border-dashed border-2 h-12 hover:bg-primary/5"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Client / Deal
            </span>
            {isAddFormOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <AddClientDealForm 
            salespersonId={salespersonId} 
            onSuccess={() => setIsAddFormOpen(false)} 
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Filters */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or adjuster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year?.toString() || ""}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Stats - Responsive grid with proper overflow handling */}
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "50ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Claims</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tabular-nums">{summaryStats.dealCount}</p>
        </div>
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "75ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total Volume</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tabular-nums">{formatCurrency(summaryStats.totalVolume)}</p>
        </div>
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Collected</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tabular-nums">{formatCurrency(summaryStats.totalCollected)}</p>
        </div>
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "125ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Collection %</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground tabular-nums">{summaryStats.collectionRate.toFixed(1)}%</p>
        </div>
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "150ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Comm. Earned</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-primary tabular-nums">{formatCurrency(summaryStats.totalCommissionEarned)}</p>
        </div>
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "175ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Paid Out</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-success tabular-nums">{formatCurrency(summaryStats.totalCommissionPaid)}</p>
        </div>
        <div className="glass-card p-2 sm:p-3 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-warning tabular-nums">{formatCurrency(summaryStats.pendingCommission)}</p>
        </div>
      </div>

      {/* Deal Cards */}
      <div className="space-y-3">
        {filteredCommissions.length === 0 ? (
          <div className="glass-card p-8 text-center animate-fade-in">
            <p className="text-muted-foreground">No deals found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || yearFilter !== "all" || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Click 'Add New Client Deal' to get started"}
            </p>
          </div>
        ) : (
          filteredCommissions.map((commission, index) => (
            <div 
              key={commission.id}
              ref={commission.id === highlightDealId ? highlightRef : undefined}
            >
              <DealCard 
                commission={commission} 
                animationDelay={index * 50}
                isHighlighted={commission.id === highlightDealId}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
