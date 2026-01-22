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

// Extract year from date signed
function getYearFromDate(dateVal: any): number | null {
  if (typeof dateVal === 'number') {
    const date = XLSX.SSF.parse_date_code(dateVal);
    if (date && date.y >= 2000 && date.y <= 2100) {
      return date.y;
    }
  } else if (typeof dateVal === 'string') {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      if (year >= 2000 && year <= 2100) return year;
    }
  }
  return null;
}

// Parse workbook data (shared logic)
function parseWorkbook(workbook: XLSX.WorkBook): SheetData[] {
  const allData: SheetData[] = [];
  const rowsByYear: Record<number, CommissionRow[]> = {};
  
  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    // Skip template sheets and non-data sheets
    if (sheetName.toLowerCase().includes('template')) continue;
    if (sheetName.toLowerCase().includes('commission') && !sheetName.match(/20\d{2}/)) continue;
    if (sheetName.toLowerCase().includes('plan') || sheetName.toLowerCase().includes('goal')) continue;
    
    console.log(`Processing sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) continue;
    
    const headers = jsonData[0]?.map((h: any) => String(h || '').trim().toLowerCase()) || [];
    
    // Find column indices based on headers - improved matching with null safety
    const colMap = {
      clientName: headers.findIndex(h => h === 'name' || (h && h.includes('client'))),
      adjuster: headers.findIndex(h => h === 'adjuster' || (h && h.includes('adjuster') && !h.includes('%'))),
      office: headers.findIndex(h => h === 'city' || (h && (h.includes('city') || h.includes('office')))),
      percentDiff: headers.findIndex(h => h && ((h.includes('plus') && h.includes('minus')) || (h.includes('%') && h.includes('diff')))),
      dateSigned: headers.findIndex(h => h && h.includes('date') && h.includes('signed')),
      initialEstimate: headers.findIndex(h => h === 'estimate of loss' || h === 'initial est. of loss' || (h && h.includes('estimate') && !h.includes('revised'))),
      revisedEstimate: headers.findIndex(h => h && h.includes('revised')),
      insuranceChecks: headers.findIndex(h => h && ((h.includes('ins.') && h.includes('check')) || h.includes('insurance'))),
      oldRemainder: headers.findIndex(h => h && h.includes('old') && h.includes('remainder')),
      newRemainder: headers.findIndex(h => h && h.includes('new') && h.includes('remainder')),
      splitPercentage: headers.findIndex(h => h === 'split'),
      feePercentage: headers.findIndex(h => h === 'fee' || (h && h.includes('fee') && !h.includes('check'))),
      commissionPercentage: headers.findIndex(h => h === 'percent' || (h && h.includes('percent') && !h.includes('commission'))),
      commissionsPaid: headers.findIndex(h => h === 'payed' || h === 'paid' || (h && h.includes('paid') && !h.includes('remaining'))),
    };
    
    // Skip sheets that don't have required columns
    if (colMap.clientName === -1) {
      console.log(`Skipping sheet ${sheetName}: no client name column found`);
      continue;
    }
    
    console.log(`Column mapping for ${sheetName}:`, colMap, 'Headers:', headers);
    
    // Try to extract year from sheet name first
    const yearMatch = sheetName.match(/20\d{2}/);
    const sheetYear = yearMatch ? parseInt(yearMatch[0]) : null;
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;
      
      const clientName = String(row[colMap.clientName] || '').trim();
      // Skip summary rows, empty rows, and rows that look like notes
      if (!clientName || clientName.length < 2) continue;
      if (clientName.includes('=') || clientName.includes('claim')) continue;
      if (clientName.startsWith('$') || clientName.match(/^\d+$/)) continue;
      
      // Parse numeric values
      const parseNumber = (val: any): number => {
        if (typeof val === 'number') return val;
        const str = String(val || '0').replace(/[$,%\s()]/g, '').replace(/^\((.+)\)$/, '-$1');
        return parseFloat(str) || 0;
      };
      
      // Parse percentage (convert from 0.5 to 50 if needed)
      const parsePercent = (val: any): number => {
        if (val === undefined || val === null || val === '') return 0;
        const num = parseNumber(val);
        // If it's a decimal less than 1, convert to percentage
        return num > 0 && num < 1 ? num * 100 : num;
      };
      
      // Parse date and get year
      let dateSigned: string | null = null;
      let rowYear: number | null = sheetYear;
      
      if (colMap.dateSigned >= 0 && row[colMap.dateSigned]) {
        const dateVal = row[colMap.dateSigned];
        if (typeof dateVal === 'number') {
          const date = XLSX.SSF.parse_date_code(dateVal);
          if (date) {
            dateSigned = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            rowYear = date.y;
          }
        } else if (typeof dateVal === 'string') {
          const parsed = new Date(dateVal);
          if (!isNaN(parsed.getTime())) {
            dateSigned = parsed.toISOString().split('T')[0];
            rowYear = parsed.getFullYear();
          }
        }
      }
      
      // Skip if we can't determine the year
      if (!rowYear || rowYear < 2000 || rowYear > 2100) continue;
      
      // Get office
      const rawOffice = colMap.office >= 0 ? String(row[colMap.office] || '').trim() : '';
      const office = officeCodeMap[rawOffice] || officeCodeMap[rawOffice.toUpperCase()] || rawOffice || 'Unknown';
      
      const initialEstimate = parseNumber(row[colMap.initialEstimate]);
      const revisedEstimate = parseNumber(row[colMap.revisedEstimate]);
      
      // Skip rows with no estimates (but allow negative values for corrections)
      if (initialEstimate === 0 && revisedEstimate === 0) continue;
      
      const commissionRow: CommissionRow = {
        clientName,
        adjuster: colMap.adjuster >= 0 ? String(row[colMap.adjuster] || '').trim() : '',
        office,
        percentDifference: colMap.percentDiff >= 0 ? parseNumber(row[colMap.percentDiff]) : 0,
        dateSigned,
        initialEstimate,
        revisedEstimate,
        insuranceChecks: colMap.insuranceChecks >= 0 ? parseNumber(row[colMap.insuranceChecks]) : 0,
        oldRemainder: colMap.oldRemainder >= 0 ? parseNumber(row[colMap.oldRemainder]) : 0,
        newRemainder: colMap.newRemainder >= 0 ? parseNumber(row[colMap.newRemainder]) : 0,
        splitPercentage: colMap.splitPercentage >= 0 ? parsePercent(row[colMap.splitPercentage]) || 100 : 100,
        feePercentage: colMap.feePercentage >= 0 ? parsePercent(row[colMap.feePercentage]) : 0,
        commissionPercentage: colMap.commissionPercentage >= 0 ? parsePercent(row[colMap.commissionPercentage]) : 0,
        commissionsPaid: colMap.commissionsPaid >= 0 ? parseNumber(row[colMap.commissionsPaid]) : 0,
        year: rowYear,
      };
      
      if (!rowsByYear[rowYear]) {
        rowsByYear[rowYear] = [];
      }
      rowsByYear[rowYear].push(commissionRow);
    }
  }
  
  // Convert to array and sort by year
  for (const [yearStr, rows] of Object.entries(rowsByYear)) {
    const year = parseInt(yearStr);
    if (rows.length > 0) {
      allData.push({ year, rows });
      console.log(`Found ${rows.length} rows for year ${year}`);
    }
  }
  
  return allData.sort((a, b) => a.year - b.year);
}

// Parse from URL (existing functionality)
export async function parseCommissionExcel(url: string): Promise<SheetData[]> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  return parseWorkbook(workbook);
}

// Parse from File object (for file uploads)
export async function parseCommissionExcelFromFile(file: File): Promise<SheetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(parseWorkbook(workbook));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
