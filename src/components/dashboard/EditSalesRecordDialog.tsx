import { useState, useEffect, useMemo } from "react";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, X, Users } from "lucide-react";
import { SalesCommission } from "@/types/sales";
import { AutocompleteInput, AutocompleteOption } from "@/components/ui/autocomplete-input";
import { AddPersonDialog } from "@/components/ui/add-person-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EditSalesRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalesCommission | null;
  salespeople: { id: string; name: string }[];
}

interface Adjuster {
  id: string;
  name: string;
  office: string;
}

interface SplitParticipant {
  id: string | null; // null for new entries
  salespersonId: string;
  salespersonName: string;
  splitPercentage: number;
  isOriginal: boolean; // true if this is the current record
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
  const [splitPercentage, setSplitPercentage] = useState("100");
  const [splitParticipants, setSplitParticipants] = useState<SplitParticipant[]>([]);
  const [splitSectionOpen, setSplitSectionOpen] = useState(false);
  const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false);
  const [pendingNewPerson, setPendingNewPerson] = useState("");
  const [pendingPersonField, setPendingPersonField] = useState<"adjuster" | "salesperson">("adjuster");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch adjusters for the autocomplete
  const { data: adjusters = [] } = useQuery<Adjuster[]>({
    queryKey: ["adjusters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adjusters")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all salespeople for autocomplete
  const { data: allSalespeople = [] } = useQuery({
    queryKey: ["salespeople"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch related split records for the same client
  const { data: relatedSplits = [] } = useQuery({
    queryKey: ["related-splits", record?.client_name, record?.id],
    queryFn: async () => {
      if (!record?.client_name) return [];
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("id, salesperson_id, split_percentage")
        .eq("client_name", record.client_name)
        .neq("id", record.id);
      if (error) throw error;
      return data;
    },
    enabled: !!record?.client_name && !!record?.id,
  });

  // Convert adjusters to autocomplete options
  const adjusterOptions: AutocompleteOption[] = useMemo(() => {
    return adjusters.map((adj) => ({
      value: adj.name,
      label: adj.name,
      description: adj.office,
    }));
  }, [adjusters]);

  // Convert salespeople to autocomplete options
  const salespersonOptions: AutocompleteOption[] = useMemo(() => {
    return allSalespeople.map((sp) => ({
      value: sp.id,
      label: sp.name,
    }));
  }, [allSalespeople]);

  // Get selected salesperson name for display
  const selectedSalespersonName = useMemo(() => {
    return allSalespeople.find((sp) => sp.id === salespersonId)?.name || "";
  }, [allSalespeople, salespersonId]);

  useEffect(() => {
    if (record) {
      setClientName(record.client_name || "");
      setOffice(record.office || "");
      setAdjuster(record.adjuster || "");
      setSalespersonId(record.salesperson_id || "");
      setInitialEstimate(record.initial_estimate?.toString() || "");
      setRevisedEstimate(record.revised_estimate?.toString() || "");
      setSplitPercentage(record.split_percentage?.toString() || "100");
      
      // Check if there's a split (less than 100%)
      const hasSplit = (record.split_percentage || 100) < 100;
      setSplitSectionOpen(hasSplit);
    }
  }, [record]);

  // Update split participants when related splits load
  useEffect(() => {
    if (relatedSplits.length > 0 && allSalespeople.length > 0) {
      const participants: SplitParticipant[] = relatedSplits.map((split) => {
        const sp = allSalespeople.find((s) => s.id === split.salesperson_id);
        return {
          id: split.id,
          salespersonId: split.salesperson_id || "",
          salespersonName: sp?.name || "Unknown",
          splitPercentage: split.split_percentage || 0,
          isOriginal: false,
        };
      });
      setSplitParticipants(participants);
    } else {
      setSplitParticipants([]);
    }
  }, [relatedSplits, allSalespeople]);

  const handleAdjusterChange = (value: string) => {
    setAdjuster(value);
    const selectedAdjuster = adjusters.find(
      (a) => a.name.toLowerCase() === value.toLowerCase()
    );
    if (selectedAdjuster) {
      setOffice(selectedAdjuster.office);
    }
  };

  const handleSalespersonChange = (name: string) => {
    const sp = allSalespeople.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (sp) {
      setSalespersonId(sp.id);
    }
  };

  const handleNewAdjuster = (name: string) => {
    setPendingNewPerson(name);
    setPendingPersonField("adjuster");
    setAddPersonDialogOpen(true);
  };

  const handleNewSalesperson = (name: string) => {
    setPendingNewPerson(name);
    setPendingPersonField("salesperson");
    setAddPersonDialogOpen(true);
  };

  const handleAddPersonComplete = (result: { type: string; name: string; office?: string }) => {
    if (pendingPersonField === "adjuster") {
      setAdjuster(result.name);
      if (result.office) {
        setOffice(result.office);
      }
    } else {
      // For salespeople, we need to refetch to get the new ID
      queryClient.invalidateQueries({ queryKey: ["salespeople"] });
    }
  };

  const addSplitParticipant = () => {
    const currentTotal = parseFloat(splitPercentage) || 0;
    const participantsTotal = splitParticipants.reduce((sum, p) => sum + p.splitPercentage, 0);
    const remaining = Math.max(0, 100 - currentTotal - participantsTotal);
    
    setSplitParticipants([
      ...splitParticipants,
      {
        id: null,
        salespersonId: "",
        salespersonName: "",
        splitPercentage: remaining,
        isOriginal: false,
      },
    ]);
  };

  const removeSplitParticipant = (index: number) => {
    setSplitParticipants(splitParticipants.filter((_, i) => i !== index));
  };

  const updateSplitParticipant = (index: number, field: "salespersonId" | "splitPercentage", value: string) => {
    const updated = [...splitParticipants];
    if (field === "salespersonId") {
      const sp = allSalespeople.find((s) => s.id === value);
      updated[index] = {
        ...updated[index],
        salespersonId: value,
        salespersonName: sp?.name || "",
      };
    } else {
      updated[index] = {
        ...updated[index],
        splitPercentage: parseFloat(value) || 0,
      };
    }
    setSplitParticipants(updated);
  };

  const totalSplit = useMemo(() => {
    const mainSplit = parseFloat(splitPercentage) || 0;
    const participantsTotal = splitParticipants.reduce((sum, p) => sum + p.splitPercentage, 0);
    return mainSplit + participantsTotal;
  }, [splitPercentage, splitParticipants]);

  const getAvailableSalespeople = (currentId: string) => {
    const usedIds = [salespersonId, ...splitParticipants.map((p) => p.salespersonId)];
    return allSalespeople.filter((sp) => sp.id === currentId || !usedIds.includes(sp.id));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SalesCommission> & { splitParticipants?: SplitParticipant[] }) => {
      const { splitParticipants: participants, ...mainData } = data;
      
      // Update the main record
      const { error: mainError } = await supabase
        .from("sales_commissions")
        .update({
          ...mainData,
          split_percentage: parseFloat(splitPercentage) || 100,
        })
        .eq("id", record?.id);
      
      if (mainError) throw mainError;

      // Handle split participants
      if (participants && participants.length > 0 && record) {
        for (const participant of participants) {
          if (participant.id) {
            // Update existing split record
            const { error } = await supabase
              .from("sales_commissions")
              .update({
                split_percentage: participant.splitPercentage,
                salesperson_id: participant.salespersonId,
              })
              .eq("id", participant.id);
            if (error) throw error;
          } else if (participant.salespersonId) {
            // Create new split record (copy main record with different salesperson)
            const { error } = await supabase
              .from("sales_commissions")
              .insert({
                client_name: clientName,
                office: office || null,
                adjuster: adjuster || null,
                salesperson_id: participant.salespersonId,
                initial_estimate: initialEstimate ? parseFloat(initialEstimate) : null,
                revised_estimate: revisedEstimate ? parseFloat(revisedEstimate) : null,
                split_percentage: participant.splitPercentage,
                fee_percentage: record.fee_percentage,
                commission_percentage: record.commission_percentage,
                date_signed: record.date_signed,
                year: record.year,
                status: record.status,
              });
            if (error) throw error;
          }
        }
      }

      // Handle removed participants (delete records that were in relatedSplits but not in current participants)
      const currentParticipantIds = new Set(participants?.filter((p) => p.id).map((p) => p.id));
      for (const existingSplit of relatedSplits) {
        if (!currentParticipantIds.has(existingSplit.id)) {
          await supabase.from("sales_commissions").delete().eq("id", existingSplit.id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
      queryClient.invalidateQueries({ queryKey: ["year_summaries"] });
      queryClient.invalidateQueries({ queryKey: ["related-splits"] });
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

    if (splitParticipants.length > 0 && totalSplit !== 100) {
      toast({
        title: "Validation error",
        description: `Split percentages must total 100% (currently ${totalSplit}%)`,
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
      splitParticipants,
    });
  };

  return (
    <>
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
                    <SelectItem value="Louisiana" className="rounded-lg">Louisiana</SelectItem>
                    <SelectItem value="Austin" className="rounded-lg">Austin</SelectItem>
                    <SelectItem value="San Antonio" className="rounded-lg">San Antonio</SelectItem>
                    <SelectItem value="Other" className="rounded-lg">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesperson">Salesperson</Label>
                <AutocompleteInput
                  value={selectedSalespersonName}
                  onValueChange={handleSalespersonChange}
                  options={salespersonOptions}
                  placeholder="Select salesperson"
                  emptyMessage="No salespeople found"
                  allowCustom={true}
                  onNewValue={handleNewSalesperson}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjuster">Adjuster</Label>
              <AutocompleteInput
                value={adjuster}
                onValueChange={handleAdjusterChange}
                options={adjusterOptions}
                placeholder="Select or type adjuster"
                emptyMessage="No adjusters found"
                allowCustom={true}
                onNewValue={handleNewAdjuster}
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

            {/* Split Section */}
            <Collapsible open={splitSectionOpen} onOpenChange={setSplitSectionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" type="button" className="w-full justify-between rounded-xl">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Split Configuration
                    {splitParticipants.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {splitParticipants.length + 1} people
                      </span>
                    )}
                  </span>
                  <span className={`text-sm ${totalSplit === 100 ? "text-green-600" : "text-amber-600"}`}>
                    {totalSplit}%
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3 p-3 rounded-xl bg-secondary/30 border border-border/50">
                {/* Current salesperson split */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm font-medium text-foreground">
                    {selectedSalespersonName || "Current Salesperson"}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={splitPercentage}
                    onChange={(e) => setSplitPercentage(e.target.value)}
                    className="w-20 h-8 text-sm text-center"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>

                {/* Additional split participants */}
                {splitParticipants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={participant.salespersonId}
                      onValueChange={(value) => updateSplitParticipant(index, "salespersonId", value)}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue placeholder="Select salesperson" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableSalespeople(participant.salespersonId).map((sp) => (
                          <SelectItem key={sp.id} value={sp.id} className="text-sm">
                            {sp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={participant.splitPercentage}
                      onChange={(e) => updateSplitParticipant(index, "splitPercentage", e.target.value)}
                      className="w-20 h-8 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSplitParticipant(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSplitParticipant}
                  className="w-full border-dashed"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Split Partner
                </Button>

                {totalSplit !== 100 && (
                  <p className="text-xs text-amber-600">
                    Split percentages should total 100% (currently {totalSplit}%)
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
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

      <AddPersonDialog
        open={addPersonDialogOpen}
        onOpenChange={setAddPersonDialogOpen}
        personName={pendingNewPerson}
        onComplete={handleAddPersonComplete}
      />
    </>
  );
}
