import { useState, useRef, useEffect } from "react";
import { Bell, Star, Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClaimsNeedingRating, useTeamClaimsNeedingRating, useAdjusterRatings } from "@/hooks/useAdjusterRatings";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { AdjusterRatingDialog } from "@/components/salesperson/AdjusterRatingDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function GlobalAlertsIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<{
    id: string;
    clientName: string;
    adjuster: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { salesperson, isDirector } = useCurrentSalesperson();
  const salespersonId = salesperson?.id;
  
  // Individual alerts for the current user
  const { data: personalClaims = [], refetch: refetchPersonal } = useClaimsNeedingRating(salespersonId);
  
  // Team alerts for directors
  const { data: teamAlerts = [] } = useTeamClaimsNeedingRating();
  
  const { createRating, isCreating } = useAdjusterRatings(salespersonId);

  // Calculate totals
  const personalAlertCount = personalClaims.length;
  const teamAlertCount = isDirector 
    ? teamAlerts.filter(t => t.salesperson_id !== salespersonId).reduce((sum, t) => sum + t.claims.length, 0)
    : 0;
  const totalAlerts = personalAlertCount + (isDirector ? teamAlertCount : 0);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  const handleRatingSubmit = (data: { rating: number; notes: string }) => {
    if (!selectedClaim || !salespersonId) return;
    
    createRating({
      sales_commission_id: selectedClaim.id,
      salesperson_id: salespersonId,
      adjuster: selectedClaim.adjuster,
      rating: data.rating,
      notes: data.notes || undefined,
    }, {
      onSuccess: () => {
        setSelectedClaim(null);
        refetchPersonal();
      },
    });
  };

  if (totalAlerts === 0) {
    return (
      <div className="relative p-2">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "relative p-2 rounded-lg transition-all duration-200",
            "hover:bg-sidebar-accent/50",
            isExpanded && "bg-sidebar-accent/50"
          )}
        >
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            totalAlerts > 0 ? "text-accent-foreground" : "text-muted-foreground"
          )} />
          {totalAlerts > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs font-bold bg-accent text-accent-foreground border-0"
            >
              {totalAlerts > 99 ? "99+" : totalAlerts}
            </Badge>
          )}
        </button>

        {isExpanded && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-sidebar rounded-xl border border-sidebar-border/30 shadow-xl z-50 animate-fade-in overflow-hidden">
            <div className="p-3 border-b border-sidebar-border/30">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent-foreground" />
                Alerts
                <Badge variant="secondary" className="ml-auto">
                  {totalAlerts}
                </Badge>
              </h3>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {/* Personal Rating Alerts */}
              {personalAlertCount > 0 && (
                <div className="p-3 border-b border-sidebar-border/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-accent-foreground" />
                    <span className="text-sm font-medium text-foreground">Rating Needed</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {personalAlertCount}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {personalClaims.slice(0, 5).map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{claim.client_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {claim.adjuster} · {claim.date_signed ? format(new Date(claim.date_signed), "MMM yyyy") : "N/A"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedClaim({
                            id: claim.id,
                            clientName: claim.client_name,
                            adjuster: claim.adjuster!,
                          })}
                          className="h-7 px-2 text-accent-foreground hover:bg-accent/20"
                        >
                          <Star className="h-3.5 w-3.5 mr-1" />
                          Rate
                        </Button>
                      </div>
                    ))}
                    {personalAlertCount > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{personalAlertCount - 5} more claims to rate
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Team Alerts (Directors Only) */}
              {isDirector && teamAlertCount > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Team Alerts</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {teamAlertCount}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {teamAlerts
                      .filter(t => t.salesperson_id !== salespersonId)
                      .map((team) => (
                        <div
                          key={team.salesperson_id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary">
                                {team.salesperson_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="text-sm font-medium">{team.salesperson_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {team.claims.length} pending
                            </Badge>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Empty state fallback */}
              {personalAlertCount === 0 && (!isDirector || teamAlertCount === 0) && (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedClaim && salespersonId && (
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
