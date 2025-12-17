import { useState } from "react";
import { ChevronDown, Target, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";

interface GoalsSummaryProps {
  targetRevenue: number;
  formatCurrency: (value: number) => string;
}

const DEFAULT_GOALS = `2026 Annual Objectives

Revenue Target: $55,000,000 in pursued opportunities

Key Milestones:
• Q1: Establish pipeline foundation - $10M+ in qualified opportunities
• Q2: Accelerate large commercial pursuits - cumulative $25M
• Q3: Peak activity period - cumulative $40M
• Q4: Conversion focus & 2027 positioning - reach $55M

Strategic Priorities:
• Focus on large commercial/industrial opportunities ($5M+)
• Maintain steady flow of residential losses for base volume
• Build pre-loss relationships for future opportunities
• Target 2-3 large deals per quarter minimum

Success Metrics:
• Average deal size: $1.5M+ (vs historical $1.1M)
• Deal count: 35-45 total deals
• Close rate: Maintain 40%+ conversion on qualified opportunities`;

export function GoalsSummary({ targetRevenue, formatCurrency }: GoalsSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [goals, setGoals] = useState(DEFAULT_GOALS);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="glass-card animate-fade-in">
      <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-secondary/10 transition-colors rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground">2026 Goals & Objectives</h2>
            <p className="text-sm text-muted-foreground">
              Annual target: {formatCurrency(targetRevenue)}
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-6 pb-6">
        <div className="border-t border-border pt-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Target</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(targetRevenue)}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">Per Quarter</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(targetRevenue / 4)}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Per Month</span>
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(targetRevenue / 12)}</p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <span className="text-xs text-muted-foreground">Year</span>
              </div>
              <p className="text-lg font-bold text-foreground">2026</p>
            </div>
          </div>

          {/* Editable Goals */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Written Goals & Notes</label>
            <Textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="min-h-[300px] bg-background/50 font-mono text-sm"
              placeholder="Write your goals, milestones, and strategic priorities..."
            />
            <p className="text-xs text-muted-foreground">
              Edit your goals and notes here. Changes are saved locally.
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
