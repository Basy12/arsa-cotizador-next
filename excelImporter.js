/**
 * ARSA Cotizador Next - ExcelImporter
 * Lector e interprete del catalogo comercial AT&T / Titanio
 */

export const CAT_PLANS = ['Azul 1', 'Azul 2', 'Azul 3', 'Plata', 'Oro', 'Black', 'Platino', 'Diamante'];
export const TERMS_N = [24, 30, 36];

export const PLAN_COLUMNS = {
  'Azul 1': ['H', 'I', 'J'],
  'Azul 2': ['K', 'L', 'M'],
  'Azul 3': ['N', 'O', 'P'],
  'Plata':  ['Q', 'R', 'S'],
  'Oro':    ['T', 'U', 'V'],
  'Black':  ['W', 'X', 'Y'],
  'Platino':['Z', 'AA', 'AB'],
  'Diamante':['AC', 'AD', 'AE']
};

export function cleanString(val) {
  return String(val ?? '').trim().replace(/\s+/g, ' ');
}

export function parsePriceValue(val) {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.round(val * 100) / 100;
  }
  const str = String(val ?? '').trim();
  if (!str || /^N\/?A$/i.test(str)) return null;
  if (/INCLUIDO/i.test(str)) return 0;
  const num = Number(str.replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
}

export function extractBrand(fullName) {
  const clean = cleanString(fullName);
  return clean.split(' ')[0].toUpperCase();
}

export function validateWorkbook(workbook) {
  if (!workbook || !workbook.SheetNames || !workbook.SheetNames.length) {
    throw new Error('El archivo Excel no contiene hojas validas.');
  }
  const baseSheet = workbook.SheetNames.find(n => n.trim() === '1.- base AT&T Premium');
  if (!baseSheet) {
    throw new Error('No se encontro la hoja requerida: "1.- base AT&T Premium".');
  }
  return baseSheet;
}

export function extractCatalog(workbook) {
  const baseSheetName = validateWorkbook(workbook);
  const ws = workbook.Sheets[baseSheetName];
  const range = window.XLSX.utils.decode_range(ws['!ref'] || 'A1:BZ200');

  const cell = (col, row) => ws[`${col}${row}`]?.v ?? null;

  // Validacion de encabezados
  for (const plan of CAT_PLANS) {
    const colH = PLAN_COLUMNS[plan][0];
    const headerVal = String(cell(colH, 12) || '');
    if (!headerVal.toLowerCase().startsWith(plan.toLowerCase())) {
      throw new Error(`Encabezado no coincide para el plan ${plan} en la celda ${colH}12.`);
    }
  }

  const catalog = [];
  for (let row = 15; row <= range.e.r + 1; row++) {
    const id = cleanString(cell('B', row));
    const status = cleanString(cell('C', row));
    const rawBrand = cleanString(cell('E', row));
    const name = cleanString(cell('F', row));
    const listPrice = parsePriceValue(cell('G', row));

    if (!name || listPrice === null) continue;

    const brand = rawBrand ? rawBrand.toUpperCase() : extractBrand(name);

    const promos = {};
    for (const plan of CAT_PLANS) {
      promos[plan] = {};
      const cols = PLAN_COLUMNS[plan];
      TERMS_N.forEach((term, idx) => {
        promos[plan][term] = parsePriceValue(cell(cols[idx], row));
      });
    }

    catalog.push({
      id: id || `DEV-${row}`,
      name,
      brand,
      list: listPrice,
      insurance: parsePriceValue(cell('BS', row)),
      promos,
      validity: cleanString(cell('AH', row)),
      status: status || 'ACTIVO'
    });
  }

  if (!catalog.length) {
    throw new Error('No se encontraron registros de equipos utilizables en el catalogo.');
  }

  let updatedDate = null;
  const listSheetName = workbook.SheetNames.find(n => n.includes('LISTA DE PRECIOS'));
  if (listSheetName) {
    const vws = workbook.Sheets[listSheetName];
    updatedDate = vws['J3']?.v || null;
  }

  return {
    catalog,
    meta: {
      updated: updatedDate,
      count: catalog.length,
      importedAt: new Date().toISOString()
    }
  };
}

export function loadWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error de lectura fisica del archivo Excel.'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
        const result = extractCatalog(workbook);
        resolve({ ...result, fileName: file.name });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}