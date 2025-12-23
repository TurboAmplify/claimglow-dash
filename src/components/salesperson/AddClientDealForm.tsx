import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, Save, Calculator } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddClientDealFormProps {
  salespersonId: string;
  onSuccess?: () => void;
}

export function AddClientDealForm({ salespersonId, onSuccess }: AddClientDealFormProps) {
  const [clientName, setClientName] = useState("");
  const [adjuster, setAdjuster] = useState("");
  const [office, setOffice] = useState("");
  const [dateSigned, setDateSigned] = useState<Date | undefined>(new Date());
  const [initialEstimate, setInitialEstimate] = useState("");
  const [feePercentage, setFeePercentage] = useState("7");
  const [commissionPercentage, setCommissionPercentage] = useState("8");
  const [splitPercentage, setSplitPercentage] = useState("100");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Live commission preview
  const projectedCommission = useMemo(() => {
    const estimate = parseFloat(initialEstimate) || 0;
    const fee = parseFloat(feePercentage) / 100 || 0;
    const commission = parseFloat(commissionPercentage) / 100 || 0;
    const split = parseFloat(splitPercentage) / 100 || 0;
    
    const feeEarned = estimate * fee;
    const commissionEarned = feeEarned * commission * split;
    
    return { feeEarned, commissionEarned };
  }, [initialEstimate, feePercentage, commissionPercentage, splitPercentage]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a client name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const estimate = parseFloat(initialEstimate) || 0;
      const currentYear = new Date().getFullYear();

      const { error } = await supabase.from("sales_commissions").insert({
        salesperson_id: salespersonId,
        client_name: clientName.trim(),
        adjuster: adjuster.trim() || null,
        office: office.trim() || null,
        date_signed: dateSigned ? format(dateSigned, "yyyy-MM-dd") : null,
        year: currentYear,
        initial_estimate: estimate,
        revised_estimate: estimate,
        percent_change: 0,
        insurance_checks_ytd: 0,
        old_remainder: estimate,
        new_remainder: estimate,
        fee_percentage: parseFloat(feePercentage) || 7,
        commission_percentage: parseFloat(commissionPercentage) || 8,
        split_percentage: parseFloat(splitPercentage) || 100,
        commissions_paid: 0,
        status: "open",
      });

      if (error) throw error;

      toast({
        title: "Deal added",
        description: `${clientName} has been added with projected commission of ${formatCurrency(projectedCommission.commissionEarned)}`,
      });

      // Reset form
      setClientName("");
      setAdjuster("");
      setOffice("");
      setDateSigned(new Date());
      setInitialEstimate("");
      setFeePercentage("7");
      setCommissionPercentage("8");
      setSplitPercentage("100");

      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      onSuccess?.();
    } catch (error) {
      console.error("Error adding deal:", error);
      toast({
        title: "Error",
        description: "Failed to add the deal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client Name */}
        <div className="space-y-2">
          <Label htmlFor="clientName">Client Name *</Label>
          <Input
            id="clientName"
            placeholder="Enter client name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>

        {/* Adjuster */}
        <div className="space-y-2">
          <Label htmlFor="adjuster">Adjuster</Label>
          <Input
            id="adjuster"
            placeholder="Enter adjuster name"
            value={adjuster}
            onChange={(e) => setAdjuster(e.target.value)}
          />
        </div>

        {/* Office */}
        <div className="space-y-2">
          <Label htmlFor="office">Office</Label>
          <Input
            id="office"
            placeholder="Enter office"
            value={office}
            onChange={(e) => setOffice(e.target.value)}
          />
        </div>

        {/* Date Signed */}
        <div className="space-y-2">
          <Label>Date Signed</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateSigned && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateSigned ? format(dateSigned, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateSigned}
                onSelect={setDateSigned}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Initial Estimate */}
        <div className="space-y-2">
          <Label htmlFor="initialEstimate">Initial Estimate ($)</Label>
          <Input
            id="initialEstimate"
            type="number"
            placeholder="0"
            value={initialEstimate}
            onChange={(e) => setInitialEstimate(e.target.value)}
          />
        </div>

        {/* Fee Percentage */}
        <div className="space-y-2">
          <Label htmlFor="feePercentage">Fee %</Label>
          <Input
            id="feePercentage"
            type="number"
            step="0.1"
            placeholder="7"
            value={feePercentage}
            onChange={(e) => setFeePercentage(e.target.value)}
          />
        </div>

        {/* Commission Percentage */}
        <div className="space-y-2">
          <Label htmlFor="commissionPercentage">Commission %</Label>
          <Input
            id="commissionPercentage"
            type="number"
            step="0.1"
            placeholder="8"
            value={commissionPercentage}
            onChange={(e) => setCommissionPercentage(e.target.value)}
          />
        </div>

        {/* Split Percentage */}
        <div className="space-y-2">
          <Label htmlFor="splitPercentage">Split %</Label>
          <Input
            id="splitPercentage"
            type="number"
            step="1"
            placeholder="100"
            value={splitPercentage}
            onChange={(e) => setSplitPercentage(e.target.value)}
          />
        </div>
      </div>

      {/* Commission Preview */}
      {parseFloat(initialEstimate) > 0 && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Projected Commission</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Estimated Value: </span>
              <span className="font-medium">{formatCurrency(parseFloat(initialEstimate) || 0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fee Earned: </span>
              <span className="font-medium">{formatCurrency(projectedCommission.feeEarned)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Your Commission: </span>
              <span className="font-bold text-primary">{formatCurrency(projectedCommission.commissionEarned)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Effective Rate: </span>
              <span className="font-medium">
                {((parseFloat(feePercentage) / 100) * (parseFloat(commissionPercentage) / 100) * (parseFloat(splitPercentage) / 100) * 100).toFixed(3)}%
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Adding..." : "Add Deal"}
        </Button>
      </div>
    </form>
  );
}
