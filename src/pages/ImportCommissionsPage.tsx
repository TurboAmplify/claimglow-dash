import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { parseCommissionExcel } from "@/lib/commissionParser";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useSalespeople } from "@/hooks/useSalesCommissions";

export default function ImportCommissionsPage() {
  const navigate = useNavigate();
  const { data: salespeople } = useSalespeople();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [yearData, setYearData] = useState<{ year: number; count: number }[]>([]);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    loadExcelData();
  }, []);

  const loadExcelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parseCommissionExcel('/data/Commission_3.xlsx');
      
      const summary = data.map(d => ({ year: d.year, count: d.rows.length }));
      setYearData(summary);
      setTotalRows(data.reduce((sum, d) => sum + d.rows.length, 0));
      
      console.log('Parsed commission data:', data);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const importToDatabase = async () => {
    if (!salespeople || salespeople.length === 0) {
      toast({
        title: "No Salesperson Found",
        description: "Please add a salesperson first.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      // Get Matt Aldrich's ID
      const mattAldrich = salespeople.find(s => s.name === 'Matt Aldrich');
      if (!mattAldrich) throw new Error('Matt Aldrich not found in salespeople');

      // Parse the data again for import
      const data = await parseCommissionExcel('/data/Commission_3.xlsx');
      
      // Delete existing commissions for this salesperson
      const { error: deleteError } = await supabase
        .from('sales_commissions')
        .delete()
        .eq('salesperson_id', mattAldrich.id);
      
      if (deleteError) throw deleteError;

      // Insert all data in batches
      const batchSize = 50;
      let insertedCount = 0;

      for (const yearSheet of data) {
        const rows = yearSheet.rows.map(row => ({
          salesperson_id: mattAldrich.id,
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
        description: `${insertedCount} commission records imported for Matt Aldrich.`,
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

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Import Commission Data
        </h1>
        <p className="text-muted-foreground">
          Import sales commission data from Commission_3.xlsx (2020-2025)
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

      {!loading && !error && yearData.length > 0 && (
        <>
          <div className="glass-card p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Found {totalRows} Commission Records
                </h2>
                <p className="text-muted-foreground">
                  Years: {yearData.map(y => y.year).join(', ')}
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

          {/* Year breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {yearData.map(({ year, count }) => (
              <div key={year} className="glass-card p-4 text-center animate-fade-in">
                <p className="text-2xl font-bold text-primary">{year}</p>
                <p className="text-muted-foreground text-sm">{count} deals</p>
              </div>
            ))}
          </div>

          {/* Salesperson info */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground mb-4">Import Details</h3>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Salesperson:</strong> Matt Aldrich</p>
              <p><strong>Data Source:</strong> Commission_3.xlsx</p>
              <p><strong>Total Records:</strong> {totalRows}</p>
              <p><strong>Years Covered:</strong> {yearData.length} years (2020-2025)</p>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
