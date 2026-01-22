import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Star, Loader2, MessageSquare, Handshake, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaimMilestone } from "@/hooks/useAdjusterRatings";

interface AdjusterRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjuster: string;
  clientName: string;
  claimId: string;
  salespersonId: string;
  milestone?: ClaimMilestone;
  onSubmit: (data: { 
    rating_communication: number; 
    rating_settlement: number; 
    rating_overall: number; 
    notes: string;
    claim_milestone: string;
  }) => void;
  isSubmitting?: boolean;
}

interface RatingSliderProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}

function RatingSlider({ label, description, icon, value, onChange }: RatingSliderProps) {
  const getRatingColor = (val: number) => {
    if (val >= 8) return "text-green-500";
    if (val >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingLabel = (val: number) => {
    if (val >= 9) return "Excellent";
    if (val >= 7) return "Good";
    if (val >= 5) return "Average";
    if (val >= 3) return "Below Average";
    return "Poor";
  };

  return (
    <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-glass-border/20">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-right">
          <span className={cn("text-xl font-bold", getRatingColor(value))}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">/ 10</span>
        </div>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={1}
        max={10}
        step={1}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Poor</span>
        <span className={cn("font-medium", getRatingColor(value))}>
          {getRatingLabel(value)}
        </span>
        <span>Excellent</span>
      </div>
      
      {/* Star visualization */}
      <div className="flex justify-center gap-0.5">
        {[...Array(10)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                i < value ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function getMilestoneInfo(milestone?: ClaimMilestone) {
  switch (milestone) {
    case '2_weeks':
      return {
        title: '2-Week Check-in',
        description: 'Early feedback on initial communication and responsiveness',
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
      };
    case '3_months':
      return {
        title: '3-Month Review',
        description: 'Mid-process evaluation of progress and communication',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
      };
    case '6_months':
      return {
        title: '6-Month Review',
        description: 'Comprehensive evaluation of the adjuster\'s performance',
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
      };
    case 'completed':
      return {
        title: 'Claim Completed',
        description: 'Final review of the adjuster\'s overall performance',
        color: 'text-green-500',
        bg: 'bg-green-500/10',
      };
    default:
      return {
        title: 'Rate Adjuster',
        description: 'Provide feedback on the adjuster\'s performance',
        color: 'text-primary',
        bg: 'bg-primary/10',
      };
  }
}

export function AdjusterRatingDialog({
  open,
  onOpenChange,
  adjuster,
  clientName,
  claimId,
  salespersonId,
  milestone = '6_months',
  onSubmit,
  isSubmitting = false,
}: AdjusterRatingDialogProps) {
  const [ratingCommunication, setRatingCommunication] = useState(7);
  const [ratingSettlement, setRatingSettlement] = useState(7);
  const [ratingOverall, setRatingOverall] = useState(7);
  const [notes, setNotes] = useState("");

  const milestoneInfo = getMilestoneInfo(milestone);

  const handleSubmit = () => {
    onSubmit({ 
      rating_communication: ratingCommunication, 
      rating_settlement: ratingSettlement, 
      rating_overall: ratingOverall, 
      notes,
      claim_milestone: milestone,
    });
    // Reset form
    setRatingCommunication(7);
    setRatingSettlement(7);
    setRatingOverall(7);
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-glass-border/30 rounded-xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", milestoneInfo.bg)}>
              <Star className={cn("w-5 h-5", milestoneInfo.color)} />
            </div>
            <div>
              <span className="block">{milestoneInfo.title}</span>
              <span className="text-xs font-normal text-muted-foreground">{milestoneInfo.description}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm p-3 rounded-lg bg-secondary/50">
            <p className="text-muted-foreground">
              Rate <span className="font-medium text-foreground">{adjuster}</span>'s 
              performance on the <span className="font-medium text-foreground">{clientName}</span> claim.
            </p>
          </div>

          {/* Three Rating Categories */}
          <RatingSlider
            label="Communication"
            description="Responsiveness and clarity of updates"
            icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
            value={ratingCommunication}
            onChange={setRatingCommunication}
          />

          <RatingSlider
            label="Settlement"
            description="Quality and fairness of the settlement"
            icon={<Handshake className="w-4 h-4 text-green-500" />}
            value={ratingSettlement}
            onChange={setRatingSettlement}
          />

          <RatingSlider
            label="Overall"
            description="Overall satisfaction with this adjuster"
            icon={<Award className="w-4 h-4 text-yellow-500" />}
            value={ratingOverall}
            onChange={setRatingOverall}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific feedback or comments about this adjuster's performance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] bg-secondary/50 border-glass-border/30 rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
