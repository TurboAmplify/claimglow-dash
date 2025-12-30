import { useState } from "react";
import { 
  Target, 
  FileSearch, 
  Users, 
  Calendar, 
  Clock, 
  Award, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Briefcase,
  Heart,
  BarChart3,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicGrowthPlanDialog, TeamMemberPlanData } from "./DynamicGrowthPlanDialog";
export interface StrategicFocusArea {
  id: number;
  title: string;
  shortDescription: string;
  fullDescription: string;
  icon: React.ElementType;
  alignment: string[];
}

export const STRATEGIC_FOCUS_AREAS: StrategicFocusArea[] = [
  {
    id: 1,
    title: "Deal Quality Over Deal Quantity",
    shortDescription: "Prioritize higher-value commercial and multifamily claims",
    fullDescription: "Be selective with claim intake and move away from low-ceiling residential files. The goal is fewer files with higher outcomes and less friction.",
    icon: Target,
    alignment: ["high-value", "balanced", "commercial-heavy"]
  },
  {
    id: 2,
    title: "Front-End Policy Review as a Profit Lever",
    shortDescription: "Identify coverage opportunities before committing resources",
    fullDescription: "Conduct early policy reviews to identify ordinance & law, business interruption, extended replacement cost, and other coverage opportunities before committing heavy time resources.",
    icon: FileSearch,
    alignment: ["high-value", "balanced", "commercial-heavy"]
  },
  {
    id: 3,
    title: "Referral Channel Deepening",
    shortDescription: "Better referrals, not more referrals",
    fullDescription: "Strengthen relationships with restoration contractors, property managers, attorneys, and brokers who work on larger and more complex claims.",
    icon: Users,
    alignment: ["high-value", "balanced", "commercial-heavy"]
  },
  {
    id: 4,
    title: "Weekly Production Rhythm",
    shortDescription: "Approximately one deal per week",
    fullDescription: "Maintain a consistent pace of approximately one deal per week. Track monthly deal count, average claim size, and stalled files to stay on pace throughout the year.",
    icon: Calendar,
    alignment: ["balanced", "conservative"]
  },
  {
    id: 5,
    title: "Time Protection and File Management",
    shortDescription: "Limit low-value activities, standardize processes",
    fullDescription: "Protect time by limiting low-value activities and standardizing documentation, follow-ups, and escalation points. Focus energy on files with the highest ROI.",
    icon: Clock,
    alignment: ["high-value", "balanced", "conservative", "commercial-heavy"]
  },
  {
    id: 6,
    title: "Large-Loss Specialist Positioning",
    shortDescription: "Go-to adjuster for complex claims",
    fullDescription: "Position yourself as the go-to adjuster for complex and large-loss claims. Build credibility through confident communication, negotiation skill, and results.",
    icon: Award,
    alignment: ["high-value", "commercial-heavy"]
  },
  {
    id: 7,
    title: "Quarterly Review and Adjustment",
    shortDescription: "Review production metrics each quarter",
    fullDescription: "At the end of each quarter, review production metrics, income pacing, and bottlenecks. Adjust strategy, deal selection, and time allocation as needed.",
    icon: RefreshCw,
    alignment: ["high-value", "balanced", "conservative", "commercial-heavy"]
  }
];

export const KEY_PRINCIPLES = [
  {
    title: "Consistency",
    description: "Every week, every month, every quarter — same disciplined actions.",
    icon: Calendar,
  },
  {
    title: "Quality Over Quantity",
    description: "Be selective about meetings, organizations, and opportunities.",
    icon: Target,
  },
  {
    title: "Metrics Drive Everything",
    description: "No guessing. All decisions come from pipeline, priority, and performance data.",
    icon: BarChart3,
  },
  {
    title: "Seasonal Adjustment",
    description: "Push residential in summer, commercial year-round, religious whenever opportunities arise.",
    icon: Zap,
  },
  {
    title: "Professional Compassion",
    description: "Especially for religious organizations and fire scenes. Don't become numb to losses.",
    icon: Heart,
  },
];

export const GROWTH_FOCUS_AREAS = [
  "Strengthening relationships with contractors, adjusters, and referral partners",
  "Increasing visibility with commercial and industrial contacts",
  "Maintaining consistent follow-up and communication",
  "Staying disciplined with activity even during slow periods",
  "Being present and available when unexpected opportunities arise",
];

export const GUIDING_PRINCIPLE = "Fewer files. Bigger outcomes. Cleaner execution.";

interface StrategicFocusSectionProps {
  selectedScenarioId?: string;
  salespersonName?: string;
  salespersonId?: string;
  targetRevenue?: number;
  targetDeals?: number;
  avgFeePercent?: number;
  commissionPercent?: number;
  isTeamView?: boolean;
  teamMemberCount?: number;
  teamMemberPlans?: TeamMemberPlanData[];
}

