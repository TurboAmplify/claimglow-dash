import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { parseExcelFromUrl, ExcelClaimRow, applyOfficeMapping } from "@/lib/excelParser";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Upload, Check, AlertCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ImportDataPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [claims, setClaims] = useState<ExcelClaimRow[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [officeMapping, setOfficeMapping] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);
  const [officeColInfo, setOfficeColInfo] = useState<{ index: number, header: string, values: string[] } | null>(null);
  const [autoImportTriggered, setAutoImportTriggered] = useState(false);

  // Get unique adjusters from claims
  const adjusters = useMemo(() => {
    return [...new Set(claims.map(c => c.adjuster))].filter(Boolean).sort();
  }, [claims]);

  // Apply office mapping to claims
  const mappedClaims = useMemo(() => {
    if (Object.keys(officeMapping).length === 0) return claims;
    return applyOfficeMapping(claims, officeMapping);
  }, [claims, officeMapping]);

  useEffect(() => {
    loadExcelData();
  }, []);

  // Auto-import when data is ready
  useEffect(() => {
    if (
      !autoImportTriggered && 
      !loading && 
      !importing && 
      !imported && 
      mappedClaims.length > 0 && 
      Object.keys(officeMapping).length > 0
    ) {
      setAutoImportTriggered(true);
      importToDatabase();
    }
  }, [loading, importing, imported, mappedClaims, officeMapping, autoImportTriggered]);

  const loadExcelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await parseExcelFromUrl('/data/Commission_1.xlsx');
      console.log('Parsed result:', result);
      setClaims(result.claims);
      setRawHeaders(result.rawHeaders);
      setRawRows(result.rawRows);
      setOfficeColInfo(result.officeColumn);
      
      // Get unique adjusters and randomly assign offices
      const uniqueAdjusters = [...new Set(result.claims.map(c => c.adjuster))].filter(Boolean);
      const randomMapping: Record<string, string> = {};
      uniqueAdjusters.forEach(adjuster => {
        randomMapping[adjuster] = Math.random() > 0.5 ? 'Houston' : 'Dallas';
      });
      setOfficeMapping(randomMapping);
      setShowMapping(true);
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    } finally {
      setLoading(false);
    }
  };

  const updateAdjusterOffice = (adjuster: string, office: string) => {
    setOfficeMapping(prev => ({
      ...prev,
      [adjuster]: office
    }));
  };

  const importToDatabase = async () => {
    if (mappedClaims.length === 0) return;
    
    setImporting(true);
    try {
      // First, delete existing data
      const { error: deleteError } = await supabase
        .from('claims_2025')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) throw deleteError;

      // Insert new data in batches
      const batchSize = 50;
      for (let i = 0; i < mappedClaims.length; i += batchSize) {
        const batch = mappedClaims.slice(i, i + batchSize).map(claim => ({
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
        description: `${mappedClaims.length} claims imported from Excel file.`,
      });
      
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

  // Get unique offices from mapped claims
  const offices = useMemo(() => {
    return [...new Set(mappedClaims.map(c => c.office))].filter(o => o !== 'Unknown');
  }, [mappedClaims]);

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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Found {mappedClaims.length} Claims
                </h2>
                <p className="text-muted-foreground">
                  Offices: {offices.length > 0 ? offices.join(', ') : 'Not assigned'} | 
                  Adjusters: {adjusters.length}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMapping(!showMapping)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Assign Offices
                </Button>
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
          </div>

          {/* Office Mapping Panel */}
          {showMapping && (
            <div className="glass-card p-6 mb-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Assign Office to Each Adjuster (H = Houston, D = Dallas)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adjusters.map(adjuster => (
                  <div key={adjuster} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <span className="font-medium text-foreground flex-1">{adjuster}</span>
                    <Select
                      value={officeMapping[adjuster] || 'Unknown'}
                      onValueChange={(value) => updateAdjusterOffice(adjuster, value)}
                    >
                      <SelectTrigger className="w-32 bg-background">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Houston">Houston (H)</SelectItem>
                        <SelectItem value="Dallas">Dallas (D)</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Headers */}
          {rawHeaders.length > 0 && (
            <div className="glass-card p-4 mb-6 animate-fade-in">
              <p className="text-sm text-muted-foreground">
                <strong>Detected columns:</strong> {rawHeaders.join(' | ')}
              </p>
            </div>
          )}

          {/* Preview Table */}
          <div className="glass-table overflow-hidden animate-fade-in">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left bg-glass-bg">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Adjuster</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Office</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Estimate</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-right">Revised</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedClaims.map((claim, idx) => (
                    <tr key={idx} className="border-b border-glass-border/20">
                      <td className="px-4 py-2 text-muted-foreground text-sm">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-foreground">{claim.name}</td>
                      <td className="px-4 py-2 text-primary">{claim.adjuster}</td>
                      <td className="px-4 py-2">
                        <span className={claim.office === 'Unknown' ? 'text-warning' : 'text-muted-foreground'}>
                          {claim.office}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{claim.dateSigned || '—'}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatCurrency(claim.estimateOfLoss)}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatCurrency(claim.revisedEstimateOfLoss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
