import { useState, useMemo } from "react";
import { SalesCommission } from "@/types/sales";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Edit2, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { EditSalesRecordDialog } from "@/components/dashboard/EditSalesRecordDialog";
import { CheckReceivedDialog } from "./CheckReceivedDialog";
import { UpdateEstimateDialog } from "./UpdateEstimateDialog";
import { format } from "date-fns";

interface DealCardProps {
  commission: SalesCommission;
  animationDelay?: number;
}

export function DealCard({ commission, animationDelay = 0 }: DealCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [estimateDialogOpen, setEstimateDialogOpen] = useState(false);

  // Calculate all commission values
  const calculations = useMemo(() => {
    const revisedEstimate = commission.revised_estimate || commission.initial_estimate || 0;
    const initialEstimate = commission.initial_estimate || 0;
    const checksReceived = commission.insurance_checks_ytd || 0;
    const feePercent = (commission.fee_percentage || 0) / 100;
    const commissionPercent = (commission.commission_percentage || 0) / 100;
    const splitPercent = (commission.split_percentage || 100) / 100;

    // Collection progress
    const collectionProgress = revisedEstimate > 0 ? (checksReceived / revisedEstimate) * 100 : 0;
    const remainder = commission.new_remainder || Math.max(0, revisedEstimate - checksReceived);

    // Fee calculations
    const feeEarnedSoFar = checksReceived * feePercent;
    const projectedTotalFee = revisedEstimate * feePercent;

    // Commission calculations
    const commissionEarned = feeEarnedSoFar * commissionPercent * splitPercent;
    const projectedTotalCommission = projectedTotalFee * commissionPercent * splitPercent;
    const pendingCommission = projectedTotalCommission - commissionEarned;
    const commissionPaid = commission.commissions_paid || 0;
    const commissionOwed = commissionEarned - commissionPaid;

    // Percent change
    const percentChange = initialEstimate > 0 
      ? ((revisedEstimate - initialEstimate) / initialEstimate) * 100 
      : 0;

    return {
      revisedEstimate,
      initialEstimate,
      checksReceived,
      collectionProgress: Math.min(collectionProgress, 100),
      remainder,
      feeEarnedSoFar,
      projectedTotalFee,
      commissionEarned,
      projectedTotalCommission,
      pendingCommission,
      commissionPaid,
      commissionOwed,
      percentChange,
      feePercent: commission.fee_percentage || 0,
      commissionPercent: commission.commission_percentage || 0,
      splitPercent: commission.split_percentage || 100,
    };
  }, [commission]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div 
        className="glass-card p-4 animate-fade-in hover:shadow-lg transition-shadow"
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">{commission.client_name}</h3>
              <Badge variant={commission.status === "closed" ? "secondary" : "default"}>
                {commission.status || "open"}
              </Badge>
              {commission.year && (
                <Badge variant="outline">{commission.year}</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {commission.adjuster && <span className="truncate max-w-[150px]">{commission.adjuster}</span>}
              {commission.adjuster && commission.office && <span>•</span>}
              {commission.office && <span className="whitespace-nowrap">{commission.office}</span>}
              {commission.date_signed && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {formatDate(commission.date_signed)}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEstimateDialogOpen(true)}
              className="h-8 px-2"
              title="Update Estimate"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCheckDialogOpen(true)}
              className="h-8 px-2"
              title="Record Check"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="h-8 px-2"
              title="Edit Details"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estimate Section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estimate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(calculations.initialEstimate)}
              </span>
              <span className="text-lg font-semibold text-foreground">
                {formatCurrency(calculations.revisedEstimate)}
              </span>
              {calculations.percentChange !== 0 && (
                <span className={`text-sm flex items-center gap-0.5 ${
                  calculations.percentChange > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {calculations.percentChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(calculations.percentChange).toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Collection Section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Collection</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{formatCurrency(calculations.checksReceived)}</span>
                <span className="text-muted-foreground">/ {formatCurrency(calculations.revisedEstimate)}</span>
              </div>
              <Progress value={calculations.collectionProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{calculations.collectionProgress.toFixed(0)}% collected</span>
                <span>Remainder: {formatCurrency(calculations.remainder)}</span>
              </div>
            </div>
          </div>

          {/* Commission Section */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commission</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Earned: </span>
                <span className="font-medium text-primary">{formatCurrency(calculations.commissionEarned)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Paid: </span>
                <span className="font-medium text-green-600">{formatCurrency(calculations.commissionPaid)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Owed: </span>
                <span className="font-medium text-amber-600">{formatCurrency(calculations.commissionOwed)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Projected: </span>
                <span className="font-medium">{formatCurrency(calculations.projectedTotalCommission)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Percentages */}
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Fee: {calculations.feePercent}%</span>
          <span>Commission: {calculations.commissionPercent}%</span>
          <span>Split: {calculations.splitPercent}%</span>
          <span className="ml-auto">
            Effective Rate: {(calculations.feePercent * calculations.commissionPercent * calculations.splitPercent / 10000).toFixed(3)}%
          </span>
        </div>
      </div>

      <EditSalesRecordDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={commission}
        salespeople={[]}
      />

      <CheckReceivedDialog
        open={checkDialogOpen}
        onOpenChange={setCheckDialogOpen}
        record={commission}
      />

      <UpdateEstimateDialog
        open={estimateDialogOpen}
        onOpenChange={setEstimateDialogOpen}
        record={commission}
      />
    </>
  );
}
