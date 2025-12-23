import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SalespersonOverview } from "@/components/salesperson/SalespersonOverview";
import { SalespersonGoalsSection } from "@/components/salesperson/SalespersonGoalsSection";
import { CommissionRecordsSection } from "@/components/salesperson/CommissionRecordsSection";
import { useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { useSalesGoals } from "@/hooks/useSalesGoals";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

export default function SalespersonDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions(id);
  const { data: goals, isLoading: loadingGoals } = useSalesGoals(id, currentYear);

  const salesperson = useMemo(() => {
    return salespeople?.find((sp) => sp.id === id);
  }, [salespeople, id]);

  const stats = useMemo(() => {
    if (!commissions) return null;
    
    const totalDeals = commissions.length;
    const totalVolume = commissions.reduce((sum, c) => sum + (c.initial_estimate || 0), 0);
    const totalRevisedVolume = commissions.reduce((sum, c) => sum + (c.revised_estimate || 0), 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);
    const totalInsuranceChecks = commissions.reduce((sum, c) => sum + (c.insurance_checks_ytd || 0), 0);
    const totalNewRemainder = commissions.reduce((sum, c) => sum + (c.new_remainder || 0), 0);
    
    return {
      totalDeals,
      totalVolume,
      totalRevisedVolume,
      totalCommissions,
      totalInsuranceChecks,
      totalNewRemainder,
      avgDealSize: totalDeals > 0 ? totalVolume / totalDeals : 0,
      commissionYield: totalVolume > 0 ? (totalCommissions / totalVolume) * 100 : 0,
    };
  }, [commissions]);

  const currentGoal = useMemo(() => {
    return goals?.find((g) => g.year === currentYear);
  }, [goals, currentYear]);

  const isLoading = loadingSalespeople || loadingCommissions || loadingGoals;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!salesperson) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Salesperson not found</p>
          <Button onClick={() => navigate("/sales/by-person")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales by Person
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/sales/by-person")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sales by Person
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{salesperson.name}</h1>
            <p className="text-muted-foreground">
              {salesperson.role === "sales_director" ? "Sales Director" : "Sales Representative"}
              {salesperson.email && ` • ${salesperson.email}`}
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SalespersonOverview 
            stats={stats} 
            goal={currentGoal}
            salespersonName={salesperson.name}
          />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <SalespersonGoalsSection 
            salespersonId={id!}
            salespersonName={salesperson.name}
            currentStats={stats}
          />
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <CommissionRecordsSection 
            commissions={commissions || []}
            salespersonId={id!}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
