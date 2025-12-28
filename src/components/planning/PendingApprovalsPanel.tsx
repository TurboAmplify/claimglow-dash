import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePendingApprovals } from "@/hooks/useNotifications";
import { usePlanApproval } from "@/hooks/usePlanApproval";
import { Bell, CheckCircle2, XCircle, User, Target, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface PendingApprovalsPanelProps {
  directorId: string;
  formatCurrency: (value: number) => string;
}

export function PendingApprovalsPanel({ directorId, formatCurrency }: PendingApprovalsPanelProps) {
  const { pendingPlans, isLoading } = usePendingApprovals();
  const { approvePlan, rejectPlan, isApproving, isRejecting } = usePlanApproval();
  
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  if (isLoading) {
    return null;
  }

  if (!pendingPlans || pendingPlans.length === 0) {
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
      <Card className="glass-card border-amber-500/30 animate-fade-in">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Pending Plan Approvals</CardTitle>
            <p className="text-sm text-muted-foreground">{pendingPlans.length} plan(s) waiting for your review</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingPlans.map((plan) => (
            <div 
              key={plan.id} 
              className="p-4 rounded-xl bg-secondary/30 border border-border/50"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{plan.salesperson?.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Submitted {plan.submitted_at ? format(new Date(plan.submitted_at), "MMM d 'at' h:mm a") : "recently"}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-500 text-amber-500">
                  {plan.year} Plan
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                    <Target className="w-3 h-3" />
                    Target Revenue
                  </div>
                  <p className="font-bold text-foreground">{formatCurrency(Number(plan.target_revenue))}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                    <TrendingUp className="w-3 h-3" />
                    Target Commission
                  </div>
                  <p className="font-bold text-emerald-500">{formatCurrency(Number(plan.target_commission))}</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-muted-foreground text-xs mb-1">Avg Fee %</p>
                  <p className="font-bold text-foreground">{plan.avg_fee_percent}%</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-muted-foreground text-xs mb-1">Selected Path</p>
                  <p className="font-bold text-foreground capitalize">{plan.selected_scenario}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  onClick={() => handleApprove(plan)}
                  disabled={isApproving}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => openRejectDialog(plan)}
                  disabled={isRejecting}
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Request Revision
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
