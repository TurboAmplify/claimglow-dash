import { useState, useRef, useEffect } from "react";
import { Bell, Star, Users, X, Clock, CheckCircle, User, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { useClaimAlerts, useTeamClaimAlerts, useAdjusterRatings, type ClaimMilestone, type ClaimAlert } from "@/hooks/useAdjusterRatings";
import { AdjusterRatingDialog } from "@/components/salesperson/AdjusterRatingDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { createPortal } from "react-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function getMilestoneConfig(milestone: ClaimMilestone) {
  switch (milestone) {
    case '2_weeks':
      return { label: '2-Week', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock };
    case '3_months':
      return { label: '3-Month', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock };
    case '6_months':
      return { label: '6-Month', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Clock };
    case 'completed':
      return { label: 'Completed', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle };
    default:
      return { label: 'Review', color: 'text-primary', bg: 'bg-primary/10', icon: Star };
  }
}

// Component for rendering alerts grouped by milestone
function MilestoneAlertGroup({
  milestone,
  alerts,
  onSelectClaim,
  showRateButton = true,
}: {
  milestone: ClaimMilestone;
  alerts: ClaimAlert[];
  onSelectClaim?: (claim: { id: string; clientName: string; adjuster: string; milestone: ClaimMilestone }) => void;
  showRateButton?: boolean;
}) {
  if (!alerts?.length) return null;
  
  const config = getMilestoneConfig(milestone);
  const MilestoneIcon = config.icon;
  
  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-1.5 text-xs font-medium", config.color)}>
        <MilestoneIcon className="h-3 w-3" />
        {config.label} Reviews ({alerts.length})
      </div>
      {alerts.slice(0, 3).map(alert => {
        if (!alert.adjuster) return null;
        
        return (
          <div 
            key={`${alert.id}-${milestone}`}
            className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
          >
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{alert.client_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {alert.adjuster} · {alert.date_signed ? format(new Date(alert.date_signed), "MMM d, yyyy") : "N/A"}
              </p>
            </div>
            {showRateButton && onSelectClaim && (
              <Button
                size="sm"
                variant="ghost"
                className={cn("h-7 rounded-lg ml-2 shrink-0", config.bg, config.color, "hover:opacity-80")}
                onClick={() => onSelectClaim({
                  id: alert.id,
                  clientName: alert.client_name,
                  adjuster: alert.adjuster,
                  milestone: alert.milestone,
                })}
              >
                <Star className="w-3 h-3 mr-1" />
                Rate
              </Button>
            )}
          </div>
        );
      })}
      {alerts.length > 3 && (
        <p className="text-xs text-muted-foreground text-center">
          +{alerts.length - 3} more {config.label.toLowerCase()} reviews
        </p>
      )}
    </div>
  );
}

// Component for expandable team member alerts
function TeamMemberAlerts({
  salespersonName,
  alerts,
}: {
  salespersonName: string;
  alerts: ClaimAlert[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group alerts by milestone
  const alertsByMilestone = alerts.reduce((acc, alert) => {
    if (!acc[alert.milestone]) acc[alert.milestone] = [];
    acc[alert.milestone].push(alert);
    return acc;
  }, {} as Record<ClaimMilestone, ClaimAlert[]>);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{salespersonName}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {alerts.length} pending
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 ml-6 space-y-3 border-l-2 border-border pl-3">
        {(['2_weeks', '3_months', '6_months', 'completed'] as ClaimMilestone[]).map(milestone => (
          <MilestoneAlertGroup
            key={milestone}
            milestone={milestone}
            alerts={alertsByMilestone[milestone] || []}
            showRateButton={false}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface AlertDropdownContentProps {
  personalAlerts: ClaimAlert[];
  alertsByMilestone: Record<ClaimMilestone, ClaimAlert[]>;
  teamAlerts: Array<{ salesperson_id: string; salesperson_name: string; alerts: ClaimAlert[] }>;
  teamAlertsCount: number;
  isDirector: boolean;
  salespersonId: string | undefined;
  salespersonName: string | undefined;
  onClose: () => void;
  onSelectClaim: (claim: { id: string; clientName: string; adjuster: string; milestone: ClaimMilestone }) => void;
}

function AlertDropdownContent({
  personalAlerts,
  alertsByMilestone,
  teamAlerts,
  teamAlertsCount,
  isDirector,
  salespersonId,
  salespersonName,
  onClose,
  onSelectClaim,
}: AlertDropdownContentProps) {
  const totalAlerts = personalAlerts.length + (isDirector ? teamAlertsCount : 0);

  // Filter team alerts to exclude current user
  const filteredTeamAlerts = teamAlerts.filter(t => t.salesperson_id !== salespersonId);

  return (
    <div className="fixed inset-x-4 top-16 sm:inset-auto sm:right-4 sm:top-16 sm:w-96 max-h-[80vh] bg-background border border-border rounded-xl shadow-2xl z-[9999] animate-fade-in overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Alerts</span>
          <Badge variant="secondary" className="text-xs">
            {totalAlerts}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-lg"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Personal Rating Alerts Section */}
        {personalAlerts.length > 0 && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wide">
              <User className="h-3.5 w-3.5" />
              My Ratings {salespersonName && `(${salespersonName})`}
            </div>
            
            {(['2_weeks', '3_months', '6_months', 'completed'] as ClaimMilestone[]).map(milestone => (
              <MilestoneAlertGroup
                key={milestone}
                milestone={milestone}
                alerts={alertsByMilestone[milestone] || []}
                onSelectClaim={onSelectClaim}
                showRateButton={true}
              />
            ))}
          </div>
        )}

        {/* Director Team Alerts Section */}
        {isDirector && filteredTeamAlerts.length > 0 && (
          <div className={cn("p-3 space-y-3", personalAlerts.length > 0 && "border-t border-border")}>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Users className="h-3.5 w-3.5" />
              Team Ratings ({teamAlertsCount} pending)
            </div>
            <div className="space-y-2">
              {filteredTeamAlerts.map(team => (
                <TeamMemberAlerts
                  key={team.salesperson_id}
                  salespersonName={team.salesperson_name}
                  alerts={team.alerts}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {personalAlerts.length === 0 && teamAlertsCount === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function GlobalAlertsIndicator() {
  const { salesperson, isDirector, isLoading: isLoadingSalesperson } = useCurrentSalesperson();
  const { data: personalAlerts = [], refetch: refetchPersonal, isLoading: isLoadingPersonal } = useClaimAlerts(salesperson?.id);
  const { data: teamAlerts = [], isLoading: isLoadingTeam } = useTeamClaimAlerts();
  const { createRating, isCreating } = useAdjusterRatings(salesperson?.id);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<{
    id: string;
    clientName: string;
    adjuster: string;
    milestone: ClaimMilestone;
  } | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Show loading state while fetching data
  const isLoading = isLoadingSalesperson || isLoadingPersonal || isLoadingTeam;

  // Group personal alerts by milestone
  const alertsByMilestone = personalAlerts.reduce((acc, alert) => {
    if (!acc[alert.milestone]) acc[alert.milestone] = [];
    acc[alert.milestone].push(alert);
    return acc;
  }, {} as Record<ClaimMilestone, typeof personalAlerts>);

  // Calculate total team alerts (excluding current user)
  const teamAlertsCount = isDirector 
    ? teamAlerts
        .filter(t => t.salesperson_id !== salesperson?.id)
        .reduce((sum, t) => sum + t.alerts.length, 0)
    : 0;

  const totalAlerts = personalAlerts.length + (isDirector ? teamAlertsCount : 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Check if click is outside both the button and the dropdown
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        // Check if click is inside the portal dropdown
        const dropdown = document.getElementById('alerts-dropdown-portal');
        if (dropdown && dropdown.contains(target)) {
          return; // Click was inside dropdown, don't close
        }
        setIsExpanded(false);
      }
    }
    
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const handleRatingSubmit = (data: { 
    rating_communication: number; 
    rating_settlement: number; 
    rating_overall: number; 
    notes: string;
    claim_milestone: string;
  }) => {
    if (!selectedClaim || !salesperson?.id) return;
    
    createRating({
      sales_commission_id: selectedClaim.id,
      salesperson_id: salesperson.id,
      adjuster: selectedClaim.adjuster,
      rating_communication: data.rating_communication,
      rating_settlement: data.rating_settlement,
      rating_overall: data.rating_overall,
      claim_milestone: data.claim_milestone,
      notes: data.notes || undefined,
    }, {
      onSuccess: () => {
        setSelectedClaim(null);
        refetchPersonal();
      },
    });
  };

  // Show loading spinner while fetching
  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
        <Bell className="h-5 w-5 text-muted-foreground animate-pulse" />
      </Button>
    );
  }

  if (totalAlerts === 0) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <>
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size="icon" 
        className="relative h-9 w-9 rounded-xl hover:bg-primary/10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Bell className="h-5 w-5 text-foreground" />
        <Badge 
          className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground border-0"
        >
          {totalAlerts > 99 ? '99+' : totalAlerts}
        </Badge>
      </Button>

      {isExpanded && createPortal(
        <div id="alerts-dropdown-portal">
          <AlertDropdownContent
            personalAlerts={personalAlerts}
            alertsByMilestone={alertsByMilestone}
            teamAlerts={teamAlerts}
            teamAlertsCount={teamAlertsCount}
            isDirector={isDirector}
            salespersonId={salesperson?.id}
            salespersonName={salesperson?.name}
            onClose={() => setIsExpanded(false)}
            onSelectClaim={setSelectedClaim}
          />
        </div>,
        document.body
      )}

      {selectedClaim && (
        <AdjusterRatingDialog
          open={!!selectedClaim}
          onOpenChange={(open) => !open && setSelectedClaim(null)}
          adjuster={selectedClaim.adjuster}
          clientName={selectedClaim.clientName}
          claimId={selectedClaim.id}
          salespersonId={salesperson?.id || ""}
          milestone={selectedClaim.milestone}
          onSubmit={handleRatingSubmit}
          isSubmitting={isCreating}
        />
      )}
    </>
  );
}
