import { Navigate, useParams } from "react-router-dom";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { Loader2 } from "lucide-react";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("sales_director" | "sales_rep")[];
  requireOwnPage?: boolean; // For sales reps, only allow access to their own page
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles,
  requireOwnPage = false,
}: RoleBasedRouteProps) {
  const { id } = useParams<{ id: string }>();
  const { salesperson, isLoading, isAuthenticated } = useCurrentSalesperson();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated - let ProtectedRoute handle this
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No salesperson record found for this user
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

  // Check role restrictions
  if (allowedRoles && !allowedRoles.includes(salesperson.role as "sales_director" | "sales_rep")) {
    // Sales reps trying to access director-only pages
    return <Navigate to={`/sales/person/${salesperson.id}`} replace />;
  }

  // For sales reps, check if they're trying to access their own page
  if (requireOwnPage && salesperson.role === "sales_rep" && id && id !== salesperson.id) {
    // Redirect to their own page
    return <Navigate to={`/sales/person/${salesperson.id}`} replace />;
  }

  return <>{children}</>;
}
