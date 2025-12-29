import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePendingApprovals } from "@/hooks/useNotifications";
import { usePlanApproval } from "@/hooks/usePlanApproval";
import { useSalespeople } from "@/hooks/useSalesCommissions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle2, XCircle, User, AlertTriangle, Clock, FileX } from "lucide-react";
import { format } from "date-fns";

interface PlanAlertsIndicatorProps {
  directorId: string;
  formatCurrency: (value: number) => string;
  currentYear?: number;
}

export function PlanAlertsIndicator({ directorId, formatCurrency, currentYear = 2026 }: PlanAlertsIndicatorProps) {
  const { pendingPlans, isLoading: loadingPending } = usePendingApprovals();
  const { approvePlan, rejectPlan, isApproving, isRejecting } = usePlanApproval();
  const { data: salespeople } = useSalespeople();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Fetch all plans for the current year
  const { data: allPlans } = useQuery({
    queryKey: ["all-sales-plans", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_plans")
        .select("*")
        .eq("year", currentYear);
      if (error) throw error;
      return data;
    },
  });

  // Check if plan submission deadline is active (Dec 1st onwards)
  const isSubmissionPeriodActive = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed, so December is 11
    return currentMonth >= 11; // December or later (for next year's plan)
  }, []);

  // Find team members who haven't submitted plans
  const missingSubmissions = useMemo(() => {
    if (!salespeople || !allPlans || !isSubmissionPeriodActive) return [];
    
    // Get team members (non-directors)
    const teamMembers = salespeople.filter(sp => sp.role !== "sales_director" && sp.is_active);
    
    // Find those without plans or with draft status
    return teamMembers.filter(member => {
      const memberPlan = allPlans.find(p => p.salesperson_id === member.id);
      return !memberPlan || memberPlan.approval_status === "draft";
    }).map(member => ({
      ...member,
      plan: allPlans.find(p => p.salesperson_id === member.id),
    }));
  }, [salespeople, allPlans, isSubmissionPeriodActive]);

  const totalAlerts = (pendingPlans?.length || 0) + missingSubmissions.length;

  if (loadingPending || totalAlerts === 0) {
    return null;
  }

  const handleApprove = (plan: any) => {
    approvePlan({
      planId: plan.id,
      salespersonId: plan.salesperson_id,
      directorId,
    });
  };

  const handleReject = () => {
    if (!selectedPlan) return;
    rejectPlan({
      planId: selectedPlan.id,
      salespersonId: selectedPlan.salesperson_id,
      directorId,
      notes: rejectNotes,
    });
    setRejectDialogOpen(false);
    setSelectedPlan(null);
    setRejectNotes("");
  };

  const openRejectDialog = (plan: any) => {
    setSelectedPlan(plan);
    setRejectDialogOpen(true);
  };

  return (
    <>
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Compact Alert Icon */}
        <div className="relative cursor-pointer">
          <div className="p-2 rounded-full bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          {/* Badge count */}
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 bg-amber-500 text-white text-xs font-bold"
          >
            {totalAlerts}
          </Badge>
        </div>

        {/* Expanded Panel on Hover */}
        {isExpanded && (
          <div 
            className="absolute top-full right-0 mt-2 w-96 z-50 animate-fade-in"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
          >
            <div className="glass-card border border-amber-500/30 shadow-xl rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Plan Alerts
                </h3>
                <p className="text-xs text-muted-foreground">{totalAlerts} item{totalAlerts !== 1 ? 's' : ''} need attention</p>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {/* Pending Approvals Section */}
                {pendingPlans && pendingPlans.length > 0 && (
                  <div className="p-3 border-b border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Pending Approvals</span>
                      <Badge variant="secondary" className="text-xs">{pendingPlans.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {pendingPlans.map((plan) => (
                        <div 
                          key={plan.id} 
                          className="p-2 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <span className="font-medium text-sm text-foreground truncate">{plan.salesperson?.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatCurrency(Number(plan.target_revenue))}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(plan)}
                              disabled={isApproving}
                              className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => openRejectDialog(plan)}
                              disabled={isRejecting}
                              className="h-7 text-xs border-destructive text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Revise
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Submissions Section */}
                {missingSubmissions.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileX className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-foreground">Plan Not Submitted</span>
                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">{missingSubmissions.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {missingSubmissions.map((member) => (
                        <div 
                          key={member.id} 
                          className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-sm text-foreground">{member.name}</span>
                              <p className="text-xs text-muted-foreground">
                                {member.plan ? "Has draft plan - not submitted" : "No plan created yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Provide feedback for {selectedPlan?.salesperson?.name} about what needs to be revised:
            </p>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Enter your feedback..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={!rejectNotes.trim() || isRejecting}
              variant="destructive"
            >
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
