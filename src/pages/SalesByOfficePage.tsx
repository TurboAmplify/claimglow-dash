import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditSalesRecordDialog } from "@/components/dashboard/EditSalesRecordDialog";
import { SalespersonCard, SalespersonStats } from "@/components/dashboard/SalespersonCard";
import { useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { Loader2, Edit2, Building2, DollarSign, Users, FileText, Percent, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SalesCommission } from "@/types/sales";

export default function SalesByOfficePage() {
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [editRecord, setEditRecord] = useState<SalesCommission | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions();

  const offices = ["Houston", "Dallas"];

  const salespeopleMap = useMemo(() => {
    const map: Record<string, string> = {};
    salespeople?.forEach((sp) => {
      map[sp.id] = sp.name;
    });
    return map;
  }, [salespeople]);

  // Normalize office values to full names
  const normalizeOffice = (office: string | null | undefined): string => {
    if (!office) return "Unknown";
    const lower = office.toLowerCase().trim();
    if (lower === "h" || lower === "houston") return "Houston";
    if (lower === "d" || lower === "dallas") return "Dallas";
    return "Unknown";
  };

  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    if (selectedOffices.length === 0) return commissions;
    
    return commissions.filter((c) => {
      const normalizedOffice = normalizeOffice(c.office);
      return selectedOffices.includes(normalizedOffice);
    });
  }, [commissions, selectedOffices]);

  // Calculate unknown deals stats for alert
  const unknownDealsStats = useMemo(() => {
    let count = 0;
    let volume = 0;
    commissions?.forEach((c) => {
      if (normalizeOffice(c.office) === "Unknown") {
        count += 1;
        volume += c.initial_estimate || 0;
      }
    });
    return { count, volume };
  }, [commissions]);

  const officeStats = useMemo(() => {
    const stats: Record<string, { 
      deals: number; 
      volume: number; 
      revisedVolume: number;
      commissions: number; 
      salespeople: Set<string>;
      totalFeePercentage: number;
      totalCommissionPercentage: number;
    }> = {
      Houston: { deals: 0, volume: 0, revisedVolume: 0, commissions: 0, salespeople: new Set(), totalFeePercentage: 0, totalCommissionPercentage: 0 },
      Dallas: { deals: 0, volume: 0, revisedVolume: 0, commissions: 0, salespeople: new Set(), totalFeePercentage: 0, totalCommissionPercentage: 0 },
    };
    
    commissions?.forEach((c) => {
      const office = normalizeOffice(c.office);
      if (office !== "Unknown" && stats[office]) {
        stats[office].deals += 1;
        stats[office].volume += c.initial_estimate || 0;
        stats[office].revisedVolume += c.revised_estimate || 0;
        stats[office].commissions += c.commissions_paid || 0;
        stats[office].totalFeePercentage += c.fee_percentage || 0;
        stats[office].totalCommissionPercentage += c.commission_percentage || 0;
        if (c.salesperson_id) {
          stats[office].salespeople.add(c.salesperson_id);
        }
      }
    });
    
    return Object.entries(stats)
      .filter(([_, data]) => data.deals > 0)
      .map(([name, data]) => ({
        name,
        deals: data.deals,
        volume: data.volume,
        revisedVolume: data.revisedVolume,
        commissions: data.commissions,
        salespeopleCount: data.salespeople.size,
        avgFeePercentage: data.deals > 0 ? data.totalFeePercentage / data.deals : 0,
        avgCommissionPercentage: data.deals > 0 ? data.totalCommissionPercentage / data.deals : 0,
        commissionYield: data.volume > 0 ? (data.commissions / data.volume) * 100 : 0,
      }));
  }, [commissions]);

  // Calculate salesperson stats for the filtered view
  const salespersonStats = useMemo(() => {
    const stats: Record<string, {
      deals: number;
      volume: number;
      revisedVolume: number;
      commissions: number;
      totalFeePercentage: number;
      totalCommissionPercentage: number;
      totalSplitPercentage: number;
      office: string;
    }> = {};
    
    filteredCommissions.forEach((c) => {
      const name = c.salesperson_id ? salespeopleMap[c.salesperson_id] : "Unknown";
      if (!stats[name]) {
        stats[name] = { 
          deals: 0, 
          volume: 0, 
          revisedVolume: 0,
          commissions: 0,
          totalFeePercentage: 0,
          totalCommissionPercentage: 0,
          totalSplitPercentage: 0,
          office: normalizeOffice(c.office),
        };
      }
      stats[name].deals += 1;
      stats[name].volume += c.initial_estimate || 0;
      stats[name].revisedVolume += c.revised_estimate || 0;
      stats[name].commissions += c.commissions_paid || 0;
      stats[name].totalFeePercentage += c.fee_percentage || 0;
      stats[name].totalCommissionPercentage += c.commission_percentage || 0;
      stats[name].totalSplitPercentage += c.split_percentage || 100;
    });
    
    return Object.entries(stats).map(([name, data]): SalespersonStats => ({
      name,
      office: data.office,
      deals: data.deals,
      volume: data.volume,
      revisedVolume: data.revisedVolume,
      commissions: data.commissions,
      avgFeePercentage: data.deals > 0 ? data.totalFeePercentage / data.deals : 0,
      avgCommissionPercentage: data.deals > 0 ? data.totalCommissionPercentage / data.deals : 0,
      avgSplitPercentage: data.deals > 0 ? data.totalSplitPercentage / data.deals : 100,
    })).sort((a, b) => b.commissions - a.commissions);
  }, [filteredCommissions, salespeopleMap]);

  const handleEdit = (record: SalesCommission) => {
    setEditRecord(record);
    setEditDialogOpen(true);
  };

  const isLoading = loadingSalespeople || loadingCommissions;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading sales data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Sales by Office
        </h1>
        <p className="text-muted-foreground">
          Office performance and regional commission breakdown
        </p>
      </div>

      {/* Unknown Deals Alert */}
      {unknownDealsStats.count > 0 && (
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-foreground">
            <span className="font-medium">{unknownDealsStats.count} deals</span> with unknown office assignment 
            (${(unknownDealsStats.volume / 1000000).toFixed(2)}M volume) — mostly historical data from 2020-2021.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <MultiSelectFilter
          label="Filter by Office"
          options={offices}
          selected={selectedOffices}
          onChange={setSelectedOffices}
          placeholder="Select offices..."
        />
      </div>

      {/* Office Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {officeStats
          .filter((stat) => selectedOffices.length === 0 || selectedOffices.includes(stat.name))
          .map((stat, index) => (
            <div
              key={stat.name}
              className="glass-card p-6 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{stat.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent className="w-3 h-3" />
                    <span>{stat.commissionYield.toFixed(1)}% yield</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Total Deals</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stat.deals}</span>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Salespeople</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{stat.salespeopleCount}</span>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Volume</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    ${(stat.volume / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-primary/10">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Commissions</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    ${stat.commissions.toLocaleString()}
                  </span>
                </div>
              </div>
              {/* Additional Stats Row */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-xl bg-secondary/20">
                  <div className="text-xs text-muted-foreground mb-1">Avg Fee %</div>
                  <span className="text-lg font-semibold text-foreground">{stat.avgFeePercentage.toFixed(1)}%</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/20">
                  <div className="text-xs text-muted-foreground mb-1">Avg Comm %</div>
                  <span className="text-lg font-semibold text-foreground">{stat.avgCommissionPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Salesperson Cards */}
      {salespersonStats.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Salespeople Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {salespersonStats.map((stat, index) => (
              <SalespersonCard key={stat.name} stats={stat} delay={index * 50} />
            ))}
          </div>
        </div>
      )}

      {/* Commission Records Table */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-foreground mb-4">Commission Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Office</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Salesperson</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Initial Est.</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revised Est.</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Fee %</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Commission</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.slice(0, 50).map((record) => (
                <tr key={record.id} className="border-b border-glass-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{record.client_name}</td>
                  <td className="py-3 px-4 text-foreground">{normalizeOffice(record.office)}</td>
                  <td className="py-3 px-4 text-foreground">
                    {record.salesperson_id ? salespeopleMap[record.salesperson_id] : "-"}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    ${(record.initial_estimate || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    ${(record.revised_estimate || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    {(record.fee_percentage || 0).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right text-primary font-medium">
                    ${(record.commissions_paid || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCommissions.length > 50 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing 50 of {filteredCommissions.length} records
          </p>
        )}
      </div>

      <EditSalesRecordDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={editRecord}
        salespeople={salespeople?.map((sp) => ({ id: sp.id, name: sp.name })) || []}
      />
    </DashboardLayout>
  );
}
