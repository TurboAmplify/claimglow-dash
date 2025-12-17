import { Salesperson, SalesGoal } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Users, TrendingUp, DollarSign } from "lucide-react";

interface TeamAggregateViewProps {
  teamMembers: Salesperson[];
  teamGoals: SalesGoal[];
  year: number;
  formatCurrency: (value: number) => string;
}

export function TeamAggregateView({
  teamMembers,
  teamGoals,
  year,
  formatCurrency,
}: TeamAggregateViewProps) {
  // Calculate aggregate totals
  const totalTargetRevenue = teamGoals
    .filter(g => g.goal_type === 'individual')
    .reduce((sum, g) => sum + (g.target_revenue || 0), 0);
  
  const totalTargetDeals = teamGoals
    .filter(g => g.goal_type === 'individual')
    .reduce((sum, g) => sum + (g.target_deals || 0), 0);

  const membersWithGoals = teamMembers.filter(m => 
    teamGoals.some(g => g.salesperson_id === m.id && g.goal_type === 'individual' && g.target_revenue > 0)
  );

  // Mock actual progress - in a real app this would come from sales data
  const mockTotalProgress = 0;

  const avgTargetPerMember = membersWithGoals.length > 0 
    ? totalTargetRevenue / membersWithGoals.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Team Members</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {membersWithGoals.length} with goals set
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Team Target</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalTargetRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{year} Combined Target</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total Deals Target</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalTargetDeals}</p>
            <p className="text-xs text-muted-foreground mt-1">Combined deal count</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <DollarSign className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm text-muted-foreground">Avg per Member</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(avgTargetPerMember)}</p>
            <p className="text-xs text-muted-foreground mt-1">Average target</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Team Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">
                  {formatCurrency(mockTotalProgress)} / {formatCurrency(totalTargetRevenue)}
                </span>
              </div>
              <Progress 
                value={totalTargetRevenue > 0 ? (mockTotalProgress / totalTargetRevenue) * 100 : 0} 
                className="h-3" 
              />
            </div>

            {/* Individual Member Progress */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Individual Breakdown</h4>
              {teamMembers.map((member) => {
                const memberGoal = teamGoals.find(
                  g => g.salesperson_id === member.id && g.goal_type === 'individual'
                );
                const target = memberGoal?.target_revenue || 0;
                const mockMemberProgress = 0; // Would be actual progress
                
                return (
                  <div key={member.id} className="flex items-center gap-4">
                    <span className="text-sm w-32 truncate">{member.name}</span>
                    <div className="flex-1">
                      <Progress 
                        value={target > 0 ? (mockMemberProgress / target) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-24 text-right">
                      {formatCurrency(target)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Without Goals Warning */}
      {teamMembers.length > membersWithGoals.length && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Target className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {teamMembers.length - membersWithGoals.length} team member(s) without goals
                </p>
                <p className="text-xs text-muted-foreground">
                  Set individual goals for all team members to see complete team projections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
