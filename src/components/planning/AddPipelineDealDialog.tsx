import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { NewPipelineDeal } from "@/hooks/useDealPipeline";

interface AddPipelineDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (deal: NewPipelineDeal) => void;
  salespersonId: string;
  isSubmitting?: boolean;
}

const STAGE_PROBABILITIES: Record<string, number> = {
  prospect: 20,
  qualified: 40,
  proposal: 60,
  negotiation: 75,
  closing: 90,
};

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal Sent",
  negotiation: "Negotiation",
  closing: "Closing",
};

export function AddPipelineDealDialog({
  open,
  onOpenChange,
  onSubmit,
  salespersonId,
  isSubmitting = false,
}: AddPipelineDealDialogProps) {
  const [clientName, setClientName] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [stage, setStage] = useState("prospect");
  const [probability, setProbability] = useState(20);
  const [notes, setNotes] = useState("");

  const handleStageChange = (newStage: string) => {
    setStage(newStage);
    setProbability(STAGE_PROBABILITIES[newStage] || 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim() || !expectedValue || !expectedCloseDate) {
      return;
    }

    onSubmit({
      salesperson_id: salespersonId,
      client_name: clientName.trim(),
      expected_value: parseFloat(expectedValue),
      expected_close_date: expectedCloseDate,
      stage,
      probability,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setClientName("");
    setExpectedValue("");
    setExpectedCloseDate("");
    setStage("prospect");
    setProbability(20);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Pipeline Deal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedValue">Expected Value ($) *</Label>
            <Input
              id="expectedValue"
              type="number"
              min="0"
              step="1000"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
              placeholder="150000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Expected Close Date *</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={stage} onValueChange={handleStageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Probability: {probability}%</Label>
            <Slider
              value={[probability]}
              onValueChange={([value]) => setProbability(value)}
              min={0}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
