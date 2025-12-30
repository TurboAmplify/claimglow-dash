import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SalesCommission } from "@/types/sales";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, DollarSign, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CheckReceivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalesCommission | null;
}

export function CheckReceivedDialog({ open, onOpenChange, record }: CheckReceivedDialogProps) {
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(new Date());
  const [depositedDate, setDepositedDate] = useState<Date | undefined>(new Date());
  const [checkAmount, setCheckAmount] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (record) {
      setReceivedDate(new Date());
      setDepositedDate(new Date());
      setCheckAmount("");
      setCheckNumber("");
      setNotes("");
    }
  }, [record]);

  const handleSave = async () => {
    if (!record || !checkAmount) {
      toast({
        title: "Missing information",
        description: "Please enter the check amount.",
        variant: "destructive",
      });
      return;
    }

    if (!receivedDate || !depositedDate) {
      toast({
        title: "Missing information",
        description: "Please select both received and deposited dates.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const amount = parseFloat(checkAmount);
      const currentChecks = record.insurance_checks_ytd || 0;
      const newTotal = currentChecks + amount;

      // Calculate new remainder
      const revisedEstimate = record.revised_estimate || 0;
      const newRemainder = Math.max(0, revisedEstimate - newTotal);

      // Calculate commission earned from this check
      const feePercent = (record.fee_percentage || 0) / 100;
      const commissionPercent = (record.commission_percentage || 0) / 100;
      const splitPercent = (record.split_percentage || 100) / 100;
      const commissionFromCheck = amount * feePercent * commissionPercent * splitPercent;
      
      // Update commissions paid
      const currentCommissionsPaid = record.commissions_paid || 0;
      const newCommissionsPaid = currentCommissionsPaid + commissionFromCheck;

      // Insert the check record with dates
      const { error: checkError } = await supabase
        .from("commission_checks")
        .insert({
          sales_commission_id: record.id,
          check_amount: amount,
          received_date: format(receivedDate, "yyyy-MM-dd"),
          deposited_date: format(depositedDate, "yyyy-MM-dd"),
          check_number: checkNumber.trim() || null,
          notes: notes.trim() || null,
          commission_earned: commissionFromCheck,
        });

      if (checkError) throw checkError;

      // Update the sales commission record
      const { error: updateError } = await supabase
        .from("sales_commissions")
        .update({
          insurance_checks_ytd: newTotal,
          new_remainder: newRemainder,
          commissions_paid: newCommissionsPaid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (updateError) throw updateError;

      toast({
        title: "Check recorded",
        description: `Added ${formatCurrency(amount)} to ${record.client_name}. Commission earned: ${formatCurrency(commissionFromCheck)}`,
      });

      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      queryClient.invalidateQueries({ queryKey: ["commission_checks"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording check:", error);
      toast({
        title: "Error",
        description: "Failed to record the check. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Record Check Received
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="font-medium text-foreground">{record.client_name}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <div>
                <span className="text-muted-foreground">Current Checks: </span>
                <span className="font-medium">{formatCurrency(record.insurance_checks_ytd || 0)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Remainder: </span>
                <span className="font-medium">{formatCurrency(record.new_remainder || 0)}</span>
              </div>
            </div>
          </div>

          {/* Date Received */}
          <div className="space-y-2">
            <Label>Date Received</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !receivedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {receivedDate ? format(receivedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={receivedDate}
                  onSelect={setReceivedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date Deposited */}
          <div className="space-y-2">
            <Label>Date Deposited</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !depositedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {depositedDate ? format(depositedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={depositedDate}
                  onSelect={setDepositedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Commission will be attributed to this deposit month
            </p>
          </div>

          {/* Check Amount */}
          <div className="space-y-2">
            <Label htmlFor="checkAmount">Check Amount ($)</Label>
            <Input
              id="checkAmount"
              type="number"
              placeholder="Enter amount received"
              value={checkAmount}
              onChange={(e) => setCheckAmount(e.target.value)}
            />
          </div>

          {/* Check Number */}
          <div className="space-y-2">
            <Label htmlFor="checkNumber">Check Number (optional)</Label>
            <Input
              id="checkNumber"
              placeholder="Enter check number"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
            />
          </div>

          {/* Preview */}
          {checkAmount && (() => {
            const amount = parseFloat(checkAmount) || 0;
            const newTotalChecks = (record.insurance_checks_ytd || 0) + amount;
            const newRemainder = Math.max(0, (record.revised_estimate || 0) - newTotalChecks);
            const feePercent = (record.fee_percentage || 0) / 100;
            const commissionPercent = (record.commission_percentage || 0) / 100;
            const splitPercent = (record.split_percentage || 100) / 100;
            const commissionFromCheck = amount * feePercent * commissionPercent * splitPercent;
            const newTotalCommission = (record.commissions_paid || 0) + commissionFromCheck;
            
            return (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1">
                <p className="text-sm text-muted-foreground">After recording:</p>
                <div className="flex justify-between">
                  <span className="text-foreground">New Total Checks:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(newTotalChecks)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">New Remainder:</span>
                  <span className="font-medium">
                    {formatCurrency(newRemainder)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Commission from Check:</span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(commissionFromCheck)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">New Total Commission:</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(newTotalCommission)}
                  </span>
                </div>
                {depositedDate && (
                  <div className="flex justify-between pt-1 border-t border-primary/20 mt-1">
                    <span className="text-muted-foreground text-xs">Attributed to:</span>
                    <span className="text-xs font-medium">
                      {format(depositedDate, "MMMM yyyy")}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !checkAmount}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Record Check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
