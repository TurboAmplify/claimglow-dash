import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SalesCommission } from "@/types/sales";

interface EditSalesRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalesCommission | null;
  salespeople: { id: string; name: string }[];
}

export function EditSalesRecordDialog({
  open,
  onOpenChange,
  record,
  salespeople,
}: EditSalesRecordDialogProps) {
  const [clientName, setClientName] = useState("");
  const [office, setOffice] = useState("");
  const [adjuster, setAdjuster] = useState("");
  const [salespersonId, setSalespersonId] = useState("");
  const [initialEstimate, setInitialEstimate] = useState("");
  const [revisedEstimate, setRevisedEstimate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (record) {
      setClientName(record.client_name || "");
      setOffice(record.office || "");
      setAdjuster(record.adjuster || "");
      setSalespersonId(record.salesperson_id || "");
      setInitialEstimate(record.initial_estimate?.toString() || "");
      setRevisedEstimate(record.revised_estimate?.toString() || "");
    }
  }, [record]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SalesCommission>) => {
      const { error } = await supabase
        .from("sales_commissions")
        .update(data)
        .eq("id", record?.id);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      queryClient.invalidateQueries({ queryKey: ["year_summaries"] });
      toast({
        title: "Record updated",
        description: "The sales record has been saved.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update record. Please try again.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  const handleSave = () => {
    if (!clientName.trim()) {
      toast({
        title: "Validation error",
        description: "Client name is required.",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({
      client_name: clientName,
      office: office || null,
      adjuster: adjuster || null,
      salesperson_id: salespersonId || null,
      initial_estimate: initialEstimate ? parseFloat(initialEstimate) : null,
      revised_estimate: revisedEstimate ? parseFloat(revisedEstimate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-glass-border/30 rounded-xl max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Sales Record</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-secondary/50 border-glass-border/30 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="office">Office</Label>
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger className="bg-secondary/50 border-glass-border/30 rounded-xl">
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-glass-border/30 rounded-xl">
                  <SelectItem value="H" className="rounded-lg">Houston</SelectItem>
                  <SelectItem value="D" className="rounded-lg">Dallas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salesperson">Salesperson</Label>
              <Select value={salespersonId} onValueChange={setSalespersonId}>
                <SelectTrigger className="bg-secondary/50 border-glass-border/30 rounded-xl">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-glass-border/30 rounded-xl">
                  {salespeople.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id} className="rounded-lg">
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjuster">Adjuster</Label>
            <Input
              id="adjuster"
              value={adjuster}
              onChange={(e) => setAdjuster(e.target.value)}
              className="bg-secondary/50 border-glass-border/30 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialEstimate">Initial Estimate</Label>
              <Input
                id="initialEstimate"
                type="number"
                value={initialEstimate}
                onChange={(e) => setInitialEstimate(e.target.value)}
                className="bg-secondary/50 border-glass-border/30 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisedEstimate">Revised Estimate</Label>
              <Input
                id="revisedEstimate"
                type="number"
                value={revisedEstimate}
                onChange={(e) => setRevisedEstimate(e.target.value)}
                className="bg-secondary/50 border-glass-border/30 rounded-xl"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}