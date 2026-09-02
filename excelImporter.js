/**
 * ARSA Cotizador Next - Excel Importer
 * Mantiene el Excel como fuente de verdad comercial.
 */

export const CAT_PLANS = [
  'Azul 1',
  'Azul 2',
  'Azul 3',
  'Plata',
  'Oro',
  'Black',
  'Platino',
  'Diamante'
];

export const TERMS_N = [24, 30, 36];

export const PLAN_COLUMNS = {
  'Azul 1': ['H', 'I', 'J'],
  'Azul 2': ['K', 'L', 'M'],
  'Azul 3': ['N', 'O', 'P'],
  'Plata': ['Q', 'R', 'S'],
  'Oro': ['T', 'U', 'V'],
  'Black': ['W', 'X', 'Y'],
  'Platino': ['Z', 'AA', 'AB'],
  'Diamante': ['AC', 'AD', 'AE']
};

export function cleanString(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function parseCommercialValue(value) {
  const raw = cleanString(value);
  const normalized = raw.toUpperCase();

  if (!raw) {
    return {
      type: 'MISSING',
      raw,
      value: null
    };
  }

  if (/^N\/?A$/.test(normalized) || normalized === 'NA') {
    return {
      type: 'NOT_AVAILABLE',
      raw,
      value: null
    };
  }

  if (normalized.includes('INCLUIDO')) {
    return {
      type: 'INCLUDED',
      raw,
      value: 0
    };
  }

  const numeric = typeof value === 'number'
    ? value
    : Number(raw.replace(/[^\d.-]/g, ''));

  if (!Number.isFinite(numeric)) {
    return {
      type: 'INVALID',
      raw,
      value: null
    };
  }

  return {
    type: 'PRICE',
    raw,
    value: Math.round(numeric * 100) / 100
  };
}

export function parsePriceValue(value) {
  return parseCommercialValue(value).value;
}

export function extractBrand(name) {
  return cleanString(name).split(' ')[0].toUpperCase();
}

export function validateWorkbook(workbook) {
  if (!workbook?.SheetNames?.length) {
    throw new Error('El archivo Excel no contiene hojas válidas.');
  }

  const baseSheet = workbook.SheetNames.find(
    name => name.trim() === '1.- base AT&T Premium'
  );

  if (!baseSheet) {
    throw new Error(
      'No se encontró la hoja requerida: "1.- base AT&T Premium".'
    );
  }

  return baseSheet;
}

export function extractCatalog(workbook) {
  const sheetName = validateWorkbook(workbook);
  const worksheet = workbook.Sheets[sheetName];

  const range = window.XLSX.utils.decode_range(
    worksheet['!ref'] || 'A1:BZ200'
  );

  const cell = (column, row) => worksheet[`${column}${row}`]?.v ?? null;

  for (const plan of CAT_PLANS) {
    const firstColumn = PLAN_COLUMNS[plan][0];
    const header = cleanString(cell(firstColumn, 12));

    if (!header.toLowerCase().startsWith(plan.toLowerCase())) {
      throw new Error(
        `No se pudo validar el encabezado del plan ${plan} en ${firstColumn}12.`
      );
    }
  }

  const catalog = [];

  for (let row = 15; row <= range.e.r + 1; row += 1) {
    const id = cleanString(cell('B', row));
    const status = cleanString(cell('C', row));
    const rawBrand = cleanString(cell('E', row));
    const name = cleanString(cell('F', row));

    const listCommercial = parseCommercialValue(cell('G', row));

    if (!name || listCommercial.value === null) {
      continue;
    }

    const brand = rawBrand
      ? rawBrand.toUpperCase()
      : extractBrand(name);

    const promos = {};

    for (const plan of CAT_PLANS) {
      promos[plan] = {};

      PLAN_COLUMNS[plan].forEach((column, index) => {
        const term = TERMS_N[index];

        promos[plan][term] = parseCommercialValue(cell(column, row));
      });
    }

    const insuranceCommercial = parseCommercialValue(cell('BS', row));

    catalog.push({
      id: id || `DEV-${row}`,
      name,
      brand,
      list: listCommercial.value,
      listCommercial,
      insurance: insuranceCommercial.value || 0,
      insuranceCommercial,
      promos,
      validity: cleanString(cell('AH', row)),
      status: status || 'ACTIVO'
    });
  }

  if (!catalog.length) {
    throw new Error('No se encontraron equipos utilizables en el catálogo.');
  }

  const priceSheetName = workbook.SheetNames.find(name =>
    name.includes('LISTA DE PRECIOS')
  );

  const updated = priceSheetName
    ? workbook.Sheets[priceSheetName]?.J3?.v || null
    : null;

  return {
    catalog,
    meta: {
      updated,
      count: catalog.length,
      importedAt: new Date().toISOString()
    }
  };
}

export function loadWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo Excel.'));
    };

    reader.onload = event => {
      try {
        const workbook = window.XLSX.read(event.target.result, {
          type: 'array',
          cellDates: true
        });

        resolve({
          ...extractCatalog(workbook),
          fileName: file.name
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
