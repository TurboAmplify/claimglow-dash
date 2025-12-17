import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BarChart3 } from "lucide-react";

const HomePage = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Commission</h1>
        <p className="text-xl md:text-2xl text-muted-foreground">Tracker</p>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
