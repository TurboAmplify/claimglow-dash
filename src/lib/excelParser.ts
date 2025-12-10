import * as XLSX from 'xlsx';

export interface ExcelClaimRow {
  name: string;
  adjuster: string;
  office: string;
  dateSigned: string | null;
  estimateOfLoss: number;
  revisedEstimateOfLoss: number;
}

// Map office codes to full names
const officeCodeMap: Record<string, string> = {
  'h': 'Houston',
  'H': 'Houston',
  'd': 'Dallas',
  'D': 'Dallas',
  'Houston': 'Houston',
  'Dallas': 'Dallas',
};

export async function parseExcelFromUrl(url: string): Promise<{ claims: ExcelClaimRow[], rawHeaders: string[], rawRows: any[][], officeColumn: { index: number, header: string, values: string[] } | null }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  
  // Look for "2025" sheet
  const sheetName = workbook.SheetNames.find(name => 
    name.includes('2025') || name.toLowerCase().includes('2025')
  ) || workbook.SheetNames[0];
  
  console.log('Available sheets:', workbook.SheetNames);
  console.log('Using sheet:', sheetName);
  
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  // Get all headers
  const headers = jsonData[0]?.map((h: any, idx: number) => String(h || `Column${idx}`).trim()) || [];
  const headersLower = headers.map(h => h.toLowerCase());
  
  console.log('All headers:', headers);
  
  // Find column indices
  let nameIdx = headersLower.findIndex(h => h.includes('name') || h.includes('insured'));
  let adjusterIdx = headersLower.findIndex(h => h.includes('adjuster'));
  let dateIdx = headersLower.findIndex(h => h.includes('date') && h.includes('signed'));
  let estimateIdx = headersLower.findIndex(h => 
    h.includes('estimate') && h.includes('loss') && !h.includes('revised')
  );
  let revisedIdx = headersLower.findIndex(h => h.includes('revised'));
  
  // Find office column by scanning ALL columns for H/D values
  let officeIdx = -1;
  let officeColumnInfo: { index: number, header: string, values: string[] } | null = null;
  
  // Log all columns and their first few values
  console.log('=== SCANNING ALL COLUMNS FOR H/D VALUES ===');
  for (let col = 0; col < headers.length; col++) {
    const values: string[] = [];
    for (let row = 1; row < Math.min(10, jsonData.length); row++) {
      const val = String(jsonData[row]?.[col] || '').trim();
      values.push(val);
    }
    const hdValues = values.filter(v => v.toUpperCase() === 'H' || v.toUpperCase() === 'D');
    console.log(`Column ${col} "${headers[col]}": ${values.join(', ')} | H/D count: ${hdValues.length}`);
    
    if (hdValues.length >= 3 && officeIdx === -1) {
      officeIdx = col;
      officeColumnInfo = { index: col, header: headers[col], values };
      console.log(`>>> Found office column at ${col}: ${headers[col]}`);
    }
  }
  
  // Defaults if not found
  if (nameIdx === -1) nameIdx = 0;
  if (adjusterIdx === -1) adjusterIdx = 1;
  if (dateIdx === -1) dateIdx = headersLower.findIndex(h => h.includes('date'));
  if (estimateIdx === -1) estimateIdx = headersLower.findIndex(h => h.includes('estimate'));
  if (revisedIdx === -1) revisedIdx = headersLower.findIndex(h => h.includes('revised'));
  
  console.log('Final column mapping:', { nameIdx, adjusterIdx, officeIdx, dateIdx, estimateIdx, revisedIdx });
  
  // Parse data rows
  const claims: ExcelClaimRow[] = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const name = String(row[nameIdx] || '').trim();
    if (!name || name.length < 2) continue;
    
    const adjuster = String(row[adjusterIdx] || '').trim();
    
    // Get office from detected column
    let rawOffice = officeIdx >= 0 ? String(row[officeIdx] || '').trim() : '';
    const office = officeCodeMap[rawOffice] || officeCodeMap[rawOffice.toUpperCase()] || 'Unknown';
    
    // Parse date
    let dateSigned: string | null = null;
    if (dateIdx >= 0 && row[dateIdx]) {
      const dateVal = row[dateIdx];
      if (typeof dateVal === 'number') {
        const date = XLSX.SSF.parse_date_code(dateVal);
        if (date) {
          dateSigned = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
      }
    }
    
    // Parse amounts
    const parseAmount = (val: any): number => {
      if (typeof val === 'number') return val;
      const str = String(val || '0').replace(/[$,\s]/g, '');
      return parseFloat(str) || 0;
    };
    
    const estimateOfLoss = parseAmount(row[estimateIdx]);
    const revisedEstimateOfLoss = parseAmount(row[revisedIdx]);
    
    if (estimateOfLoss === 0 && revisedEstimateOfLoss === 0) continue;
    
    claims.push({ name, adjuster, office, dateSigned, estimateOfLoss, revisedEstimateOfLoss });
  }
  
  return { claims, rawHeaders: headers, rawRows: jsonData.slice(0, 10), officeColumn: officeColumnInfo };
}

export function applyOfficeMapping(claims: ExcelClaimRow[], mapping: Record<string, string>): ExcelClaimRow[] {
  return claims.map(claim => ({
    ...claim,
    office: mapping[claim.adjuster] || claim.office
  }));
}
