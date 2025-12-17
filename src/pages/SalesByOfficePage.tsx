import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditSalesRecordDialog } from "@/components/dashboard/EditSalesRecordDialog";
import { useSalespeople, useSalesCommissions } from "@/hooks/useSalesCommissions";
import { Loader2, Edit2, Building2, DollarSign, Users, FileText } from "lucide-react";
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

  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    if (selectedOffices.length === 0) return commissions;
    
    const officeMap: Record<string, string> = { Houston: "H", Dallas: "D" };
    const selectedCodes = selectedOffices.map((o) => officeMap[o]);
    
    return commissions.filter((c) => c.office && selectedCodes.includes(c.office));
  }, [commissions, selectedOffices]);

  const officeStats = useMemo(() => {
    const stats: Record<string, { deals: number; volume: number; commissions: number; salespeople: Set<string> }> = {
      Houston: { deals: 0, volume: 0, commissions: 0, salespeople: new Set() },
      Dallas: { deals: 0, volume: 0, commissions: 0, salespeople: new Set() },
    };
    
    commissions?.forEach((c) => {
      const office = c.office === "H" ? "Houston" : c.office === "D" ? "Dallas" : null;
      if (office && stats[office]) {
        stats[office].deals += 1;
        stats[office].volume += c.initial_estimate || 0;
        stats[office].commissions += c.commissions_paid || 0;
        if (c.salesperson_id) {
          stats[office].salespeople.add(c.salesperson_id);
        }
      }
    });
    
    return Object.entries(stats).map(([name, data]) => ({
      name,
      deals: data.deals,
      volume: data.volume,
      commissions: data.commissions,
      salespeopleCount: data.salespeople.size,
    }));
  }, [commissions]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <h3 className="text-xl font-semibold text-foreground">{stat.name}</h3>
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
            </div>
          ))}
      </div>

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
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Commission</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.slice(0, 50).map((record) => (
                <tr key={record.id} className="border-b border-glass-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{record.client_name}</td>
                  <td className="py-3 px-4 text-foreground">
                    {record.office === "H" ? "Houston" : record.office === "D" ? "Dallas" : record.office || "-"}
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {record.salesperson_id ? salespeopleMap[record.salesperson_id] : "-"}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    ${(record.initial_estimate || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">
                    ${(record.revised_estimate || 0).toLocaleString()}
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