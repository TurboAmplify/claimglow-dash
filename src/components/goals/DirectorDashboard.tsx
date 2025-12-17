import { Salesperson, SalesGoal, YearSummary } from "@/types/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Users, TrendingUp, Crown, BarChart3, DollarSign } from "lucide-react";
import { DealMixScenario } from "@/hooks/useGoalScenarios";

interface DirectorDashboardProps {
  director: Salesperson;
  teamMembers: Salesperson[];
  directorGoals: SalesGoal[];
  teamGoals: SalesGoal[];
  activeScenario: DealMixScenario;
  yearSummaries: YearSummary[] | null;
  year: number;
  targetRevenue: number;
  formatCurrency: (value: number) => string;
}

export function DirectorDashboard({
  director,
  teamMembers,
  directorGoals,
  teamGoals,
  activeScenario,
  yearSummaries,
  year,
  targetRevenue,
  formatCurrency,
}: DirectorDashboardProps) {
  // Director's personal goal
  const personalGoal = directorGoals.find(g => g.goal_type === 'individual');
  const personalTarget = personalGoal?.target_revenue || targetRevenue;

  // Team aggregate
  const teamTotalTarget = teamGoals
    .filter(g => g.goal_type === 'individual')
    .reduce((sum, g) => sum + (g.target_revenue || 0), 0);

  // Combined managed volume
  const totalManagedVolume = personalTarget + teamTotalTarget;

  // Mock progress values
  const personalProgress = 0;
  const teamProgress = 0;

  // Historical stats for context
  const historicalAvg = yearSummaries && yearSummaries.length > 0
    ? yearSummaries.reduce((sum, y) => sum + y.totalRevisedEstimate, 0) / yearSummaries.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Director Header */}
      <Card className="glass-card border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{director.name}</h2>
              <p className="text-muted-foreground">Sales Director Dashboard</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalManagedVolume)}</p>
              <p className="text-sm text-muted-foreground">Total Managed Volume</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Personal Target</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(personalTarget)}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span>{((personalProgress / personalTarget) * 100).toFixed(0)}%</span>
              </div>
              <Progress value={(personalProgress / personalTarget) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Team Target</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(teamTotalTarget)}</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span>{teamTotalTarget > 0 ? ((teamProgress / teamTotalTarget) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress 
                value={teamTotalTarget > 0 ? (teamProgress / teamTotalTarget) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
              </div>
              <span className="text-sm text-muted-foreground">Combined Progress</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(personalProgress + teamProgress)}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">of {formatCurrency(totalManagedVolume)}</span>
                <span>{totalManagedVolume > 0 ? (((personalProgress + teamProgress) / totalManagedVolume) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress 
                value={totalManagedVolume > 0 ? ((personalProgress + teamProgress) / totalManagedVolume) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Goals Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Personal Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Active Scenario</span>
                <span className="text-sm font-medium text-primary">{activeScenario.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projected Volume</span>
                <span className="text-lg font-bold">{formatCurrency(activeScenario.totalVolume)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-muted-foreground">Projected Deals</span>
                <span className="text-lg font-bold">{activeScenario.totalDeals}</span>
              </div>
            </div>

            {historicalAvg > 0 && (
              <div className="p-4 rounded-lg bg-secondary/30">
                <span className="text-sm text-muted-foreground">Historical Avg (Annual)</span>
                <p className="text-lg font-bold mt-1">{formatCurrency(historicalAvg)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Contribution Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Team Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No team members yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add team members to see their contribution to your goals.
                </p>
              </div>
            ) : (
              teamMembers.map((member) => {
                const memberGoal = teamGoals.find(
                  g => g.salesperson_id === member.id && g.goal_type === 'individual'
                );
                const target = memberGoal?.target_revenue || 0;
                const mockProgress = 0;
                
                return (
                  <div key={member.id} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-sm font-bold">{formatCurrency(target)}</span>
                    </div>
                    <Progress 
                      value={target > 0 ? (mockProgress / target) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                );
              })
            )}

            {teamMembers.length > 0 && (
              <div className="pt-3 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Team Total</span>
                  <span className="text-lg font-bold text-emerald-500">
                    {formatCurrency(teamTotalTarget)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="glass-card bg-gradient-to-r from-primary/5 to-emerald-500/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(personalTarget)}</p>
              <p className="text-sm text-muted-foreground">Your Target</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-3xl font-bold text-muted-foreground">+</span>
            </div>
            <div>
              <Users className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(teamTotalTarget)}</p>
              <p className="text-sm text-muted-foreground">Team Target</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-3xl font-bold text-foreground">{formatCurrency(totalManagedVolume)}</p>
            <p className="text-muted-foreground">Total Managed Revenue Target for {year}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
