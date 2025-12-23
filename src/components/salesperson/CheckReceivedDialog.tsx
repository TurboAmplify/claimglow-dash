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
  const [checkDate, setCheckDate] = useState<Date | undefined>(new Date());
  const [checkAmount, setCheckAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (record) {
      setCheckDate(new Date());
      setCheckAmount("");
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

    setIsSaving(true);

    try {
      const amount = parseFloat(checkAmount);
      const currentChecks = record.insurance_checks_ytd || 0;
      const newTotal = currentChecks + amount;

      // Calculate new remainder
      const revisedEstimate = record.revised_estimate || 0;
      const newRemainder = Math.max(0, revisedEstimate - newTotal);

      const { error } = await supabase
        .from("sales_commissions")
        .update({
          insurance_checks_ytd: newTotal,
          new_remainder: newRemainder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "Check recorded",
        description: `Added ${formatCurrency(amount)} to ${record.client_name}. New total: ${formatCurrency(newTotal)}`,
      });

      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
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

          {/* Check Date */}
          <div className="space-y-2">
            <Label>Check Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkDate ? format(checkDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkDate}
                  onSelect={setCheckDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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

          {/* Preview */}
          {checkAmount && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">After recording:</p>
              <div className="flex justify-between mt-1">
                <span className="text-foreground">New Total Checks:</span>
                <span className="font-bold text-primary">
                  {formatCurrency((record.insurance_checks_ytd || 0) + parseFloat(checkAmount || "0"))}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-foreground">New Remainder:</span>
                <span className="font-medium">
                  {formatCurrency(
                    Math.max(0, (record.revised_estimate || 0) - ((record.insurance_checks_ytd || 0) + parseFloat(checkAmount || "0")))
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Check number, reference, etc."
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
