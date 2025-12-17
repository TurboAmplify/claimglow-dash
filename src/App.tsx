import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/adjusters" element={<AdjustersPage />} />
          <Route path="/import" element={<ImportDataPage />} />
          <Route path="/import-commissions" element={<ImportCommissionsPage />} />
          <Route path="/offices" element={<OfficesPage />} />
          <Route path="/claims" element={<ClaimsPage />} />
          <Route path="/sales" element={<SalesDashboardPage />} />
          <Route path="/sales/by-person" element={<SalesByPersonPage />} />
          <Route path="/sales/by-office" element={<SalesByOfficePage />} />
          <Route path="/sales/all" element={<AllSalesPage />} />
          <Route path="/goals" element={<GoalPlannerPage />} />
          <Route path="/roadmap" element={<SalesRoadmapPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
