import { Sidebar } from "./Sidebar";
import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { GlobalAlertsIndicator } from "./GlobalAlertsIndicator";
import { ViewAsBanner } from "./ViewAsBanner";
import { useViewAs } from "@/contexts/ViewAsContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const { isViewingAsOther } = useViewAs();

  return (
    <div className="flex min-h-screen w-full bg-background relative">
      {/* View As Banner */}
      <ViewAsBanner />
      
      {/* Theme-specific backgrounds */}
      {theme === 'neon-hex' && <div className="hex-background" />}
      {theme === 'amber-glow' && <div className="amber-background" />}
      {theme === 'liquid-chrome' && <div className="chrome-background" />}
      {theme === 'violet-dew' && <div className="violet-background" />}
      {theme === 'ocean-depth' && <div className="ocean-background" />}
      
      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden fixed left-0 right-0 z-50 glass-sidebar border-b border-sidebar-border/30 px-4 py-3 flex items-center justify-between",
        isViewingAsOther ? "top-8" : "top-0"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-sm font-bold">DM</span>
          </div>
          <span className="font-semibold text-foreground">DealMetrics</span>
        </div>
        <div className="flex items-center gap-1">
          <GlobalAlertsIndicator />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless menu is open */}
      <div
        className={cn(
          "fixed lg:relative z-40 lg:z-auto transition-transform duration-300 ease-in-out lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isViewingAsOther && "lg:pt-8"
        )}
      >
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-x-hidden overflow-y-auto relative z-10 h-screen",
        isViewingAsOther ? "pt-[calc(3.5rem+2rem)] lg:pt-8" : "pt-14 lg:pt-0"
      )}>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
