import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranchPlus, Plus, Calendar, DollarSign, ArrowRight, Trash2 } from "lucide-react";

import { format, parseISO, isThisWeek, isThisMonth, addMonths, isBefore, isAfter } from "date-fns";
import { PipelineDeal, useDealPipeline } from "@/hooks/useDealPipeline";
import { AddPipelineDealDialog } from "./AddPipelineDealDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DealPipelineProps {
  salespersonId: string;
  formatCurrency: (value: number) => string;
}

const STAGE_COLORS: Record<string, string> = {
  prospect: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  qualified: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  proposal: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  negotiation: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  closing: "bg-green-500/10 text-green-500 border-green-500/20",
};

const STAGE_LABELS: Record<string, string> = {
  prospect: "Prospect",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closing: "Closing",
};

export function DealPipeline({ salespersonId, formatCurrency }: DealPipelineProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [convertDeal, setConvertDeal] = useState<PipelineDeal | null>(null);
  const [deleteDeal, setDeleteDeal] = useState<PipelineDeal | null>(null);

  const {
    deals,
    isLoading,
    addDeal,
    deleteDeal: removeDeal,
    convertToCommission,
    isAdding,
    isConverting,
    isDeleting,
  } = useDealPipeline(salespersonId);

  const groupedDeals = useMemo(() => {
    const today = new Date();
    const nextMonth = addMonths(today, 1);

    const groups: Record<string, PipelineDeal[]> = {
      thisWeek: [],
      thisMonth: [],
      nextMonth: [],
      later: [],
    };

    deals.forEach((deal) => {
      const closeDate = parseISO(deal.expected_close_date);
      
      if (isThisWeek(closeDate, { weekStartsOn: 1 })) {
        groups.thisWeek.push(deal);
      } else if (isThisMonth(closeDate)) {
        groups.thisMonth.push(deal);
      } else if (closeDate.getMonth() === nextMonth.getMonth() && closeDate.getFullYear() === nextMonth.getFullYear()) {
        groups.nextMonth.push(deal);
      } else {
        groups.later.push(deal);
      }
    });

    return groups;
  }, [deals]);

  const pipelineStats = useMemo(() => {
    const weightedValue = deals.reduce((sum, deal) => {
      return sum + (deal.expected_value * (deal.probability / 100));
    }, 0);

    const totalValue = deals.reduce((sum, deal) => sum + deal.expected_value, 0);

    return {
      totalDeals: deals.length,
      totalValue,
      weightedValue,
    };
  }, [deals]);

  const handleConvert = () => {
    if (convertDeal) {
      convertToCommission(convertDeal);
      setConvertDeal(null);
    }
  };

  const handleDelete = () => {
    if (deleteDeal) {
      removeDeal(deleteDeal.id);
      setDeleteDeal(null);
    }
  };

  const DealCard = ({ deal }: { deal: PipelineDeal }) => (
    <div className="p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{deal.client_name}</p>
          <p className="text-lg font-bold">{formatCurrency(deal.expected_value)}</p>
        </div>
        <Badge className={STAGE_COLORS[deal.stage] || STAGE_COLORS.prospect}>
          {STAGE_LABELS[deal.stage] || deal.stage}
        </Badge>
      </div>
      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(parseISO(deal.expected_close_date), "MMM d")}
        </span>
        <span>{deal.probability}% likely</span>
      </div>
      {deal.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{deal.notes}</p>
      )}
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => setConvertDeal(deal)}
        >
          <ArrowRight className="h-3 w-3 mr-1" />
          Mark Closed
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteDeal(deal)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const DealGroup = ({ title, deals, icon }: { title: string; deals: PipelineDeal[]; icon?: string }) => {
    if (deals.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title} ({deals.length})
        </h4>
        <div className="grid gap-2">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading pipeline...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranchPlus className="h-5 w-5" />
              Deal Pipeline
            </CardTitle>
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Deal
            </Button>
          </div>
          {deals.length > 0 && (
            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Weighted: {formatCurrency(pipelineStats.weightedValue)}
              </span>
              <span>|</span>
              <span>{pipelineStats.totalDeals} active deals</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranchPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No deals in pipeline</p>
              <p className="text-sm">Add deals to track upcoming opportunities</p>
            </div>
          ) : (
            <div className="space-y-6">
              <DealGroup title="Closing This Week" deals={groupedDeals.thisWeek} icon="🔥" />
              <DealGroup title="This Month" deals={groupedDeals.thisMonth} icon="📅" />
              <DealGroup title="Next Month" deals={groupedDeals.nextMonth} icon="📆" />
              <DealGroup title="Later" deals={groupedDeals.later} icon="🗓️" />
            </div>
          )}
        </CardContent>
      </Card>

      <AddPipelineDealDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={addDeal}
        salespersonId={salespersonId}
        isSubmitting={isAdding}
      />

      <AlertDialog open={!!convertDeal} onOpenChange={() => setConvertDeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Deal as Closed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will convert "{convertDeal?.client_name}" to a commission record and remove it from your pipeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} disabled={isConverting}>
              {isConverting ? "Converting..." : "Mark Closed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDeal} onOpenChange={() => setDeleteDeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Pipeline?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteDeal?.client_name}" from your pipeline. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
