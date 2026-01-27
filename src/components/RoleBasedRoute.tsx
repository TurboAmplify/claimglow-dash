import { Navigate, useParams, useLocation } from "react-router-dom";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { Loader2 } from "lucide-react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("sales_director" | "sales_rep")[];
  requireOwnPage?: boolean; // For sales reps, only allow access to their own page
  redirectToOwnDashboard?: boolean; // Redirect sales reps to their own dashboard
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles,
  requireOwnPage = false,
  redirectToOwnDashboard = false,
}: RoleBasedRouteProps) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { salesperson, isLoading } = useCurrentSalesperson();

  // Show loading while fetching salesperson data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No salesperson record found for this user - show access denied
  // (ProtectedRoute already handles unauthenticated users)
  if (!salesperson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">No salesperson record found for your account.</p>
        </div>
      </div>
    );
  }

  const targetPath = `/sales/person/${salesperson.id}`;

  // Sales reps should be redirected to their own dashboard for certain pages
  // But don't redirect if we're already at or heading to the target
  if (redirectToOwnDashboard && salesperson.role === "sales_rep") {
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  // Check role restrictions
  if (allowedRoles && !allowedRoles.includes(salesperson.role as "sales_director" | "sales_rep")) {
    // Sales reps trying to access director-only pages
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
  }

  // For sales reps, check if they're trying to access their own page
  if (requireOwnPage && salesperson.role === "sales_rep" && id && id !== salesperson.id) {
    // Redirect to their own page
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
}
