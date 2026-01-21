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
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdjusterRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjuster: string;
  clientName: string;
  claimId: string;
  salespersonId: string;
  onSubmit: (data: { rating: number; notes: string }) => void;
  isSubmitting?: boolean;
}

export function AdjusterRatingDialog({
  open,
  onOpenChange,
  adjuster,
  clientName,
  claimId,
  salespersonId,
  onSubmit,
  isSubmitting = false,
}: AdjusterRatingDialogProps) {
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onSubmit({ rating, notes });
    setRating(5);
    setNotes("");
  };

  const getRatingColor = (value: number) => {
    if (value >= 8) return "text-green-500";
    if (value >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingLabel = (value: number) => {
    if (value >= 9) return "Excellent";
    if (value >= 7) return "Good";
    if (value >= 5) return "Average";
    if (value >= 3) return "Below Average";
    return "Poor";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-glass-border/30 rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Rate Adjuster
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              How would you rate <span className="font-medium text-foreground">{adjuster}</span>'s 
              performance on the <span className="font-medium text-foreground">{clientName}</span> claim?
            </p>
          </div>

          {/* Rating slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", getRatingColor(rating))}>
                  {rating}
                </span>
                <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
            </div>
            
            <Slider
              value={[rating]}
              onValueChange={(values) => setRating(values[0])}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor (1)</span>
              <span className={cn("font-medium", getRatingColor(rating))}>
                {getRatingLabel(rating)}
              </span>
              <span>Excellent (10)</span>
            </div>
          </div>

          {/* Star visualization */}
          <div className="flex justify-center gap-1">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-6 h-6 transition-colors",
                    i < rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional feedback about this adjuster's performance..."
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
