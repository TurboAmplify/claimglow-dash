import * as XLSX from 'xlsx';
import { CommissionRow } from '@/types/sales';

const officeCodeMap: Record<string, string> = {
  'h': 'Houston',
  'H': 'Houston',
  'd': 'Dallas',
  'D': 'Dallas',
  'Houston': 'Houston',
  'Dallas': 'Dallas',
};

interface SheetData {
  year: number;
  rows: CommissionRow[];
}

export async function parseCommissionExcel(url: string): Promise<SheetData[]> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  
  const allData: SheetData[] = [];
  
  // Process each sheet (each year)
  for (const sheetName of workbook.SheetNames) {
    // Skip template sheets
    if (sheetName.toLowerCase().includes('template')) continue;
    
    // Extract year from sheet name
    const yearMatch = sheetName.match(/20\d{2}/);
    if (!yearMatch) continue;
    const year = parseInt(yearMatch[0]);
    
    console.log(`Processing sheet: ${sheetName} (Year: ${year})`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) continue;
    
    const headers = jsonData[0]?.map((h: any) => String(h || '').trim().toLowerCase()) || [];
    
    // Find column indices based on headers
    const colMap = {
      clientName: headers.findIndex(h => h.includes('client') || h.includes('name')),
      adjuster: headers.findIndex(h => h.includes('adjuster') && h.includes('name')),
      office: headers.findIndex(h => h.includes('city') || h.includes('office')),
      percentDiff: headers.findIndex(h => h.includes('%') && h.includes('diff')),
      dateSigned: headers.findIndex(h => h.includes('date') && h.includes('signed')),
      initialEstimate: headers.findIndex(h => h.includes('original') || (h.includes('estimate') && !h.includes('revised'))),
      revisedEstimate: headers.findIndex(h => h.includes('revised')),
      insuranceChecks: headers.findIndex(h => h.includes('insurance') || h.includes('check')),
      oldRemainder: headers.findIndex(h => h.includes('old') && h.includes('remainder')),
      newRemainder: headers.findIndex(h => h.includes('new') && h.includes('remainder')),
      splitPercentage: headers.findIndex(h => h.includes('split')),
      feePercentage: headers.findIndex(h => h.includes('deal') || h.includes('signing') || h === 'fee'),
      commissionPercentage: headers.findIndex(h => h.includes('salesperson') && h.includes('commission')),
      commissionsPaid: headers.findIndex(h => h.includes('commission') && h.includes('paid')),
    };
    
    console.log(`Column mapping for ${sheetName}:`, colMap);
    
    const rows: CommissionRow[] = [];
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const clientName = String(row[colMap.clientName] || '').trim();
      if (!clientName || clientName.length < 2) continue;
      
      // Parse numeric values
      const parseNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        const str = String(val || '0').replace(/[$,%\s]/g, '');
        return parseFloat(str) || 0;
      };
      
      // Parse percentage (convert from 0.5 to 50 if needed)
      const parsePercent = (val: any): number => {
        const num = parseNumber(val);
        // If it's already a percentage (like 50), keep it
        // If it's a decimal (like 0.5), convert to percentage
        return num > 1 ? num : num * 100;
      };
      
      // Parse date
      let dateSigned: string | null = null;
      if (colMap.dateSigned >= 0 && row[colMap.dateSigned]) {
        const dateVal = row[colMap.dateSigned];
        if (typeof dateVal === 'number') {
          const date = XLSX.SSF.parse_date_code(dateVal);
          if (date) {
            dateSigned = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          }
        } else if (typeof dateVal === 'string') {
          // Try to parse string date
          const parsed = new Date(dateVal);
          if (!isNaN(parsed.getTime())) {
            dateSigned = parsed.toISOString().split('T')[0];
          }
        }
      }
      
      // Get office
      const rawOffice = colMap.office >= 0 ? String(row[colMap.office] || '').trim() : '';
      const office = officeCodeMap[rawOffice] || officeCodeMap[rawOffice.toUpperCase()] || rawOffice || 'Unknown';
      
      const initialEstimate = parseNumber(row[colMap.initialEstimate]);
      const revisedEstimate = parseNumber(row[colMap.revisedEstimate]);
      
      // Skip rows with no estimates
      if (initialEstimate === 0 && revisedEstimate === 0) continue;
      
      rows.push({
        clientName,
        adjuster: String(row[colMap.adjuster] || '').trim(),
        office,
        percentDifference: parseNumber(row[colMap.percentDiff]),
        dateSigned,
        initialEstimate,
        revisedEstimate,
        insuranceChecks: parseNumber(row[colMap.insuranceChecks]),
        oldRemainder: parseNumber(row[colMap.oldRemainder]),
        newRemainder: parseNumber(row[colMap.newRemainder]),
        splitPercentage: parsePercent(row[colMap.splitPercentage]) || 100,
        feePercentage: parsePercent(row[colMap.feePercentage]),
        commissionPercentage: parsePercent(row[colMap.commissionPercentage]),
        commissionsPaid: parseNumber(row[colMap.commissionsPaid]),
        year,
      });
    }
    
    if (rows.length > 0) {
      allData.push({ year, rows });
      console.log(`Found ${rows.length} rows for year ${year}`);
    }
  }
  
  return allData.sort((a, b) => a.year - b.year);
}
