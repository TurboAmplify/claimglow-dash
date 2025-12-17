import { useState } from "react";
import { ChevronDown, Target, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";

interface GoalsSummaryProps {
  targetRevenue: number;
  formatCurrency: (value: number) => string;
}

const DEFAULT_GOALS = `Matt Aldrich — 2026 Sales & Growth Plan

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PURPOSE & STRATEGIC INTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Goals for 2026:
• Execute a consistent, disciplined, and measurable sales and outreach system
• Create sustained opportunity flow in residential, commercial, industrial, and religious verticals
• Expand influence across chambers, industry groups, schools, and professional organizations
• Build a regionally dominant pre-loss and relationship-driven referral pipeline
• Finish 2026 strong and enter 2027 with a fully primed opportunity engine

Strategic Philosophy:
1. Clarity over activity — Everything must support high-value opportunities
2. Quality over quantity — Fewer, stronger relationships outperform mass outreach
3. Consistency wins — Weekly actions produce compounding results
4. Seasonal alignment — Adjust intensity based on known seasonal loss patterns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. CORE OPPORTUNITY TARGETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Residential ($350k–$500k):
• Quarterly: 6–9 | Annual: 24–36
• Focus: High-value total-loss or heavy-smoke homes; summer storms; high-income ZIP codes

Mid-Size Commercial ($1M–$1.5M):
• Quarterly: 3 | Annual: 12
• Focus: Schools, mid-size offices, restaurants, retail centers, multi-tenant properties

Large Commercial/Industrial ($750k–$10M):
• Quarterly: 2–3 | Annual: 8–12
• Focus: Manufacturing, warehouses, automotive, distribution centers, regional chains

Religious >$1M:
• Quarterly: 2–5 | Annual: 8–20
• Focus: Large churches, temples, mosques, synagogues, ministries, retreat centers

Total Annual Goal: $45M–$60M combined opportunities

Pipeline Expectations:
• Active Pipeline: $8M–$12M minimum at any time
• Quarterly New Pipeline: $10M–$15M
• Quarterly Closed: $4M–$7M

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. QUARTERLY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q1 — Foundation & Pipeline Activation:
• Build starting pipeline through early-year outreach
• Identify all in-state religious targets with $1M+ potential
• Begin school district outreach (1 large + 1 small per month)
• Attend all qualifying early-year church fires
• Refresh CRM categories and follow-up cadence

Q2 — Commercial Focus & Relationship Deepening:
• Target 1–2 mid-size or large commercial opportunities/month
• Strengthen relationships through Life Styles & Allen Chamber
• Join Independent Insurance Adjusters of Dallas
• Start outreach to neighboring states for regional influence
• Secure 2–4 major school meetings

Q3 — Seasonal Peak & Expansion:
• Target 2–3 high-value residential losses/month
• Increase follow-up cadence on all commercial/industrial pipeline
• Attend all summer church fires; prioritize high-value ministry properties
• Mid-year pipeline audit and tactical reset
• Complete regional religious organization database

Q4 — Close Strong & Position 2027:
• Push to close opportunities aggressively
• Re-engage school districts with winter-break timing
• Solidify contractor/adjuster partnerships before year-end
• Attend all late-year networking and industry events
• Pre-book Q1 2027 meetings and identify top 10 targets

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. MONTHLY EXPECTATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opportunity Generation:
• Residential: 2–3 new qualified leads
• Commercial: 1–2 solid opportunities
• Industrial: 1 potential large-loss contact
• Religious: 2–4 researched targets + 1–2 meetings/calls

Networking & Relationships:
• Life Styles Organization: 2 meaningful connections
• Allen Chamber: 2–3 high-value meetings
• IIAD or target org: 1 event/activity
• Schools: 2 district touches (meeting, email, call)
• Contractor/adjuster partners: 4–6 touches

Fire Response:
• Chase 100% of target-aligned church fires
• Chase select high-value commercial fires
• Chase residential fires with higher value (case-by-case)
• Add minimum 10 new contacts monthly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. WEEKLY CADENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prospecting & Outreach:
• 15–20 outreach actions (calls, emails, texts, messages)
• 3–5 meetings (in-person or virtual)
• 3 follow-up sequences
• 1–2 pre-loss walkthroughs or site visits

Relationship Maintenance:
• 2 contractor touches
• 1 agent touch
• 1 school district follow-up
• 1 religious organization outreach sequence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. NETWORKING STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Life Styles Organization:
• Attend starting March
• Goal: Build 12–18 high-value contacts annually
• Monthly: 2–3 meaningful follow-ups

Allen Chamber:
• Attend monthly breakfasts/luncheons
• Form 1 deeper relationship per month
• Map out top 25 commercial members by Q2

Schools:
• Monthly: 1 large + 1 small district meeting attempt
• Track: Superintendent, facilities manager, maintenance director, risk manager
• Offer: Pre-loss planning, emergency binder, contractor neutrality

IIAD (Independent Insurance Agents of Dallas):
• Attend events as available
• Build top 10 agency list
• Aim for 3–5 agency referrals by Q4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. RELIGIOUS ORGANIZATION STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target Types:
• Large Baptist, Methodist, Catholic, Pentecostal, nondenominational churches
• Temples, Synagogues, Mosques
• Retreat centers & ministries with multi-building campuses
• Faith-based schools

Priority Scoring:
• High: Multi-site, historic, large campuses, ministries with schools
• Medium: Single-site, mid-size facilities, newer builds
• Low: Small congregations unlikely to reach $1M+ valuation

Outreach Process:
1. Add to CRM with full research fields
2. Establish soft intro (email or call)
3. Schedule meeting with pastor, board, or facilities manager
4. Provide pre-loss planning
5. Offer emergency response guidance
6. Maintain quarterly follow-up

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. KEY PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Consistency: Every week, every month, every quarter — same disciplined actions
• Quality Over Quantity: Be selective about meetings, organizations, and opportunities
• Metrics Drive Everything: No guessing. All decisions from pipeline, priority, and performance data
• Professional Compassion: Don't become hardened from responses and numb to their loss`;

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
            <h2 className="text-lg font-semibold text-foreground">2026 Sales & Growth Plan</h2>
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
