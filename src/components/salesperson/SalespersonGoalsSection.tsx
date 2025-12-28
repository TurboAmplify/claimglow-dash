import { useState } from "react";
import { useSalesGoals, useSaveGoal } from "@/hooks/useSalesGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Edit2, Save, X, TrendingUp, FileText, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

interface SalespersonGoalsSectionProps {
  salespersonId: string;
  salespersonName: string;
  currentStats: {
    totalDeals: number;
    totalVolume: number;
    totalRevisedVolume: number;
    totalCommissions: number;
    totalInsuranceChecks: number;
    totalNewRemainder: number;
    avgDealSize: number;
    commissionYield: number;
  } | null;
}

export function SalespersonGoalsSection({ 
  salespersonId, 
  salespersonName,
  currentStats 
}: SalespersonGoalsSectionProps) {
  const currentYear = 2026; // Planning year for 2026 goals
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isEditing, setIsEditing] = useState(false);
  const [targetRevenue, setTargetRevenue] = useState("");
  const [targetDeals, setTargetDeals] = useState("");
  const [notes, setNotes] = useState("");

  const { data: goals, isLoading } = useSalesGoals(salespersonId, selectedYear);
  const saveGoal = useSaveGoal();

  const currentGoal = goals?.[0];

  const handleEdit = () => {
    setTargetRevenue(currentGoal?.target_revenue?.toString() || "");
    setTargetDeals(currentGoal?.target_deals?.toString() || "");
    setNotes(currentGoal?.notes || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTargetRevenue("");
    setTargetDeals("");
    setNotes("");
  };

  const handleSave = async () => {
    try {
      await saveGoal.mutateAsync({
        salesperson_id: salespersonId,
        year: selectedYear,
        target_revenue: targetRevenue ? parseFloat(targetRevenue) : null,
        target_deals: targetDeals ? parseInt(targetDeals) : null,
        goal_type: "individual",
        notes: notes || null,
      });
      toast({
        title: "Goal saved",
        description: `${selectedYear} goal has been updated successfully.`,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error saving goal",
        description: "Failed to save the goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const revenueProgress = currentGoal?.target_revenue && currentStats
    ? Math.min((currentStats.totalRevisedVolume / currentGoal.target_revenue) * 100, 100)
    : 0;
  const dealsProgress = currentGoal?.target_deals && currentStats
    ? Math.min((currentStats.totalDeals / currentGoal.target_deals) * 100, 100)
    : 0;

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Sales Goals
          </h3>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading goals...</p>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetRevenue">Target Revenue ($)</Label>
                <Input
                  id="targetRevenue"
                  type="number"
                  placeholder="e.g. 5000000"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="targetDeals">Target Deals</Label>
                <Input
                  id="targetDeals"
                  type="number"
                  placeholder="e.g. 50"
                  value={targetDeals}
                  onChange={(e) => setTargetDeals(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this goal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saveGoal.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveGoal.isPending ? "Saving..." : "Save Goal"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : currentGoal ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Goal for {salespersonName}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {currentGoal.target_revenue ? formatCurrency(currentGoal.target_revenue) : "No revenue target"}
                </p>
                {currentGoal.target_deals && (
                  <p className="text-sm text-muted-foreground">{currentGoal.target_deals} deals</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
            {currentGoal.notes && (
              <p className="text-sm text-muted-foreground bg-secondary/30 p-3 rounded-lg">
                {currentGoal.notes}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No goal set for {selectedYear}</p>
            <Button onClick={() => setIsEditing(true)}>
              <Target className="w-4 h-4 mr-2" />
              Set Goal
            </Button>
          </div>
        )}
      </div>

      {/* Progress Tracking (only for current year with a goal) */}
      {selectedYear === currentYear && currentGoal && currentStats && (
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-6">Progress Tracking</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentGoal.target_revenue && currentGoal.target_revenue > 0 && (
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Revenue Progress</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(currentStats.totalRevisedVolume)}
                    </span>
                  </div>
                  <Progress value={revenueProgress} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {revenueProgress.toFixed(1)}% of {formatCurrency(currentGoal.target_revenue)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(Math.max(0, currentGoal.target_revenue - currentStats.totalRevisedVolume))} remaining
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentGoal.target_deals && currentGoal.target_deals > 0 && (
              <div className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">Deals Progress</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current</span>
                    <span className="font-medium text-foreground">{currentStats.totalDeals} deals</span>
                  </div>
                  <Progress value={dealsProgress} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {dealsProgress.toFixed(1)}% of {currentGoal.target_deals} deals
                    </span>
                    <span className="text-muted-foreground">
                      {Math.max(0, currentGoal.target_deals - currentStats.totalDeals)} remaining
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Commission Summary */}
          <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Commission Summary</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(currentStats.totalCommissions)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Checks Received</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(currentStats.totalInsuranceChecks)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(currentStats.totalNewRemainder)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Yield</p>
                <p className="text-lg font-bold text-foreground">{currentStats.commissionYield.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
