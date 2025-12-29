import { useState } from "react";
import { Heart, ChevronDown, Target, TrendingUp, Scale, Compass, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PURPOSE = "To help others by being a light through happiness and kindness—building trust through honesty.";

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
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Purpose & Values</h2>
            {!isExpanded && (
              <p className="text-sm text-muted-foreground">
                Hover to explore guiding principles
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
            ? "mt-6 opacity-100 max-h-[800px]"
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
        <Tabs defaultValue="values" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="values" className="text-xs sm:text-sm">Values</TabsTrigger>
            <TabsTrigger value="character" className="text-xs sm:text-sm">Character</TabsTrigger>
            <TabsTrigger value="philosophy" className="text-xs sm:text-sm">Philosophy</TabsTrigger>
            <TabsTrigger value="vision" className="text-xs sm:text-sm">Vision</TabsTrigger>
          </TabsList>

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
          </TabsContent>

          {/* Philosophy Tab */}
          <TabsContent value="philosophy" className="mt-0 space-y-4">
            {/* Decision Making */}
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
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent value="vision" className="mt-0 space-y-4">
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
