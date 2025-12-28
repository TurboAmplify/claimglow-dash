import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalesPlan } from "@/hooks/useSalesPlan";
import { usePlanApproval } from "@/hooks/usePlanApproval";
import { Send, Clock, CheckCircle2, XCircle, FileEdit, Target, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface PlanSubmissionSectionProps {
  plan: SalesPlan | null;
  salespersonId: string;
  directorId: string;
  formatCurrency: (value: number) => string;
  onCreatePlan: () => void;
}

export function PlanSubmissionSection({
  plan,
  salespersonId,
  directorId,
  formatCurrency,
  onCreatePlan,
}: PlanSubmissionSectionProps) {
  const { submitForApproval, isSubmitting } = usePlanApproval();

  if (!plan) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Plan Created Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your annual sales plan to set your targets and choose your path to success.
          </p>
          <Button onClick={onCreatePlan}>
            <FileEdit className="w-4 h-4 mr-2" />
            Create Your Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (plan.approval_status) {
      case "draft":
        return <Badge variant="secondary"><FileEdit className="w-3 h-3 mr-1" />Draft</Badge>;
      case "pending_approval":
        return <Badge variant="outline" className="border-amber-500 text-amber-500"><Clock className="w-3 h-3 mr-1" />Pending Approval</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Revision Requested</Badge>;
      default:
        return <Badge variant="secondary">{plan.approval_status}</Badge>;
    }
  };

  const handleSubmit = () => {
    if (!plan.id) return;
    submitForApproval({
      planId: plan.id,
      senderId: salespersonId,
      directorId: directorId,
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Your {plan.year} Sales Plan</CardTitle>
        {getStatusBadge()}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="w-4 h-4" />
              Target Revenue
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(Number(plan.target_revenue))}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Target Commission
            </div>
            <p className="text-xl font-bold text-emerald-500">{formatCurrency(Number(plan.target_commission))}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-muted-foreground text-sm mb-1">Avg Fee %</p>
            <p className="text-xl font-bold text-foreground">{plan.avg_fee_percent}%</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-muted-foreground text-sm mb-1">Selected Path</p>
            <p className="text-xl font-bold text-foreground capitalize">{plan.selected_scenario}</p>
          </div>
        </div>

        {/* Reviewer Notes */}
        {plan.reviewer_notes && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm font-medium text-amber-500 mb-1">Director Feedback:</p>
            <p className="text-sm text-foreground">{plan.reviewer_notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {plan.submitted_at && (
            <span>Submitted: {format(new Date(plan.submitted_at), "MMM d, yyyy 'at' h:mm a")}</span>
          )}
          {plan.approved_at && (
            <span>Approved: {format(new Date(plan.approved_at), "MMM d, yyyy 'at' h:mm a")}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCreatePlan}>
            <FileEdit className="w-4 h-4 mr-2" />
            Edit Plan
          </Button>
          
          {(plan.approval_status === "draft" || plan.approval_status === "rejected") && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
