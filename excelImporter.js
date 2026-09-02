/**
 * ARSA Cotizador Next - Excel Importer
 * Excel es la fuente de verdad comercial.
 *
 * Hojas:
 * - 1.- base AT&T Premium
 *
 * Columnas:
 * - B  : ID
 * - C  : Estatus
 * - E  : Marca
 * - F  : Equipo
 * - G  : Precio de lista
 * - AH : Vigencia
 * - BS : Seguro
 *
 * Promociones:
 * - Azul 1: H, I, J
 * - Azul 2: K, L, M
 * - Azul 3: N, O, P
 * - Plata : Q, R, S
 * - Oro   : T, U, V
 * - Black : W, X, Y
 * - Platino: Z, AA, AB
 * - Diamante: AC, AD, AE
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

export function cleanString(value = '') {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Interpreta correctamente:
 * - INCLUIDO
 * - N/A / NA
 * - Precio numérico
 * - Celda vacía
 */
export function parseCommercialValue(value) {
  const raw = cleanString(value);

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (!raw) {
    return {
      type: 'MISSING',
      value: null,
      raw: ''
    };
  }

  if (
    normalized === 'N/A' ||
    normalized === 'NA' ||
    normalized === 'N / A' ||
    normalized === 'N.A.'
  ) {
    return {
      type: 'NOT_AVAILABLE',
      value: null,
      raw
    };
  }

  if (normalized.includes('INCLUIDO')) {
    return {
      type: 'INCLUDED',
      value: 0,
      raw
    };
  }

  let numericValue;

  if (typeof value === 'number' && Number.isFinite(value)) {
    numericValue = value;
  } else {
    /*
     * Manejo de formatos del Excel, por ejemplo:
     * 1.234,56
     * 1,234.56
     * $ 1,234.56
     * 14989.25
     */
    const clean = raw
      .replace(/\$/g, '')
      .replace(/\s/g, '');

    const hasDot = clean.includes('.');
    const hasComma = clean.includes(',');

    let normalizedNumber = clean;

    if (hasDot && hasComma) {
      /*
       * Si la última coma está después del último punto,
       * se asume formato mexicano/europeo: 1.234,56
       */
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        normalizedNumber = clean
          .replace(/\./g, '')
          .replace(',', '.');
      } else {
        /*
         * Formato americano: 1,234.56
         */
        normalizedNumber = clean.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      /*
       * Si hay una sola coma con 1 o 2 decimales:
       * 331,60 → 331.60
       */
      const parts = clean.split(',');

      normalizedNumber =
        parts.length === 2 && parts[1].length <= 2
          ? `${parts[0]}.${parts[1]}`
          : clean.replace(/,/g, '');
    } else {
      normalizedNumber = clean.replace(/,/g, '');
    }

    numericValue = Number(normalizedNumber);
  }

  if (!Number.isFinite(numericValue)) {
    return {
      type: 'INVALID',
      value: null,
      raw
    };
  }

  return {
    type: 'PRICE',
    value: Math.round(numericValue * 100) / 100,
    raw
  };
}

export function parsePriceValue(value) {
  return parseCommercialValue(value).value;
}

export function extractBrand(deviceName = '') {
  return cleanString(deviceName)
    .split(' ')[0]
    .toUpperCase();
}

export function validateWorkbook(workbook) {
  if (!workbook?.SheetNames?.length) {
    throw new Error('El archivo no contiene hojas válidas.');
  }

  const baseSheetName = workbook.SheetNames.find(
    sheetName => sheetName.trim() === '1.- base AT&T Premium'
  );

  if (!baseSheetName) {
    throw new Error(
      'No se encontró la hoja "1.- base AT&T Premium".'
    );
  }

  return baseSheetName;
}

export function extractCatalog(workbook) {
  const baseSheetName = validateWorkbook(workbook);
  const worksheet = workbook.Sheets[baseSheetName];

  if (!worksheet) {
    throw new Error('No fue posible abrir la hoja principal del Excel.');
  }

  const range = window.XLSX.utils.decode_range(
    worksheet['!ref'] || 'A1:BZ500'
  );

  const cell = (column, row) => {
    return worksheet[`${column}${row}`]?.v ?? null;
  };

  /*
   * Valida que los encabezados comerciales sigan en la fila 12.
   */
  for (const planName of CAT_PLANS) {
    const firstColumn = PLAN_COLUMNS[planName][0];
    const header = cleanString(cell(firstColumn, 12));

    if (!header.toLowerCase().startsWith(planName.toLowerCase())) {
      throw new Error(
        `No se pudo validar el encabezado del plan "${planName}" en ${firstColumn}12.`
      );
    }
  }

  const catalog = [];

  for (let row = 15; row <= range.e.r + 1; row += 1) {
    const id = cleanString(cell('B', row));
    const status = cleanString(cell('C', row));
    const excelBrand = cleanString(cell('E', row));
    const name = cleanString(cell('F', row));

    const listCommercial = parseCommercialValue(cell('G', row));

    /*
     * Solo ignorar filas sin equipo o sin precio lista válido.
     */
    if (!name || listCommercial.value === null) {
      continue;
    }

    const promos = {};

    for (const planName of CAT_PLANS) {
      promos[planName] = {};

      PLAN_COLUMNS[planName].forEach((column, index) => {
        const term = TERMS_N[index];

        promos[planName][term] = parseCommercialValue(
          cell(column, row)
        );
      });
    }

    const insuranceCommercial = parseCommercialValue(cell('BS', row));

    catalog.push({
      id: id || `DEV-${row}`,
      name,
      brand: excelBrand
        ? excelBrand.toUpperCase()
        : extractBrand(name),

      list: listCommercial.value,
      listCommercial,

      insurance:
        insuranceCommercial.type === 'PRICE'
          ? insuranceCommercial.value
          : 0,

      insuranceCommercial,

      promos,

      validity: cleanString(cell('AH', row)),
      status: status || 'SIN ESTATUS'
    });
  }

  if (!catalog.length) {
    throw new Error(
      'No se encontraron equipos utilizables. Revisa que el Excel conserve la estructura esperada.'
    );
  }

  const priceListSheet = workbook.SheetNames.find(name =>
    name.toUpperCase().includes('LISTA DE PRECIOS')
  );

  const updated = priceListSheet
    ? workbook.Sheets[priceListSheet]?.J3?.v || null
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
    if (!file) {
      reject(new Error('Selecciona un archivo Excel.'));
      return;
    }

    if (!window.XLSX) {
      reject(
        new Error(
          'La librería XLSX no cargó. Revisa tu conexión a internet e intenta nuevamente.'
        )
      );
      return;
    }

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

        const result = extractCatalog(workbook);

        resolve({
          ...result,
          fileName: file.name
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
