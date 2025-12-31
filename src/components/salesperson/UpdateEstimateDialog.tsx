import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalesCommission } from "@/types/sales";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Save } from "lucide-react";

interface UpdateEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalesCommission | null;
}

export function UpdateEstimateDialog({ open, onOpenChange, record }: UpdateEstimateDialogProps) {
  const [revisedEstimate, setRevisedEstimate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (record) {
      setRevisedEstimate(record.revised_estimate?.toString() || record.initial_estimate?.toString() || "");
    }
  }, [record]);

  const calculations = useMemo(() => {
    if (!record) return null;

    const newEstimate = parseFloat(revisedEstimate) || 0;
    const initialEstimate = record.initial_estimate || 0;
    const checksReceived = record.insurance_checks_ytd || 0;

    const percentChange = initialEstimate > 0 
      ? ((newEstimate - initialEstimate) / initialEstimate) * 100 
      : 0;

    const newRemainder = Math.max(0, newEstimate - checksReceived);

    // Commission projections
    const feePercent = (record.fee_percentage || 0) / 100;
    const commissionPercent = (record.commission_percentage || 0) / 100;
    const splitPercent = (record.split_percentage || 100) / 100;

    const projectedCommission = newEstimate * feePercent * commissionPercent * splitPercent;

    return {
      newEstimate,
      initialEstimate,
      percentChange,
      newRemainder,
      projectedCommission,
    };
  }, [record, revisedEstimate]);

  const handleSave = async () => {
    if (!record || !calculations) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("sales_commissions")
        .update({
          revised_estimate: calculations.newEstimate,
          percent_change: calculations.percentChange,
          new_remainder: calculations.newRemainder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "Estimate updated",
        description: `${record.client_name} revised to ${formatCurrency(calculations.newEstimate)} (${calculations.percentChange >= 0 ? "+" : ""}${calculations.percentChange.toFixed(1)}%)`,
      });

      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating estimate:", error);
      toast({
        title: "Error",
        description: "Failed to update the estimate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Update Estimate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="font-semibold text-lg text-foreground">{record.client_name}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <div>
                <span className="text-muted-foreground">Sales Estimate: </span>
                <span className="font-medium">{formatCurrency(record.initial_estimate || 0)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Adjuster's Revised: </span>
                <span className="font-medium">{formatCurrency(record.revised_estimate || 0)}</span>
              </div>
            </div>
          </div>

          {/* New Estimate */}
          <div className="space-y-2">
            <Label htmlFor="revisedEstimate">New Revised Estimate ($)</Label>
            <Input
              id="revisedEstimate"
              type="number"
              placeholder="Enter new estimate"
              value={revisedEstimate}
              onChange={(e) => setRevisedEstimate(e.target.value)}
            />
          </div>

          {/* Preview */}
          {calculations && parseFloat(revisedEstimate) > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
              <p className="text-sm text-muted-foreground">After updating:</p>
              
              <div className="flex justify-between items-center">
                <span className="text-foreground">Change from Initial:</span>
                <span className={`font-bold flex items-center gap-1 ${
                  calculations.percentChange >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {calculations.percentChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {calculations.percentChange >= 0 ? "+" : ""}{calculations.percentChange.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-foreground">New Remainder:</span>
                <span className="font-medium">{formatCurrency(calculations.newRemainder)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-foreground">Projected Commission:</span>
                <span className="font-bold text-primary">{formatCurrency(calculations.projectedCommission)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !revisedEstimate}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Update Estimate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
