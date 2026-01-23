import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ViewAsProvider } from "@/contexts/ViewAsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRoute } from "@/components/RoleBasedRoute";
import Index from "./pages/Index";
import HomePage from "./pages/HomePage";
import AdjustersPage from "./pages/AdjustersPage";
import OfficesPage from "./pages/OfficesPage";
import ClaimsPage from "./pages/ClaimsPage";
import ImportDataPage from "./pages/ImportDataPage";
import ImportCommissionsPage from "./pages/ImportCommissionsPage";
import SalesDashboardPage from "./pages/SalesDashboardPage";
import SalesByPersonPage from "./pages/SalesByPersonPage";
import SalesByOfficePage from "./pages/SalesByOfficePage";
import AllSalesPage from "./pages/AllSalesPage";
import SalesPlanningPage from "./pages/SalesPlanningPage";
import IndividualPlanningPage from "./pages/IndividualPlanningPage";
import SalespersonDashboardPage from "./pages/SalespersonDashboardPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AddClaimPage from "./pages/AddClaimPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ViewAsProvider>
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<AuthPage />} />
              {/* Director-only pages */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <Index />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/adjusters" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <AdjustersPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/import" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <ImportDataPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/import-commissions" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <ImportCommissionsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/offices" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <OfficesPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/claims" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <ClaimsPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/add-claim" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <AddClaimPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/sales" element={
                <ProtectedRoute>
                  <RoleBasedRoute redirectToOwnDashboard>
                    <SalesDashboardPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/sales/by-person" element={
                <ProtectedRoute>
                  <RoleBasedRoute redirectToOwnDashboard>
                    <SalesByPersonPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              {/* Salesperson dashboard - reps can only see their own */}
              <Route path="/sales/person/:id" element={
                <ProtectedRoute>
                  <RoleBasedRoute requireOwnPage>
                    <SalespersonDashboardPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/sales/by-office" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <SalesByOfficePage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="/sales/all" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <AllSalesPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              {/* Planning - team view is director-only */}
              <Route path="/planning" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["sales_director"]}>
                    <SalesPlanningPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              {/* Individual planning - reps can only see their own */}
              <Route path="/planning/:id" element={
                <ProtectedRoute>
                  <RoleBasedRoute requireOwnPage>
                    <IndividualPlanningPage />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ViewAsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
