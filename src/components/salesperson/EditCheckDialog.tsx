import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarIcon, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CommissionCheck, useUpdateCommissionCheck, useDeleteCommissionCheck } from "@/hooks/useCommissionChecks";
import { SalesCommission } from "@/types/sales";

interface EditCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  check: CommissionCheck | null;
  commission: SalesCommission | null;
}

export function EditCheckDialog({ open, onOpenChange, check, commission }: EditCheckDialogProps) {
  const [receivedDate, setReceivedDate] = useState<Date | undefined>();
  const [depositedDate, setDepositedDate] = useState<Date | undefined>();
  const [checkAmount, setCheckAmount] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [notes, setNotes] = useState("");

  const updateMutation = useUpdateCommissionCheck();
  const deleteMutation = useDeleteCommissionCheck();

  useEffect(() => {
    if (check) {
      setReceivedDate(check.received_date ? new Date(check.received_date) : undefined);
      setDepositedDate(check.deposited_date ? new Date(check.deposited_date) : undefined);
      setCheckAmount(check.check_amount?.toString() || "");
      setCheckNumber(check.check_number || "");
      setNotes(check.notes || "");
    }
  }, [check]);

  const handleSave = async () => {
    if (!check || !commission || !checkAmount) return;

    const amount = parseFloat(checkAmount);
    const feePercent = (commission.fee_percentage || 0) / 100;
    const commissionPercent = (commission.commission_percentage || 0) / 100;
    const splitPercent = (commission.split_percentage || 100) / 100;
    const newCommissionEarned = amount * feePercent * commissionPercent * splitPercent;

    await updateMutation.mutateAsync({
      checkId: check.id,
      salesCommissionId: check.sales_commission_id,
      oldAmount: check.check_amount,
      oldCommission: check.commission_earned,
      updates: {
        check_amount: amount,
        received_date: receivedDate ? format(receivedDate, "yyyy-MM-dd") : check.received_date,
        deposited_date: depositedDate ? format(depositedDate, "yyyy-MM-dd") : check.deposited_date,
        check_number: checkNumber.trim() || null,
        notes: notes.trim() || null,
        commission_earned: newCommissionEarned,
      },
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!check) return;

    await deleteMutation.mutateAsync({
      checkId: check.id,
      salesCommissionId: check.sales_commission_id,
      checkAmount: check.check_amount,
      commissionEarned: check.commission_earned,
    });

    onOpenChange(false);
  };

  if (!check || !commission) return null;

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Check Record</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="font-semibold text-lg text-foreground">{commission.client_name}</p>
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
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
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
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check Amount */}
          <div className="space-y-2">
            <Label htmlFor="editCheckAmount">Check Amount ($)</Label>
            <Input
              id="editCheckAmount"
              type="number"
              value={checkAmount}
              onChange={(e) => setCheckAmount(e.target.value)}
            />
          </div>

          {/* Check Number */}
          <div className="space-y-2">
            <Label htmlFor="editCheckNumber">Check Number (optional)</Label>
            <Input
              id="editCheckNumber"
              value={checkNumber}
              onChange={(e) => setCheckNumber(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="editNotes">Notes (optional)</Label>
            <Textarea
              id="editNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Current values info */}
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <p className="text-muted-foreground">Current check amount: <span className="font-medium text-foreground">{formatCurrency(check.check_amount)}</span></p>
            <p className="text-muted-foreground">Commission earned: <span className="font-medium text-foreground">{formatCurrency(check.commission_earned)}</span></p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete check record?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the check of {formatCurrency(check.check_amount)} and adjust the totals accordingly. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending || !checkAmount}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
