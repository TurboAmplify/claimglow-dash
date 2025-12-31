import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, Save, Calculator, Search, Filter, Plus, ChevronDown, ChevronUp, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DealCard } from "@/components/salesperson/DealCard";
import type { SalesCommission } from "@/types/sales";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSalespersonSplit, SalespersonSplit } from "@/components/salesperson/MultiSalespersonSplit";
import { MonthlyCommissionSummary } from "@/components/salesperson/MonthlyCommissionSummary";

const AddClaimPage = () => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("deal");
  const [clientName, setClientName] = useState("");
  const [adjuster, setAdjuster] = useState("");
  const [office, setOffice] = useState("");
  const [salespersonSplits, setSalespersonSplits] = useState<SalespersonSplit[]>([]);
  const [dateSigned, setDateSigned] = useState<Date | undefined>(new Date());
  const [initialEstimate, setInitialEstimate] = useState("");
  const [feePercentage, setFeePercentage] = useState("7");
  const [commissionPercentage, setCommissionPercentage] = useState("8");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch salespeople for the dropdown
  const { data: salespeople = [] } = useQuery({
    queryKey: ["salespeople"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salespeople")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all claims/deals
  const { data: claims = [] } = useQuery({
    queryKey: ["sales_commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_commissions")
        .select("*")
        .order("date_signed", { ascending: false });
      if (error) throw error;
      return data as SalesCommission[];
    },
  });

  const years = useMemo(() => {
    const uniqueYears = [...new Set(claims.map((c) => c.year).filter(Boolean))];
    return uniqueYears.sort((a, b) => (b || 0) - (a || 0));
  }, [claims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const matchesSearch = searchTerm === "" || 
        c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.adjuster?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = yearFilter === "all" || c.year?.toString() === yearFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesSalesperson = salespersonFilter === "all" || c.salesperson_id === salespersonFilter;
      
      return matchesSearch && matchesYear && matchesStatus && matchesSalesperson;
    });
  }, [claims, searchTerm, yearFilter, statusFilter, salespersonFilter]);

  // Live commission preview - shows total across all splits
  const projectedCommission = useMemo(() => {
    const estimate = parseFloat(initialEstimate) || 0;
    const fee = parseFloat(feePercentage) / 100 || 0;
    const commission = parseFloat(commissionPercentage) / 100 || 0;
    const totalSplit = salespersonSplits.reduce((sum, s) => sum + s.splitPercentage, 0) / 100 || 0;
    
    const feeEarned = estimate * fee;
    const commissionEarned = feeEarned * commission * totalSplit;
    
    return { feeEarned, commissionEarned, totalSplit };
  }, [initialEstimate, feePercentage, commissionPercentage, salespersonSplits]);

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalVolume = filteredClaims.reduce((sum, c) => sum + (c.revised_estimate || c.initial_estimate || 0), 0);
    const totalCollected = filteredClaims.reduce((sum, c) => sum + (c.insurance_checks_ytd || 0), 0);
    const totalCommissionEarned = filteredClaims.reduce((sum, c) => {
      const checks = c.insurance_checks_ytd || 0;
      const fee = (c.fee_percentage || 0) / 100;
      const commission = (c.commission_percentage || 0) / 100;
      const split = (c.split_percentage || 100) / 100;
      return sum + (checks * fee * commission * split);
    }, 0);
    const totalCommissionPaid = filteredClaims.reduce((sum, c) => sum + (c.commissions_paid || 0), 0);
    const pendingCommission = totalCommissionEarned - totalCommissionPaid;

    return {
      dealCount: filteredClaims.length,
      totalVolume,
      totalCollected,
      collectionRate: totalVolume > 0 ? (totalCollected / totalVolume) * 100 : 0,
      totalCommissionEarned,
      totalCommissionPaid,
      pendingCommission,
    };
  }, [filteredClaims]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter a client name.",
        variant: "destructive",
      });
      return;
    }

    const validSplits = salespersonSplits.filter(s => s.salespersonId);
    if (validSplits.length === 0) {
      toast({
        title: "Missing information",
        description: "Please add at least one salesperson.",
        variant: "destructive",
      });
      return;
    }

    const totalSplit = validSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
    if (totalSplit !== 100) {
      toast({
        title: "Invalid splits",
        description: "Split percentages must total 100%.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const estimate = parseFloat(initialEstimate) || 0;
      const currentYear = new Date().getFullYear();

      // Create a record for each salesperson with their split
      const records = validSplits.map(split => ({
        salesperson_id: split.salespersonId,
        client_name: clientName.trim(),
        adjuster: adjuster.trim() || null,
        office: office.trim() || null,
        date_signed: dateSigned ? format(dateSigned, "yyyy-MM-dd") : null,
        year: currentYear,
        initial_estimate: estimate,
        revised_estimate: estimate,
        percent_change: 0,
        insurance_checks_ytd: 0,
        old_remainder: estimate,
        new_remainder: estimate,
        fee_percentage: parseFloat(feePercentage) || 7,
        commission_percentage: parseFloat(commissionPercentage) || 8,
        split_percentage: split.splitPercentage,
        commissions_paid: 0,
        status: "open",
      }));

      const { error } = await supabase.from("sales_commissions").insert(records);

      if (error) throw error;

      const splitCount = validSplits.length;
      toast({
        title: "Claim added",
        description: `${clientName} has been added${splitCount > 1 ? ` with ${splitCount} split records` : ''} with projected commission of ${formatCurrency(projectedCommission.commissionEarned)}`,
      });

      // Reset form
      setClientName("");
      setAdjuster("");
      setOffice("");
      setSalespersonSplits([]);
      setDateSigned(new Date());
      setInitialEstimate("");
      setFeePercentage("7");
      setCommissionPercentage("8");
      setIsAddFormOpen(false);

      queryClient.invalidateQueries({ queryKey: ["sales_commissions"] });
    } catch (error) {
      console.error("Error adding claim:", error);
      toast({
        title: "Error",
        description: "Failed to add the claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground">Add/Update Claim</h1>
          <p className="text-sm text-muted-foreground">Manage client information and deal details</p>
        </div>

        {/* Add New Client/Deal Collapsible */}
        <Collapsible open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between glass-card border-dashed border-2 h-12 hover:bg-primary/5"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Client / Deal
              </span>
              {isAddFormOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="glass-card p-4 animate-fade-in">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="client" className="flex items-center gap-2 text-xs">
                    <User className="w-3.5 h-3.5" />
                    Add Client
                  </TabsTrigger>
                  <TabsTrigger value="deal" className="flex items-center gap-2 text-xs">
                    <FileText className="w-3.5 h-3.5" />
                    Add Updated Deal
                  </TabsTrigger>
                </TabsList>

                {/* Client Tab */}
                <TabsContent value="client" className="space-y-4">
                  <p className="text-xs text-muted-foreground">Enter client information. This creates a new entry with basic details.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="clientNameTab" className="text-xs">Client Name *</Label>
                      <Input
                        id="clientNameTab"
                        placeholder="Enter client name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <MultiSalespersonSplit
                        salespeople={salespeople}
                        splits={salespersonSplits}
                        onSplitsChange={setSalespersonSplits}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="adjusterTab" className="text-xs">Adjuster</Label>
                      <Input
                        id="adjusterTab"
                        placeholder="Adjuster name"
                        value={adjuster}
                        onChange={(e) => setAdjuster(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="officeTab" className="text-xs">Office</Label>
                      <Input
                        id="officeTab"
                        placeholder="Office"
                        value={office}
                        onChange={(e) => setOffice(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="button" onClick={handleSubmit} disabled={isSaving} size="sm">
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      {isSaving ? "Saving..." : "Save Client"}
                    </Button>
                  </div>
                </TabsContent>

                {/* Deal Tab */}
                <TabsContent value="deal" className="space-y-4">
                  <p className="text-xs text-muted-foreground">Enter full deal information including estimates and commission details.</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="clientName" className="text-xs">Client Name *</Label>
                        <Input
                          id="clientName"
                          placeholder="Client name"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          required
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <MultiSalespersonSplit
                          salespeople={salespeople}
                          splits={salespersonSplits}
                          onSplitsChange={setSalespersonSplits}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="adjuster" className="text-xs">Adjuster</Label>
                        <Input
                          id="adjuster"
                          placeholder="Adjuster"
                          value={adjuster}
                          onChange={(e) => setAdjuster(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="office" className="text-xs">Office</Label>
                        <Input
                          id="office"
                          placeholder="Office"
                          value={office}
                          onChange={(e) => setOffice(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date Signed</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-9 text-sm",
                                !dateSigned && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                              {dateSigned ? format(dateSigned, "MMM d, yyyy") : "Select"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dateSigned}
                              onSelect={setDateSigned}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="initialEstimate" className="text-xs">Sales Estimate ($)</Label>
                        <Input
                          id="initialEstimate"
                          type="number"
                          placeholder="0"
                          value={initialEstimate}
                          onChange={(e) => setInitialEstimate(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="feePercentage" className="text-xs">Fee %</Label>
                        <Input
                          id="feePercentage"
                          type="number"
                          step="0.1"
                          placeholder="7"
                          value={feePercentage}
                          onChange={(e) => setFeePercentage(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="commissionPercentage" className="text-xs">Commission %</Label>
                        <Input
                          id="commissionPercentage"
                          type="number"
                          step="0.1"
                          placeholder="8"
                          value={commissionPercentage}
                          onChange={(e) => setCommissionPercentage(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    {/* Commission Preview */}
                    {parseFloat(initialEstimate) > 0 && (
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-sm text-foreground">Projected Commission</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="min-w-0">
                            <span className="text-muted-foreground block">Est. Value</span>
                            <span className="font-medium whitespace-nowrap">{formatCurrency(parseFloat(initialEstimate) || 0)}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-muted-foreground block">Fee Earned</span>
                            <span className="font-medium whitespace-nowrap">{formatCurrency(projectedCommission.feeEarned)}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-muted-foreground block">Commission</span>
                            <span className="font-bold text-primary whitespace-nowrap">{formatCurrency(projectedCommission.commissionEarned)}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-muted-foreground block">Eff. Rate</span>
                            <span className="font-medium whitespace-nowrap">
                              {((parseFloat(feePercentage) / 100) * (parseFloat(commissionPercentage) / 100) * projectedCommission.totalSplit * 100).toFixed(3)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving} size="sm">
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        {isSaving ? "Adding..." : "Add Deal"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </Collapsible>

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
            <div className="flex flex-wrap gap-2">
              <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Salespeople</SelectItem>
                  {salespeople.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Monthly Commission Summary + Summary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "50ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Claims</p>
                <p className="text-base font-bold text-foreground tabular-nums">{summaryStats.dealCount}</p>
              </div>
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "75ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Total Volume</p>
                <p className="text-base font-bold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(summaryStats.totalVolume)}</p>
              </div>
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "100ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Collected</p>
                <p className="text-base font-bold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(summaryStats.totalCollected)}</p>
              </div>
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "125ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Collection %</p>
                <p className="text-base font-bold text-foreground tabular-nums">{summaryStats.collectionRate.toFixed(1)}%</p>
              </div>
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "150ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Comm. Earned</p>
                <p className="text-base font-bold text-primary tabular-nums whitespace-nowrap">{formatCurrency(summaryStats.totalCommissionEarned)}</p>
              </div>
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "175ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Paid Out</p>
                <p className="text-base font-bold text-green-600 tabular-nums whitespace-nowrap">{formatCurrency(summaryStats.totalCommissionPaid)}</p>
              </div>
              <div className="glass-card p-2.5 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
                <p className="text-[10px] text-muted-foreground leading-tight">Pending</p>
                <p className="text-base font-bold text-amber-600 tabular-nums whitespace-nowrap">{formatCurrency(summaryStats.pendingCommission)}</p>
              </div>
            </div>
          </div>
          
          {/* Monthly Commission Summary */}
          <div className="animate-fade-in" style={{ animationDelay: "225ms" }}>
            <MonthlyCommissionSummary 
              year={yearFilter !== "all" ? parseInt(yearFilter) : new Date().getFullYear()}
              salespersonId={salespersonFilter !== "all" ? salespersonFilter : undefined}
            />
          </div>
        </div>

        {/* Claims/Deal Cards */}
        <div className="space-y-3">
          {filteredClaims.length === 0 ? (
            <div className="glass-card p-8 text-center animate-fade-in">
              <p className="text-muted-foreground">No claims found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || yearFilter !== "all" || statusFilter !== "all" || salespersonFilter !== "all"
                  ? "Try adjusting your filters" 
                  : "Click 'Add New Claim' to get started"}
              </p>
            </div>
          ) : (
            filteredClaims.map((claim, index) => (
              <DealCard 
                key={claim.id} 
                commission={claim} 
                animationDelay={index * 50}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddClaimPage;
