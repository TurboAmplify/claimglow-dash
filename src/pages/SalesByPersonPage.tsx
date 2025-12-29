import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditSalesRecordDialog } from "@/components/dashboard/EditSalesRecordDialog";
import { SalespersonCard, SalespersonStats } from "@/components/dashboard/SalespersonCard";
import { useSalespeople, useSalesCommissions, useAvailableYears } from "@/hooks/useSalesCommissions";
import { Loader2, Edit2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SalesCommission } from "@/types/sales";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SalesByPersonPage() {
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [editRecord, setEditRecord] = useState<SalesCommission | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions(undefined, selectedYear || undefined);
  const { data: availableYears } = useAvailableYears();

  const salespeopleNames = useMemo(() => {
    return salespeople?.map((sp) => sp.name) || [];
  }, [salespeople]);

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
    if (selectedPeople.length === 0) return commissions;
    
    const selectedIds = salespeople
      ?.filter((sp) => selectedPeople.includes(sp.name))
      .map((sp) => sp.id) || [];
    
    return commissions.filter((c) => c.salesperson_id && selectedIds.includes(c.salesperson_id));
  }, [commissions, selectedPeople, salespeople]);

  const salespersonStats = useMemo(() => {
    const stats: Record<string, {
      deals: number;
      volume: number;
      revisedVolume: number;
      commissions: number;
      totalFeePercentage: number;
      totalCommissionPercentage: number;
      totalSplitPercentage: number;
      dallasCount: number;
      houstonCount: number;
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
          dallasCount: 0,
          houstonCount: 0,
        };
      }
      stats[name].deals += 1;
      stats[name].volume += c.initial_estimate || 0;
      stats[name].revisedVolume += c.revised_estimate || 0;
      stats[name].commissions += c.commissions_paid || 0;
      stats[name].totalFeePercentage += c.fee_percentage || 0;
      stats[name].totalCommissionPercentage += c.commission_percentage || 0;
      stats[name].totalSplitPercentage += c.split_percentage || 100;
      
      // Count offices for each salesperson
      const normalizedOffice = normalizeOffice(c.office);
      if (normalizedOffice === "Dallas") stats[name].dallasCount += 1;
      if (normalizedOffice === "Houston") stats[name].houstonCount += 1;
    });
    
    return Object.entries(stats).map(([name, data]): SalespersonStats & { id: string } => {
      const sp = salespeople?.find((s) => s.name === name);
      // Use the most frequent office for this salesperson
      const office = data.dallasCount >= data.houstonCount ? "Dallas" : "Houston";
      return {
        id: sp?.id || "",
        name,
        office,
        deals: data.deals,
        volume: data.volume,
        revisedVolume: data.revisedVolume,
        commissions: data.commissions,
        avgFeePercentage: data.deals > 0 ? data.totalFeePercentage / data.deals : 0,
        avgCommissionPercentage: data.deals > 0 ? data.totalCommissionPercentage / data.deals : 0,
        avgSplitPercentage: data.deals > 0 ? data.totalSplitPercentage / data.deals : 100,
      };
    }).sort((a, b) => b.commissions - a.commissions);
  }, [filteredCommissions, salespeopleMap, salespeople]);

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
          Sales by Person
        </h1>
        <p className="text-muted-foreground">
          Individual salesperson performance and commission details
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <MultiSelectFilter
              label="Filter by Salesperson"
              options={salespeopleNames}
              selected={selectedPeople}
              onChange={setSelectedPeople}
              placeholder="Select salespeople..."
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-muted-foreground mb-2">Year</label>
            <Select
              value={selectedYear?.toString() || "all"}
              onValueChange={(v) => setSelectedYear(v === "all" ? null : parseInt(v))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="all">All Years</SelectItem>
                {availableYears?.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {salespersonStats.map((stat, index) => (
          <SalespersonCard 
            key={stat.name} 
            stats={stat} 
            delay={index * 50}
            onClick={() => stat.id && navigate(`/sales/person/${stat.id}`)}
          />
        ))}
      </div>

      {/* Commission Records Table */}
      <div className="glass-card p-6 animate-fade-in">
        <h2 className="text-xl font-semibold text-foreground mb-4">Commission Records</h2>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-glass-border/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Salesperson</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Office</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Initial Est.</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Revised Est.</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Fee %</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Commission</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground bg-card">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.slice(0, 50).map((record) => (
                <tr key={record.id} className="border-b border-glass-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{record.client_name}</td>
                  <td className="py-3 px-4 text-foreground">
                    {record.salesperson_id ? salespeopleMap[record.salesperson_id] : "-"}
                  </td>
                  <td className="py-3 px-4 text-foreground">{normalizeOffice(record.office)}</td>
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
