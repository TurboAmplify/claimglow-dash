import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { BarChart3, LayoutDashboard, DollarSign, Target } from "lucide-react";
import { Link } from "react-router-dom";

const navigationCards = [
  {
    title: "Claims",
    description: "Track adjusters and claims data",
    url: "/dashboard",
    icon: LayoutDashboard,
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    title: "Sales",
    description: "View sales and commissions",
    url: "/sales",
    icon: DollarSign,
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    title: "Planning",
    description: "Goals and sales roadmap",
    url: "/planning",
    icon: Target,
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
];

const HomePage = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in">
        {/* Logo Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Commission</h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12">Tracker</p>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-4">
          {navigationCards.map((card, index) => (
            <Link
              key={card.title}
              to={card.url}
              className={`group relative p-6 rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.color} backdrop-blur-sm hover-scale transition-all duration-300 hover:shadow-lg`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
