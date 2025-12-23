import { useState } from "react";
import { Heart, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const VALUES = [
  {
    title: "Integrity",
    description: "We do the right thing, even when no one is watching. Honesty and transparency guide every interaction.",
  },
  {
    title: "Excellence",
    description: "We pursue the highest standards in everything we do, continuously improving our skills and service.",
  },
  {
    title: "Client Focus",
    description: "Our clients' success is our success. We listen, understand, and deliver solutions that exceed expectations.",
  },
  {
    title: "Teamwork",
    description: "We support and elevate each other, knowing that together we achieve more than we ever could alone.",
  },
  {
    title: "Accountability",
    description: "We own our commitments, take responsibility for our actions, and deliver on our promises.",
  },
  {
    title: "Growth Mindset",
    description: "We embrace challenges, learn from setbacks, and see every day as an opportunity to get better.",
  },
];

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
            <h2 className="text-lg font-semibold text-foreground">Our Values</h2>
            {!isExpanded && (
              <p className="text-sm text-muted-foreground">
                Hover to see guiding principles
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
          "grid gap-4 transition-all duration-300 ease-out",
          isExpanded
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6 opacity-100 max-h-[500px]"
            : "max-h-0 opacity-0 overflow-hidden mt-0"
        )}
      >
        {VALUES.map((value, index) => (
          <div
            key={value.title}
            className="p-4 rounded-lg bg-secondary/30 border border-border/50 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/30"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {value.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
