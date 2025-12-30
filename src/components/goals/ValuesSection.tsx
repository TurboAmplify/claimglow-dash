import { useState } from "react";
import { Heart, ChevronDown, Target, TrendingUp, Scale, Compass, Eye, Sparkles, Briefcase, Building2, Church, Home, Factory, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PURPOSE = "To help others by being a light through happiness and kindness—building trust through honesty.";

const STRATEGIC_PURPOSE = "Approach 2026 with clarity, organization, and disciplined execution. Maximize high-value opportunities across residential, commercial, industrial, and religious verticals. Build and strengthen relationships strategically. Finish 2026 strong while setting up 2027 for momentum.";

const STRATEGIC_PHILOSOPHY = [
  {
    title: "Clarity Over Activity",
    description: "Everything done must support high-value opportunities. Focus on actions that move the needle.",
  },
  {
    title: "Quality Over Quantity",
    description: "Fewer, stronger relationships outperform mass outreach. Be selective with claim intake.",
  },
  {
    title: "Consistency Wins",
    description: "Weekly actions, small or big, produce compounding results over time.",
  },
  {
    title: "Metrics Drive Decisions",
    description: "Every opportunity and meeting must be tracked. No guessing—all decisions from data.",
  },
  {
    title: "Seasonal Alignment",
    description: "Adjust intensity based on known seasonal loss patterns and market conditions.",
  },
];

const OPPORTUNITY_TARGETS = [
  {
    title: "Residential",
    icon: Home,
    value: "$350k–$500k",
    quarterlyTarget: "6–9",
    annualTarget: "24–36",
    contribution: "$10M–$15M",
    notes: "High-value total-loss or heavy-smoke homes; summer storms; high-income ZIP codes.",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  },
  {
    title: "Mid-Size Commercial",
    icon: Building2,
    value: "$1M–$1.5M",
    quarterlyTarget: "3",
    annualTarget: "12",
    contribution: "$2M–$4M",
    notes: "Schools, offices, restaurants, retail, multi-tenant properties.",
    color: "bg-green-500/10 border-green-500/30 text-green-600",
  },
  {
    title: "Large Commercial/Industrial",
    icon: Factory,
    value: "$750k–$10M",
    quarterlyTarget: "2–3",
    annualTarget: "8–12",
    contribution: "$20M–$30M",
    notes: "Manufacturing, warehouses, automotive, distribution, regional chains.",
    color: "bg-amber-500/10 border-amber-500/30 text-amber-600",
  },
  {
    title: "Religious Organizations",
    icon: Church,
    value: "$1M+",
    quarterlyTarget: "2–5",
    annualTarget: "8–20",
    contribution: "Variable",
    notes: "Large churches, temples, synagogues, mosques, ministries, retreat centers.",
    color: "bg-purple-500/10 border-purple-500/30 text-purple-600",
  },
];

const QUARTERLY_THEMES = [
  {
    quarter: "Q1",
    title: "Foundation & Pipeline Building",
    focus: [
      "Reconnect with top contractors, adjusters, and referral partners",
      "Review prior-year pipeline; identify early opportunities",
      "Schedule initial high-quality school meetings",
      "Identify strategic religious organizations ($1M+ potential)",
    ],
  },
  {
    quarter: "Q2",
    title: "Commercial Development",
    focus: [
      "Focus on mid-size and large commercial opportunities (1–2 per month)",
      "Engage actively with Life Styles Organization and Allen Chamber",
      "Initiate engagement with target school-industry organization and IIAD",
      "Pre-qualify pipeline for upcoming residential and seasonal losses",
    ],
  },
  {
    quarter: "Q3",
    title: "Seasonal Momentum",
    focus: [
      "Leverage summer residential opportunities (2–3 per month)",
      "Aggressively follow up on pending mid-size and large opportunities",
      "Attend all strategic church fires",
      "Mid-year pipeline review; adjust targets and priorities",
    ],
  },
  {
    quarter: "Q4",
    title: "Close Strong & Position 2027",
    focus: [
      "Prioritize closing: Residential 2–3/month, Mid-size 1/month, Large 1–2/month",
      "Intensify follow-ups with contractors, adjusters, schools, religious orgs",
      "Attend end-of-year strategic networking events",
      "Pre-plan and schedule high-potential Q1 2027 opportunities",
    ],
  },
];

const CORE_VALUES = [
  {
    title: "Honesty",
    description: "Once you lose your credibility, you never fully get it back. Truth is the foundation of every meaningful relationship.",
  },
  {
    title: "Integrity",
    description: "Doing the right thing even when no one is watching. Aligning actions with values, consistently and without compromise.",
  },
  {
    title: "Kindness",
    description: "This word covers every other descriptive word of goodness. It's the universal language that everyone understands.",
  },
  {
    title: "Joyfulness",
    description: "Bringing joy to every environment because life is too short. Choosing to radiate positivity and light.",
  },
  {
    title: "Helping Others",
    description: "Sharing my abilities to help better someone or their situation. Service to others is the rent we pay for our room on earth.",
  },
];

const STRENGTHS = [
  {
    title: "Tenacity",
    description: "Going after the goals I set with unwavering determination and persistence.",
  },
  {
    title: "Bringing People Together",
    description: "Creating connections and fostering collaboration among diverse individuals.",
  },
];

const GROWTH_AREAS = [
  {
    title: "Prioritizing Life",
    description: "Learning to balance competing demands and focus on what truly matters.",
  },
  {
    title: "Emotional Regulation",
    description: "Developing better strategies for managing frustration and staying composed.",
  },
  {
    title: "Handling Rejection",
    description: "Building resilience and not taking setbacks personally.",
  },
];

const DECISION_MAKING = [
  {
    title: "The Golden Rule",
    description: "I think about how I would want the situation handled if I were on the other side.",
  },
  {
    title: "Morals & Integrity",
    description: "Every decision is filtered through my core values—never compromising what's right for what's easy.",
  },
];

const FAITH_INTEGRITY = [
  {
    title: "Faith",
    description: "Faith hasn't always been at the forefront, but it has always been part of my identity—guiding how I treat others with grace and compassion.",
  },
  {
    title: "Integrity",
    description: "Like honesty and trust, once you lose integrity, you likely will never get it back to the same level. Guard it fiercely.",
  },
];

const VISION = "I want to look back in five years and say I achieved what I set forth—but also be amazed that I accomplished even more than I imagined. I want to grow my relationships with family and the people important to me. I need to put more focus on them and make sure I am fully present in each moment. Not somewhere else.";

const COMMITMENT = "To be present!";

export function ValuesSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "glass-card overflow-hidden transition-all duration-300 ease-out animate-fade-in",
        isExpanded ? "p-6" : "p-4"
      )}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Purpose & Values</h2>
            {!isExpanded && (
              <p className="text-sm text-muted-foreground">
                Click to explore guiding principles
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-out",
          isExpanded
            ? "mt-6 opacity-100 max-h-[1200px]"
            : "max-h-0 opacity-0 overflow-hidden mt-0"
        )}
      >
        {/* Purpose Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wide">Purpose</span>
          </div>
          <p className="text-foreground font-medium leading-relaxed">{PURPOSE}</p>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="strategy" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="strategy" className="text-xs sm:text-sm">Strategy</TabsTrigger>
            <TabsTrigger value="values" className="text-xs sm:text-sm">Values</TabsTrigger>
            <TabsTrigger value="character" className="text-xs sm:text-sm">Character</TabsTrigger>
            <TabsTrigger value="vision" className="text-xs sm:text-sm">Vision</TabsTrigger>
          </TabsList>

          {/* Strategy Tab - NEW */}
          <TabsContent value="strategy" className="mt-0 space-y-4">
            {/* Strategic Purpose */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">2026 Strategic Intent</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{STRATEGIC_PURPOSE}</p>
            </div>

            {/* Strategic Philosophy */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                Strategic Philosophy
              </h3>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {STRATEGIC_PHILOSOPHY.map((item, i) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-lg bg-secondary/30 border border-border/50 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary">#{i + 1}</span>
                      <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quarterly Themes */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Quarterly Themes
              </h3>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {QUARTERLY_THEMES.map((q) => (
                  <div
                    key={q.quarter}
                    className="p-4 rounded-lg bg-secondary/20 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold">{q.quarter}</span>
                      <h4 className="font-medium text-foreground text-sm">{q.title}</h4>
                    </div>
                    <ul className="space-y-1">
                      {q.focus.slice(0, 2).map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>


          {/* Values Tab */}
          <TabsContent value="values" className="mt-0">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {CORE_VALUES.map((value) => (
                <div
                  key={value.title}
                  className="p-4 rounded-lg bg-secondary/30 border border-border/50 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{value.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Character Tab */}
          <TabsContent value="character" className="mt-0 space-y-4">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-foreground">Strengths</h3>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {STRENGTHS.map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 transition-all duration-200 hover:bg-emerald-500/20"
                  >
                    <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Growth */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-foreground">Areas for Growth</h3>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                {GROWTH_AREAS.map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 transition-all duration-200 hover:bg-amber-500/20"
                  >
                    <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Philosophy */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-foreground">Decision Making</h3>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {DECISION_MAKING.map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 transition-all duration-200 hover:bg-blue-500/20"
                  >
                    <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent value="vision" className="mt-0 space-y-4">
            {/* Faith & Integrity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-foreground">Faith & Integrity</h3>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {FAITH_INTEGRITY.map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 transition-all duration-200 hover:bg-purple-500/20"
                  >
                    <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vision */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-foreground">Five-Year Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">{VISION}</p>
            </div>

            {/* Commitment */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/40 text-center">
              <h3 className="text-sm font-medium text-primary uppercase tracking-wide mb-2">My Commitment</h3>
              <p className="text-2xl font-bold text-foreground">{COMMITMENT}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}