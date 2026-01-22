import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp, X, Clock, CheckCircle } from "lucide-react";
import { useClaimAlerts, useAdjusterRatings, type ClaimMilestone } from "@/hooks/useAdjusterRatings";
import { AdjusterRatingDialog } from "./AdjusterRatingDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RatingPromptBannerProps {
  salespersonId: string;
}

function getMilestoneConfig(milestone: ClaimMilestone) {
  switch (milestone) {
    case '2_weeks':
      return { label: '2-Week Check-in', color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
    case '3_months':
      return { label: '3-Month Review', color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
    case '6_months':
      return { label: '6-Month Review', color: 'text-purple-500', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
    case 'completed':
      return { label: 'Claim Completed', color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30' };
    default:
      return { label: 'Review', color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
  }
}

export function RatingPromptBanner({ salespersonId }: RatingPromptBannerProps) {
  const { data: claimAlerts = [], refetch } = useClaimAlerts(salespersonId);
  const { createRating, isCreating } = useAdjusterRatings(salespersonId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<{
    id: string;
    clientName: string;
    adjuster: string;
    milestone: ClaimMilestone;
  } | null>(null);

  if (isDismissed || claimAlerts.length === 0) {
    return null;
  }

  // Group alerts by milestone
  const alertsByMilestone = claimAlerts.reduce((acc, alert) => {
    if (!acc[alert.milestone]) acc[alert.milestone] = [];
    acc[alert.milestone].push(alert);
    return acc;
  }, {} as Record<ClaimMilestone, typeof claimAlerts>);

  const handleRatingSubmit = (data: { 
    rating_communication: number; 
    rating_settlement: number; 
    rating_overall: number; 
    notes: string;
    claim_milestone: string;
  }) => {
    if (!selectedClaim) return;
    
    createRating({
      sales_commission_id: selectedClaim.id,
      salesperson_id: salespersonId,
      adjuster: selectedClaim.adjuster,
      rating_communication: data.rating_communication,
      rating_settlement: data.rating_settlement,
      rating_overall: data.rating_overall,
      claim_milestone: data.claim_milestone,
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
                    {claimAlerts.length} pending
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  You have claims requiring adjuster feedback. Your ratings help improve our partnerships.
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
            <div className="mt-4 space-y-4 border-t border-yellow-500/20 pt-4">
              {(['2_weeks', '3_months', '6_months', 'completed'] as ClaimMilestone[]).map(milestone => {
                const alerts = alertsByMilestone[milestone];
                if (!alerts?.length) return null;
                
                const config = getMilestoneConfig(milestone);
                
                return (
                  <div key={milestone} className="space-y-2">
                    <div className={cn("flex items-center gap-2 text-sm font-medium", config.color)}>
                      {milestone === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      {config.label} ({alerts.length})
                    </div>
                    
                    {alerts.slice(0, 3).map((claim) => (
                      <div
                        key={`${claim.id}-${milestone}`}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg bg-background/50 border",
                          config.border
                        )}
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
                            milestone: claim.milestone,
                          })}
                          className={cn("rounded-lg", config.bg, config.color)}
                        >
                          <Star className="w-3.5 h-3.5 mr-1.5" />
                          Rate
                        </Button>
                      </div>
                    ))}
                    
                    {alerts.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{alerts.length - 3} more {config.label.toLowerCase()} reviews
                      </p>
                    )}
                  </div>
                );
              })}
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
          milestone={selectedClaim.milestone}
          onSubmit={handleRatingSubmit}
          isSubmitting={isCreating}
        />
      )}
    </>
  );
}
