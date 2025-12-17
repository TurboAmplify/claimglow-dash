import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MultiSelectFilter } from "@/components/dashboard/MultiSelectFilter";
import { EditSalesRecordDialog } from "@/components/dashboard/EditSalesRecordDialog";
import { useSalespeople, useSalesCommissions, useAvailableYears } from "@/hooks/useSalesCommissions";
import { Loader2, Edit2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SalesCommission } from "@/types/sales";

export default function AllSalesPage() {
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editRecord, setEditRecord] = useState<SalesCommission | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: salespeople, isLoading: loadingSalespeople } = useSalespeople();
  const { data: commissions, isLoading: loadingCommissions } = useSalesCommissions();
  const { data: availableYears } = useAvailableYears();

  const offices = ["Houston", "Dallas"];

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

  const yearOptions = useMemo(() => {
    return availableYears?.map((y) => y.toString()) || [];
  }, [availableYears]);

  const filteredCommissions = useMemo(() => {
    if (!commissions) return [];
    
    let filtered = [...commissions];
    
    // Filter by salesperson
    if (selectedPeople.length > 0) {
      const selectedIds = salespeople
        ?.filter((sp) => selectedPeople.includes(sp.name))
        .map((sp) => sp.id) || [];
      filtered = filtered.filter((c) => c.salesperson_id && selectedIds.includes(c.salesperson_id));
    }
    
    // Filter by office
    if (selectedOffices.length > 0) {
      const officeMap: Record<string, string> = { Houston: "H", Dallas: "D" };
      const selectedCodes = selectedOffices.map((o) => officeMap[o]);
      filtered = filtered.filter((c) => c.office && selectedCodes.includes(c.office));
    }
    
    // Filter by year
    if (selectedYears.length > 0) {
      const yearNums = selectedYears.map((y) => parseInt(y));
      filtered = filtered.filter((c) => c.year && yearNums.includes(c.year));
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.client_name.toLowerCase().includes(query) ||
          c.adjuster?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [commissions, selectedPeople, selectedOffices, selectedYears, searchQuery, salespeople]);

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

  const totalVolume = filteredCommissions.reduce((sum, c) => sum + (c.initial_estimate || 0), 0);
  const totalCommissions = filteredCommissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          All Sales Records
        </h1>
        <p className="text-muted-foreground">
          Complete sales commission database with filtering
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 mb-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-glass-border/30 rounded-xl"
              />
            </div>
          </div>
          <MultiSelectFilter
            label="Salesperson"
            options={salespeopleNames}
            selected={selectedPeople}
            onChange={setSelectedPeople}
            placeholder="All salespeople"
          />
          <MultiSelectFilter
            label="Office"
            options={offices}
            selected={selectedOffices}
            onChange={setSelectedOffices}
            placeholder="All offices"
          />
          <MultiSelectFilter
            label="Year"
            options={yearOptions}
            selected={selectedYears}
            onChange={setSelectedYears}
            placeholder="All years"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-1">Total Records</p>
          <p className="text-3xl font-bold text-foreground">{filteredCommissions.length}</p>
        </div>
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
          <p className="text-3xl font-bold text-foreground">${(totalVolume / 1000000).toFixed(2)}M</p>
        </div>
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-sm text-muted-foreground mb-1">Total Commissions</p>
          <p className="text-3xl font-bold text-primary">${totalCommissions.toLocaleString()}</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-glass-border/30">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Year</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Salesperson</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Office</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Adjuster</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Initial Est.</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revised Est.</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Commission</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.slice(0, 100).map((record) => (
                <tr key={record.id} className="border-b border-glass-border/20 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{record.year || "-"}</td>
                  <td className="py-3 px-4 text-foreground">{record.client_name}</td>
                  <td className="py-3 px-4 text-foreground">
                    {record.salesperson_id ? salespeopleMap[record.salesperson_id] : "-"}
                  </td>
                  <td className="py-3 px-4 text-foreground">
                    {record.office === "H" ? "Houston" : record.office === "D" ? "Dallas" : record.office || "-"}
                  </td>
                  <td className="py-3 px-4 text-foreground">{record.adjuster || "-"}</td>
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
        {filteredCommissions.length > 100 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing 100 of {filteredCommissions.length} records
          </p>
        )}
        {filteredCommissions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No records found matching filters.
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