export function StrategicFocusSection({ 
  selectedScenarioId,
  salespersonName = "Salesperson",
  salespersonId,
  targetRevenue = 10000000,
  targetDeals = 40,
  avgFeePercent = 7.5,
  commissionPercent = 20,
  isTeamView = false,
  teamMemberCount = 1,
  teamMemberPlans = [],
}: StrategicFocusSectionProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isAligned = (area: StrategicFocusArea) => {
    if (!selectedScenarioId) return false;
    return area.alignment.includes(selectedScenarioId);
  };

  return (
    <div className="space-y-6">
      {/* Growth Plan Dialog Button */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {isTeamView ? "Team" : salespersonName} 2026 Growth Plan
            </h3>
            <p className="text-sm text-muted-foreground">
              View the complete strategic plan with opportunity targets and quarterly themes
            </p>
          </div>
          <DynamicGrowthPlanDialog
            salespersonName={salespersonName}
            salespersonId={salespersonId}
            targetRevenue={targetRevenue}
            targetDeals={targetDeals}
            selectedScenarioId={selectedScenarioId || "balanced"}
            avgFeePercent={avgFeePercent}
            commissionPercent={commissionPercent}
            isTeamView={isTeamView}
            teamMemberCount={teamMemberCount}
            teamMemberPlans={teamMemberPlans}
          />
        </div>
      </div>

      {/* Guiding Principle Banner */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            2026 Guiding Principle
          </p>
          <blockquote className="text-2xl md:text-3xl font-bold text-foreground italic">
            "{GUIDING_PRINCIPLE}"
          </blockquote>
        </div>
      </div>

      {/* Key Principles */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Key Principles</h3>
            <p className="text-sm text-muted-foreground">Foundation for execution</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {KEY_PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className="p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-foreground text-sm">{principle.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{principle.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Growth Focus Areas */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">How I Plan to Pursue Growth in 2026</h3>
            <p className="text-sm text-muted-foreground">Key areas of focus for relationship and opportunity development</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {GROWTH_FOCUS_AREAS.map((area, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{area}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Focus Areas Grid */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">2026 Strategic Focus Areas</h3>
            <p className="text-sm text-muted-foreground">
              Public Insurance Adjuster – Execution Framework
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRATEGIC_FOCUS_AREAS.map((area) => {
            const Icon = area.icon;
            const aligned = isAligned(area);
            const expanded = expandedId === area.id;

            return (
              <button
                key={area.id}
                onClick={() => toggleExpand(area.id)}
                className={cn(
                  "relative text-left p-4 rounded-xl border-2 transition-all duration-300",
                  "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50",
                  expanded 
                    ? "border-primary bg-primary/10 shadow-md" 
                    : aligned
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 bg-secondary/20 hover:border-border"
                )}
              >
                {/* Aligned Badge */}
                {aligned && selectedScenarioId && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aligned</span>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    aligned ? "bg-primary/20" : "bg-secondary/30"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      aligned ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        #{area.id}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm leading-tight">
                      {area.title}
                    </h4>
                  </div>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>

                {/* Short Description */}
                <p className="text-sm text-muted-foreground mb-2">
                  {area.shortDescription}
                </p>

                {/* Expanded Content */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300",
                  expanded ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
                )}>
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm text-foreground">
                      {area.fullDescription}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Alignment Summary */}
      {selectedScenarioId && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Strategic Alignment with Your Selected Path
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Primary Focus Areas
              </h4>
              <ul className="space-y-2">
                {STRATEGIC_FOCUS_AREAS
                  .filter(area => area.alignment.includes(selectedScenarioId))
                  .map(area => (
                    <li key={area.id} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <area.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{area.title}</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">Key Takeaway</h4>
              <p className="text-sm text-muted-foreground">
                {selectedScenarioId === "commercial-heavy" && (
                  "Your Commercial & Industrial Heavy path aligns strongly with deal quality focus, large-loss positioning, and strategic referral development. Success requires patience and selective intake."
                )}
                {selectedScenarioId === "balanced" && (
                  "Your Balanced path benefits from all focus areas. Maintain weekly production rhythm while being selective about deal quality and leveraging key relationships."
                )}
                {selectedScenarioId === "conservative" && (
                  "Your Conservative path emphasizes consistent weekly rhythm, time protection, and process efficiency. Focus on standardization to handle steady deal flow."
                )}
                {!["commercial-heavy", "balanced", "conservative"].includes(selectedScenarioId) && (
                  "Your selected path aligns with key strategic focus areas. Maintain discipline and leverage relationships for optimal results."
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}