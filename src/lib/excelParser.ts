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
const officeMap: Record<string, string> = {
  'h': 'Houston',
  'H': 'Houston',
  'd': 'Dallas',
  'D': 'Dallas',
  'Houston': 'Houston',
  'Dallas': 'Dallas',
};

export async function parseExcelFromUrl(url: string): Promise<ExcelClaimRow[]> {
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
  
  // Log ALL headers and first 3 data rows for debugging
  console.log('=== EXCEL STRUCTURE ===');
  console.log('Row 0 (headers):', jsonData[0]);
  console.log('Row 1:', jsonData[1]);
  console.log('Row 2:', jsonData[2]);
  console.log('Row 3:', jsonData[3]);
  console.log('Total rows:', jsonData.length);
  console.log('Total columns:', jsonData[0]?.length);
  
  // Get headers
  const headers = jsonData[0]?.map((h: any) => String(h || '').trim()) || [];
  const headersLower = headers.map(h => h.toLowerCase());
  
  // Find column indices
  let nameIdx = -1;
  let adjusterIdx = -1;
  let officeIdx = -1;
  let dateIdx = -1;
  let estimateIdx = -1;
  let revisedIdx = -1;
  
  // Search headers for matches
  for (let i = 0; i < headersLower.length; i++) {
    const h = headersLower[i];
    console.log(`Column ${i}: "${headers[i]}"`);
    
    if (nameIdx === -1 && (h.includes('name') || h.includes('insured') || h.includes('claimant'))) {
      nameIdx = i;
    }
    if (adjusterIdx === -1 && (h.includes('adjuster') || h.includes('adj'))) {
      adjusterIdx = i;
    }
    if (officeIdx === -1 && (h.includes('office') || h.includes('location') || h.includes('loc') || h.includes('city'))) {
      officeIdx = i;
    }
    if (dateIdx === -1 && (h.includes('date') || h.includes('signed'))) {
      dateIdx = i;
    }
    if (estimateIdx === -1 && h.includes('estimate') && !h.includes('revised') && !h.includes('rev')) {
      estimateIdx = i;
    }
    if (revisedIdx === -1 && (h.includes('revised') || (h.includes('rev') && h.includes('est')))) {
      revisedIdx = i;
    }
  }
  
  // Scan ALL columns for H/D values if office not found
  if (officeIdx === -1) {
    console.log('Scanning for office column with H/D values...');
    for (let col = 0; col < (headers.length || 10); col++) {
      let hCount = 0;
      let dCount = 0;
      for (let row = 1; row < Math.min(20, jsonData.length); row++) {
        const val = String(jsonData[row]?.[col] || '').trim().toUpperCase();
        if (val === 'H') hCount++;
        if (val === 'D') dCount++;
      }
      console.log(`Column ${col}: H=${hCount}, D=${dCount}`);
      if (hCount >= 1 || dCount >= 1) {
        officeIdx = col;
        console.log('Found office column at index:', col);
        break;
      }
    }
  }
  
  // Default positions if not found
  if (nameIdx === -1) nameIdx = 0;
  if (adjusterIdx === -1) adjusterIdx = 1;
  if (estimateIdx === -1) estimateIdx = 3;
  if (revisedIdx === -1) revisedIdx = 4;
  
  console.log('Final column mapping:', { nameIdx, adjusterIdx, officeIdx, dateIdx, estimateIdx, revisedIdx });
  
  // Parse data rows
  const claims: ExcelClaimRow[] = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const name = String(row[nameIdx] || '').trim();
    if (!name || name.length < 2) continue;
    
    const adjuster = String(row[adjusterIdx] || '').trim();
    
    // Get office value
    let rawOffice = '';
    if (officeIdx >= 0 && officeIdx < row.length) {
      rawOffice = String(row[officeIdx] || '').trim();
    }
    const office = officeMap[rawOffice] || officeMap[rawOffice.toUpperCase()] || (rawOffice || 'Unknown');
    
    // Parse date
    let dateSigned: string | null = null;
    if (dateIdx >= 0 && row[dateIdx]) {
      const dateVal = row[dateIdx];
      if (typeof dateVal === 'number') {
        const date = XLSX.SSF.parse_date_code(dateVal);
        if (date) {
          dateSigned = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
      } else if (typeof dateVal === 'string') {
        const parsed = new Date(dateVal);
        if (!isNaN(parsed.getTime())) {
          dateSigned = parsed.toISOString().split('T')[0];
        }
      }
    }
    
    // Parse monetary values
    const parseAmount = (val: any): number => {
      if (typeof val === 'number') return val;
      const str = String(val || '0').replace(/[$,\s]/g, '');
      return parseFloat(str) || 0;
    };
    
    const estimateOfLoss = parseAmount(row[estimateIdx]);
    const revisedEstimateOfLoss = parseAmount(row[revisedIdx]);
    
    if (estimateOfLoss === 0 && revisedEstimateOfLoss === 0) continue;
    
    claims.push({
      name,
      adjuster,
      office,
      dateSigned,
      estimateOfLoss,
      revisedEstimateOfLoss,
    });
  }
  
  console.log(`Parsed ${claims.length} claims`);
  console.log('Sample claims:', claims.slice(0, 3));
  return claims;
}
