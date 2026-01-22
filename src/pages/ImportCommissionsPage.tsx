import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { parseCommissionExcel, parseCommissionExcelFromFile } from "@/lib/commissionParser";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { Loader2, Upload, Check, AlertCircle, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useSalespeople } from "@/hooks/useSalesCommissions";
import { useCurrentSalesperson } from "@/hooks/useCurrentSalesperson";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function ImportCommissionsPage() {
  const navigate = useNavigate();
  const { data: salespeople } = useSalespeople();
  const { salesperson: currentUser, isDirector } = useCurrentSalesperson();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [yearData, setYearData] = useState<{ year: number; count: number }[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>("");

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setImported(false);
    await parseSelectedFile(file);
  };

  const parseSelectedFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const data = await parseCommissionExcelFromFile(file);
      
      const summary = data.map(d => ({ year: d.year, count: d.rows.length }));
      setYearData(summary);
      setTotalRows(data.reduce((sum, d) => sum + d.rows.length, 0));
      
      console.log('Parsed commission data:', data);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
      setYearData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setYearData([]);
    setTotalRows(0);
    setError(null);
    setImported(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const importToDatabase = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSalespersonId) {
      toast({
        title: "No Salesperson Selected",
        description: "Please select a salesperson for this import.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const targetSalesperson = salespeople?.find(s => s.id === selectedSalespersonId);
      if (!targetSalesperson) throw new Error('Selected salesperson not found');

      // Parse the file for import
      const data = await parseCommissionExcelFromFile(selectedFile);
      
      // Delete existing commissions for this salesperson
      const { error: deleteError } = await supabase
        .from('sales_commissions')
        .delete()
        .eq('salesperson_id', targetSalesperson.id);
      
      if (deleteError) throw deleteError;

      // Insert all data in batches
      const batchSize = 50;
      let insertedCount = 0;

      for (const yearSheet of data) {
        const rows = yearSheet.rows.map(row => ({
          salesperson_id: targetSalesperson.id,
          client_name: row.clientName,
          adjuster: row.adjuster || null,
          office: row.office || null,
          date_signed: row.dateSigned,
          year: row.year,
          initial_estimate: row.initialEstimate,
          revised_estimate: row.revisedEstimate,
          insurance_checks_ytd: row.insuranceChecks,
          old_remainder: row.oldRemainder,
          new_remainder: row.newRemainder,
          split_percentage: row.splitPercentage,
          fee_percentage: row.feePercentage,
          commission_percentage: row.commissionPercentage,
          commissions_paid: row.commissionsPaid,
          status: 'imported',
        }));

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('sales_commissions')
            .insert(batch);
          
          if (insertError) throw insertError;
          insertedCount += batch.length;
        }
      }

      setImported(true);
      toast({
        title: "Import Successful",
        description: `${insertedCount} commission records imported for ${targetSalesperson.name}.`,
      });
      
      setTimeout(() => navigate('/sales'), 2000);
    } catch (err) {
      console.error('Import error:', err);
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  // Only directors can access this page
  if (!isDirector) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="glass-card p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              Only directors can import commission data.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Import Commission Data
        </h1>
        <p className="text-muted-foreground">
          Upload an Excel spreadsheet to import sales commission records
        </p>
      </div>

      {/* File Upload Area */}
      <div className="glass-card p-6 mb-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center">
          {!selectedFile ? (
            <label 
              htmlFor="file-upload"
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
            >
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-1">
                Drop your Excel file here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports .xlsx and .xls files
              </p>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Parsing Excel file...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-8 text-center mb-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold mb-2">Error Parsing File</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && yearData.length > 0 && (
        <>
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Found {totalRows} Commission Records
                </h2>
                <p className="text-muted-foreground mb-4">
                  Years: {yearData.map(y => y.year).join(', ')}
                </p>
                
                {/* Salesperson Selector */}
                <div className="max-w-xs">
                  <Label htmlFor="salesperson-select" className="text-sm font-medium mb-2 block">
                    Import for Salesperson
                  </Label>
                  <Select value={selectedSalespersonId} onValueChange={setSelectedSalespersonId}>
                    <SelectTrigger id="salesperson-select" className="bg-background">
                      <SelectValue placeholder="Select salesperson..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {salespeople?.map(sp => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={importToDatabase}
                disabled={importing || imported || !selectedSalespersonId}
                className="gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : imported ? (
                  <>
                    <Check className="w-4 h-4" />
                    Imported!
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import to Database
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Year breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {yearData.map(({ year, count }) => (
              <div key={year} className="glass-card p-4 text-center animate-fade-in">
                <p className="text-2xl font-bold text-primary">{year}</p>
                <p className="text-muted-foreground text-sm">{count} deals</p>
              </div>
            ))}
          </div>

          {/* Import summary */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Import Summary</h3>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>File:</strong> {selectedFile?.name}</p>
              <p><strong>Total Records:</strong> {totalRows}</p>
              <p><strong>Years Covered:</strong> {yearData.length} years</p>
              {selectedSalespersonId && (
                <p><strong>Target Salesperson:</strong> {salespeople?.find(s => s.id === selectedSalespersonId)?.name}</p>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
