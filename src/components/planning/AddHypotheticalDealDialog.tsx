import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { HypotheticalDeal } from "@/hooks/useHypotheticalDeals";

interface AddHypotheticalDealDialogProps {
  onAdd: (deal: Omit<HypotheticalDeal, 'id'>) => void;
}

const PRESETS = [
  { label: "Avg Residential", value: 150000, category: "residential" as const },
  { label: "Avg Commercial", value: 400000, category: "commercial" as const },
  { label: "Large Commercial", value: 800000, category: "commercial" as const },
  { label: "Institutional", value: 300000, category: "religious" as const },
];

const MONTHS_2026 = [
  "2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15",
  "2026-05-15", "2026-06-15", "2026-07-15", "2026-08-15",
  "2026-09-15", "2026-10-15", "2026-11-15", "2026-12-15",
];

const MONTH_LABELS = [
  "January 2026", "February 2026", "March 2026", "April 2026",
  "May 2026", "June 2026", "July 2026", "August 2026",
  "September 2026", "October 2026", "November 2026", "December 2026",
];

export function AddHypotheticalDealDialog({ onAdd }: AddHypotheticalDealDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState(MONTHS_2026[new Date().getMonth()] || MONTHS_2026[0]);
  const [category, setCategory] = useState<HypotheticalDeal['category']>("residential");
  const [probability, setProbability] = useState("75");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onAdd({
      client_name: clientName || "Hypothetical Deal",
      expected_value: parseFloat(expectedValue) || 0,
      expected_close_date: expectedCloseDate,
      category,
      probability: parseInt(probability),
      notes: notes || undefined,
    });

    // Reset form
    setClientName("");
    setExpectedValue("");
    setExpectedCloseDate(MONTHS_2026[new Date().getMonth()] || MONTHS_2026[0]);
    setCategory("residential");
    setProbability("75");
    setNotes("");
    setOpen(false);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setExpectedValue(preset.value.toString());
    setCategory(preset.category);
    setClientName(`${preset.label} Opportunity`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-violet-500/50 text-violet-600 hover:bg-violet-500/10">
          <Plus className="w-4 h-4" />
          Add Hypothetical Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            Add Hypothetical Deal
          </DialogTitle>
        </DialogHeader>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Add Presets</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client/Opportunity Name</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g., Smith Commercial Building"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedValue">Expected Value ($)</Label>
              <Input
                id="expectedValue"
                type="number"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder="400000"
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probability</Label>
              <Select value={probability} onValueChange={setProbability}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25% - Early Stage</SelectItem>
                  <SelectItem value="50">50% - In Discussion</SelectItem>
                  <SelectItem value="75">75% - Likely</SelectItem>
                  <SelectItem value="90">90% - Very Likely</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as HypotheticalDeal['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="religious">Religious</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeDate">Expected Close</Label>
              <Select value={expectedCloseDate} onValueChange={setExpectedCloseDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_2026.map((date, idx) => (
                    <SelectItem key={date} value={date}>
                      {MONTH_LABELS[idx]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
              Add to Sandbox
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
