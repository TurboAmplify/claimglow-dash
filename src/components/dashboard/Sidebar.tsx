import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  DollarSign,
  Target,
  Upload,
  Map,
  Home,
  LogOut,
  PlusCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { useViewAs } from "@/contexts/ViewAsContext";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { GlobalAlertsIndicator } from "./GlobalAlertsIndicator";

const mainNavItems = [
  { title: "Home", url: "/", icon: Home },
];

const claimsNavItems = [
  { title: "Add/Update Claim", url: "/add-claim", icon: PlusCircle },
];

const adjustingNavItems = [
  { title: "Adjusters Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "By Adjuster", url: "/adjusters", icon: Users },
  { title: "By Office", url: "/offices", icon: Building2 },
  { title: "All Claims", url: "/claims", icon: FileText },
];

// Director-only sales nav items
const directorSalesNavItems = [
  { title: "Sales Dashboard", url: "/sales", icon: DollarSign },
  { title: "By Sales Person", url: "/sales/by-person", icon: Users },
  { title: "By Office", url: "/sales/by-office", icon: Building2 },
  { title: "All Sales", url: "/sales/all", icon: FileText },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { salesperson, isDirector: actuallyDirector } = useCurrentSalesperson();
  const { effectiveSalesperson, isViewingAsOther, isDirector: viewAsDirectorCheck } = useViewAs();

  // When viewing as someone else, use their role. Otherwise use actual role.
  const effectiveIsDirector = isViewingAsOther 
    ? effectiveSalesperson?.role === "sales_director"
    : actuallyDirector;
  
  const effectivePerson = isViewingAsOther ? effectiveSalesperson : salesperson;

  // Sales nav items - only show for directors (or when viewing as director)
  const salesNavItems = actuallyDirector 
    ? [
        ...directorSalesNavItems,
        ...(!isViewingAsOther ? [{ title: "Import Data", url: "/import-commissions", icon: Upload }] : []),
      ]
    : []; // Sales reps don't see the sales section at all

  // Dynamic planning nav items based on effective role
  const planningNavItems = [
    // Show Sales Planning only if actually director
    ...(actuallyDirector ? [{ title: "Sales Planning", url: "/planning", icon: Map }] : []),
    // Show My Dashboard/Plan for the effective person
    ...(effectivePerson 
      ? [
          { title: "My Dashboard", url: `/sales/person/${effectivePerson.id}`, icon: DollarSign },
          ...(!effectiveIsDirector ? [{ title: "My Plan", url: `/planning/${effectivePerson.id}`, icon: Target }] : []),
        ]
      : []
    ),
  ];

  // For sales reps, hide adjusting and claims sections
  const showAdjustingSection = actuallyDirector;
  const showClaimsSection = actuallyDirector;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      navigate('/login');
    }
  };

  return (
    <aside
      className={cn(
        "glass-sidebar h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-foreground">DealMetrics</h1>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="hidden lg:block">
              <GlobalAlertsIndicator />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Home */}
        {mainNavItems.map((item, index) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
              collapsed && "justify-center px-3"
            )}
            activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium animate-fade-in">{item.title}</span>
            )}
          </NavLink>
        ))}

        {/* Claims Section - Directors only */}
        {showClaimsSection && (
          <>
            {!collapsed && (
              <p className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Claims</p>
            )}
            {collapsed && <div className="h-4" />}
            {claimsNavItems.map((item, index) => (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
                  collapsed && "justify-center px-3"
                )}
                activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
                style={{ animationDelay: `${(mainNavItems.length + index) * 50}ms` }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium animate-fade-in">{item.title}</span>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Sales Section - Directors only */}
        {salesNavItems.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sales</p>
            )}
            {collapsed && <div className="h-4" />}
            {salesNavItems.map((item, index) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/sales"}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
                  collapsed && "justify-center px-3"
                )}
                activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
                style={{ animationDelay: `${(mainNavItems.length + claimsNavItems.length + index) * 50}ms` }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium animate-fade-in">{item.title}</span>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Planning Section */}
        {!collapsed && (
          <p className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Planning</p>
        )}
        {collapsed && <div className="h-4" />}
        {planningNavItems.map((item, index) => (
          <NavLink
            key={item.url}
            to={item.url}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
              collapsed && "justify-center px-3"
            )}
            activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
            style={{ animationDelay: `${(mainNavItems.length + claimsNavItems.length + salesNavItems.length + index) * 50}ms` }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium animate-fade-in">{item.title}</span>
            )}
          </NavLink>
        ))}

        {/* Adjusting Section - Directors only */}
        {showAdjustingSection && (
          <>
            {!collapsed && (
              <p className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adjusting</p>
            )}
            {collapsed && <div className="h-4" />}
            {adjustingNavItems.map((item, index) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/dashboard"}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
                  collapsed && "justify-center px-3"
                )}
                activeClassName="bg-primary/10 text-primary border border-primary/20 glow-primary"
                style={{ animationDelay: `${(mainNavItems.length + claimsNavItems.length + salesNavItems.length + planningNavItems.length + index) * 50}ms` }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium animate-fade-in">{item.title}</span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section and Collapse Toggle */}
      <div className="p-4 border-t border-sidebar-border/30 space-y-2">
        {/* Settings Panel */}
        <SettingsPanel collapsed={collapsed} />
        
        {/* Sign Out Button */}
        {user && (
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-xs">Sign Out</span>}
          </button>
        )}
        
        {/* Collapse Toggle - hidden on mobile */}
        <div className="hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
