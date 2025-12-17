import { useState } from "react";
import { Salesperson, SalesGoal } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Edit2, Save, Target, TrendingUp, User } from "lucide-react";
import { useSaveGoal } from "@/hooks/useSalesGoals";
import { toast } from "sonner";

interface TeamMemberGoalCardProps {
  member: Salesperson;
  goals: SalesGoal[];
  year: number;
  formatCurrency: (value: number) => string;
  onViewDetails?: (memberId: string) => void;
}

export function TeamMemberGoalCard({
  member,
  goals,
  year,
  formatCurrency,
  onViewDetails,
}: TeamMemberGoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetRevenue, setTargetRevenue] = useState(
    goals.find(g => g.goal_type === 'individual')?.target_revenue || 0
  );
  const [targetDeals, setTargetDeals] = useState(
    goals.find(g => g.goal_type === 'individual')?.target_deals || 0
  );

  const saveGoal = useSaveGoal();

  const individualGoal = goals.find(g => g.goal_type === 'individual');
  const currentTarget = individualGoal?.target_revenue || 0;
  const currentDeals = individualGoal?.target_deals || 0;

  // Mock progress - in a real app this would come from actual sales data
  const mockProgress = 0; // Would be calculated from actual sales commissions

  const handleSave = async () => {
    try {
      await saveGoal.mutateAsync({
        salesperson_id: member.id,
        year,
        target_revenue: targetRevenue,
        target_deals: targetDeals,
        goal_type: 'individual',
        notes: null,
      });
      setIsEditing(false);
      toast.success(`Goals updated for ${member.name}`);
    } catch (error) {
      toast.error("Failed to save goals");
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(currentTarget)}
              </p>
              <p className="text-xs text-muted-foreground">{currentDeals} deals target</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
        
        {currentTarget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted-foreground">
                {formatCurrency(mockProgress)} / {formatCurrency(currentTarget)}
              </span>
            </div>
            <Progress value={(mockProgress / currentTarget) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="border-t border-border/50 pt-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Target Revenue</label>
                <Input
                  type="number"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(Number(e.target.value))}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Target Deals</label>
                <Input
                  type="number"
                  value={targetDeals}
                  onChange={(e) => setTargetDeals(Number(e.target.value))}
                  className="bg-secondary/50"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saveGoal.isPending} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Target Revenue</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(currentTarget)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Target Deals</span>
                  </div>
                  <p className="text-lg font-bold">{currentDeals}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Goals
                </Button>
                {onViewDetails && (
                  <Button 
                    variant="secondary" 
                    onClick={() => onViewDetails(member.id)}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
