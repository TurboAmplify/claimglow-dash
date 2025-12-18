import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import GoalPlannerPage from "./pages/GoalPlannerPage";
import SalesRoadmapPage from "./pages/SalesRoadmapPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/adjusters" element={<ProtectedRoute><AdjustersPage /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><ImportDataPage /></ProtectedRoute>} />
          <Route path="/import-commissions" element={<ProtectedRoute><ImportCommissionsPage /></ProtectedRoute>} />
          <Route path="/offices" element={<ProtectedRoute><OfficesPage /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><ClaimsPage /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute><SalesDashboardPage /></ProtectedRoute>} />
          <Route path="/sales/by-person" element={<ProtectedRoute><SalesByPersonPage /></ProtectedRoute>} />
          <Route path="/sales/by-office" element={<ProtectedRoute><SalesByOfficePage /></ProtectedRoute>} />
          <Route path="/sales/all" element={<ProtectedRoute><AllSalesPage /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><GoalPlannerPage /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><SalesRoadmapPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
