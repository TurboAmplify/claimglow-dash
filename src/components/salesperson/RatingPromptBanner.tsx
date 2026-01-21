import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp, X } from "lucide-react";
import { useClaimsNeedingRating, useAdjusterRatings } from "@/hooks/useAdjusterRatings";
import { AdjusterRatingDialog } from "./AdjusterRatingDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RatingPromptBannerProps {
  salespersonId: string;
}

export function RatingPromptBanner({ salespersonId }: RatingPromptBannerProps) {
  const { data: claimsNeedingRating = [], refetch } = useClaimsNeedingRating(salespersonId);
  const { createRating, isCreating } = useAdjusterRatings(salespersonId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<{
    id: string;
    clientName: string;
    adjuster: string;
  } | null>(null);

  if (isDismissed || claimsNeedingRating.length === 0) {
    return null;
  }

  const handleRatingSubmit = (data: { rating: number; notes: string }) => {
    if (!selectedClaim) return;
    
    createRating({
      sales_commission_id: selectedClaim.id,
      salesperson_id: salespersonId,
      adjuster: selectedClaim.adjuster,
      rating: data.rating,
      notes: data.notes || undefined,
    }, {
      onSuccess: () => {
        setSelectedClaim(null);
        refetch();
      },
    });
  };

  return (
    <>
      <Card className="border-yellow-500/30 bg-yellow-500/5 animate-fade-in">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">Rate Your Adjusters</h3>
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                    {claimsNeedingRating.length} pending
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  You have claims over 6 months old that need adjuster ratings. Your feedback helps improve our partnerships.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDismissed(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-2 border-t border-yellow-500/20 pt-4">
              {claimsNeedingRating.slice(0, 5).map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{claim.client_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Adjuster: {claim.adjuster} · Signed: {claim.date_signed ? format(new Date(claim.date_signed), "MMM d, yyyy") : "N/A"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedClaim({
                      id: claim.id,
                      clientName: claim.client_name,
                      adjuster: claim.adjuster!,
                    })}
                    className="rounded-lg"
                  >
                    <Star className="w-3.5 h-3.5 mr-1.5" />
                    Rate
                  </Button>
                </div>
              ))}
              
              {claimsNeedingRating.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{claimsNeedingRating.length - 5} more claims to rate
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClaim && (
        <AdjusterRatingDialog
          open={!!selectedClaim}
          onOpenChange={(open) => !open && setSelectedClaim(null)}
          adjuster={selectedClaim.adjuster}
          clientName={selectedClaim.clientName}
          claimId={selectedClaim.id}
          salespersonId={salespersonId}
          onSubmit={handleRatingSubmit}
          isSubmitting={isCreating}
        />
      )}
    </>
  );
}
