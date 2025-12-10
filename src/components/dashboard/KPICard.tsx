import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  glowColor?: "primary" | "accent" | "success" | "destructive";
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  glowColor = "primary",
  delay = 0,
}: KPICardProps) {
  const glowClasses = {
    primary: "glow-primary",
    accent: "glow-accent",
    success: "glow-success",
    destructive: "glow-destructive",
  };

  const iconBgClasses = {
    primary: "bg-primary/20 text-primary",
    accent: "bg-accent/20 text-accent",
    success: "bg-success/20 text-success",
    destructive: "bg-destructive/20 text-destructive",
  };

  return (
    <div
      className={cn(
        "kpi-card animate-fade-in hover:scale-[1.02] transition-transform duration-300",
        glowClasses[glowColor]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-sm font-semibold",
                  trend === "up" && "text-success",
                  trend === "down" && "text-destructive",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            iconBgClasses[glowColor]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
