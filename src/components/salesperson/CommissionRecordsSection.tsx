import { useState, useMemo } from "react";
import { SalesCommission } from "@/types/sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Search, DollarSign, Filter } from "lucide-react";
import { EditSalesRecordDialog } from "@/components/dashboard/EditSalesRecordDialog";
import { CheckReceivedDialog } from "@/components/salesperson/CheckReceivedDialog";
import { format } from "date-fns";

interface CommissionRecordsSectionProps {
  commissions: SalesCommission[];
  salespersonId: string;
}

export function CommissionRecordsSection({ commissions, salespersonId }: CommissionRecordsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editRecord, setEditRecord] = useState<SalesCommission | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);
  const [checkRecord, setCheckRecord] = useState<SalesCommission | null>(null);

  const years = useMemo(() => {
    const uniqueYears = [...new Set(commissions.map((c) => c.year).filter(Boolean))];
    return uniqueYears.sort((a, b) => (b || 0) - (a || 0));
  }, [commissions]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const matchesSearch = searchTerm === "" || 
        c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.adjuster?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = yearFilter === "all" || c.year?.toString() === yearFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      
      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [commissions, searchTerm, yearFilter, statusFilter]);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const handleEdit = (record: SalesCommission) => {
    setEditRecord(record);
    setEditDialogOpen(true);
  };

  const handleCheckReceived = (record: SalesCommission) => {
    setCheckRecord(record);
    setCheckDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client or adjuster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-32">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year?.toString() || ""}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "50ms" }}>
          <p className="text-sm text-muted-foreground">Records</p>
          <p className="text-2xl font-bold text-foreground">{filteredCommissions.length}</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
          <p className="text-sm text-muted-foreground">Total Volume</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(filteredCommissions.reduce((sum, c) => sum + (c.revised_estimate || 0), 0))}
          </p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "150ms" }}>
          <p className="text-sm text-muted-foreground">Insurance Checks</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(filteredCommissions.reduce((sum, c) => sum + (c.insurance_checks_ytd || 0), 0))}
          </p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-sm text-muted-foreground">Commissions Paid</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(filteredCommissions.reduce((sum, c) => sum + (c.commissions_paid || 0), 0))}
          </p>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "250ms" }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Adjuster</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Date Signed</TableHead>
                <TableHead className="text-right">Initial Est.</TableHead>
                <TableHead className="text-right">Revised Est.</TableHead>
                <TableHead className="text-right">% Change</TableHead>
                <TableHead className="text-right">Ins. Checks</TableHead>
                <TableHead className="text-right">New Remainder</TableHead>
                <TableHead className="text-right">Fee %</TableHead>
                <TableHead className="text-right">Split %</TableHead>
                <TableHead className="text-right">Commission %</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                    No commission records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((record) => (
                  <TableRow key={record.id} className="hover:bg-secondary/30">
                    <TableCell className="font-medium">{record.client_name}</TableCell>
                    <TableCell>{record.adjuster || "-"}</TableCell>
                    <TableCell>{record.office || "-"}</TableCell>
                    <TableCell>{formatDate(record.date_signed)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(record.initial_estimate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(record.revised_estimate)}</TableCell>
                    <TableCell className="text-right">{formatPercent(record.percent_change)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(record.insurance_checks_ytd)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(record.new_remainder)}</TableCell>
                    <TableCell className="text-right">{formatPercent(record.fee_percentage)}</TableCell>
                    <TableCell className="text-right">{formatPercent(record.split_percentage)}</TableCell>
                    <TableCell className="text-right">{formatPercent(record.commission_percentage)}</TableCell>
                    <TableCell className="text-right text-primary font-medium">
                      {formatCurrency(record.commissions_paid)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCheckReceived(record)}
                          className="h-8 w-8 p-0"
                          title="Record Check Received"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(record)}
                          className="h-8 w-8 p-0"
                          title="Edit Record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredCommissions.length > 50 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing {filteredCommissions.length} records
          </p>
        )}
      </div>

      <EditSalesRecordDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={editRecord}
        salespeople={[]}
      />

      <CheckReceivedDialog
        open={checkDialogOpen}
        onOpenChange={setCheckDialogOpen}
        record={checkRecord}
      />
    </div>
  );
}
