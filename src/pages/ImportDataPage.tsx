import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { parseExcelFromUrl, ExcelClaimRow } from "@/lib/excelParser";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function ImportDataPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [claims, setClaims] = useState<ExcelClaimRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    loadExcelData();
  }, []);

  const loadExcelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parseExcelFromUrl('/data/Commission_1.xlsx');
      console.log('Parsed claims:', data);
      setClaims(data);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const importToDatabase = async () => {
    if (claims.length === 0) return;
    
    setImporting(true);
    try {
      // First, delete existing data
      const { error: deleteError } = await supabase
        .from('claims_2025')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
      
      if (deleteError) throw deleteError;

      // Insert new data in batches
      const batchSize = 50;
      for (let i = 0; i < claims.length; i += batchSize) {
        const batch = claims.slice(i, i + batchSize).map(claim => ({
          name: claim.name,
          adjuster: claim.adjuster,
          office: claim.office,
          date_signed: claim.dateSigned,
          estimate_of_loss: claim.estimateOfLoss,
          revised_estimate_of_loss: claim.revisedEstimateOfLoss,
        }));

        const { error: insertError } = await supabase
          .from('claims_2025')
          .insert(batch);
        
        if (insertError) throw insertError;
      }

      setImported(true);
      toast({
        title: "Import Successful",
        description: `${claims.length} claims imported from Excel file.`,
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => navigate('/'), 2000);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Import Excel Data
        </h1>
        <p className="text-muted-foreground">
          Preview and import data from Commission_1.xlsx (2025 tab)
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">Parsing Excel file...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold mb-2">Error Parsing File</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && claims.length > 0 && (
        <>
          {/* Summary */}
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Found {claims.length} Claims
                </h2>
                <p className="text-muted-foreground">
                  Offices: {[...new Set(claims.map(c => c.office))].join(', ')} | 
                  Adjusters: {[...new Set(claims.map(c => c.adjuster))].length}
                </p>
              </div>
              <Button
                onClick={importToDatabase}
                disabled={importing || imported}
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

          {/* Preview Table */}
          <div className="glass-table overflow-hidden animate-fade-in">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left bg-glass-bg">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      Adjuster
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      Office
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Estimate
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">
                      Revised
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim, idx) => (
                    <tr key={idx} className="border-b border-glass-border/20">
                      <td className="px-4 py-2 text-muted-foreground text-sm">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2 font-medium text-foreground">
                        {claim.name}
                      </td>
                      <td className="px-4 py-2 text-primary">
                        {claim.adjuster}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {claim.office}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {claim.dateSigned || '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatCurrency(claim.estimateOfLoss)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatCurrency(claim.revisedEstimateOfLoss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !error && claims.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">No data found in Excel file.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
