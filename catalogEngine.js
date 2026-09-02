/**
 * ARSA Cotizador Next - Catalog Engine
 * Búsqueda estricta por nombre comercial del equipo.
 *
 * Regla principal:
 * - Si buscas "17", solo se muestran equipos que tengan el token 17.
 * - Un iPhone 16 nunca puede aparecer en los resultados de "17".
 * - El ID interno no participa en la búsqueda.
 */

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[-_/.,()]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function tokenize(value = '') {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean);
}

function isIncludedPromotion(promotion) {
  if (promotion === null || promotion === undefined) {
    return false;
  }

  if (typeof promotion === 'object') {
    const type = String(promotion.type || '').toUpperCase();
    const value = Number(promotion.value);

    return (
      type === 'INCLUDED' ||
      (type === 'PRICE' && Number.isFinite(value) && value === 0)
    );
  }

  if (typeof promotion === 'number') {
    return promotion === 0;
  }

  if (typeof promotion === 'string') {
    const normalized = promotion
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();

    return (
      normalized.includes('INCLUIDO') ||
      normalized === '0' ||
      normalized === '$0' ||
      normalized === '$0.00'
    );
  }

  return false;
}

/**
 * Evalúa que CADA término de búsqueda exista como token individual.
 *
 * Ejemplo:
 * query: "17"
 * name: "Apple iPhone 17 256GB" -> true
 * name: "Apple iPhone 16 128GB" -> false
 *
 * query: "17 pro 256"
 * name: "Apple iPhone 17 Pro 256GB" -> true
 */
function matchesStrictTerms(device, queryTerms) {
  if (!queryTerms.length) {
    return true;
  }

  const searchable = [
    device?.brand || '',
    device?.name || ''
  ].join(' ');

  const deviceTokens = new Set(tokenize(searchable));

  return queryTerms.every(term => {
    /*
     * Si es numérico, requiere coincidencia exacta.
     * 17 no coincide con 16, 117, 170 ni 51217.
     */
    if (/^\d+$/.test(term)) {
      return deviceTokens.has(term);
    }

    /*
     * Para palabras, permite que el token comience con lo escrito:
     * "iph" encuentra "iphone"
     * "sam" encuentra "samsung"
     * "pro" encuentra "pro"
     */
    return [...deviceTokens].some(token =>
      token.startsWith(term)
    );
  });
}

export class CatalogEngine {
  constructor(initialCatalog = []) {
    this.catalog = [];
    this.brands = [];

    this.setCatalog(initialCatalog);
  }

  setCatalog(catalog = []) {
    this.catalog = Array.isArray(catalog)
      ? catalog
      : [];

    this.brands = [
      ...new Set(
        this.catalog
          .map(device => String(device?.brand || '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, 'es-MX'));
  }

  getBrands() {
    return [...this.brands];
  }

  getDeviceById(id) {
    return this.catalog.find(device =>
      String(device?.id) === String(id)
    ) || null;
  }

  getDeviceByIndex(index) {
    const safeIndex = Number(index);

    return Number.isInteger(safeIndex)
      ? this.catalog[safeIndex] || null
      : null;
  }

  filterBrand(brandName = '') {
    const normalizedBrand = normalizeText(brandName);

    if (!normalizedBrand || normalizedBrand === 'todas') {
      return [...this.catalog];
    }

    return this.catalog.filter(device =>
      normalizeText(device?.brand) === normalizedBrand
    );
  }

  isIncludedFor(device, planName, termMonths) {
    const promotion = device?.promos?.[planName]?.[termMonths];

    return isIncludedPromotion(promotion);
  }

  searchDevice(brandName = '', query = '', options = {}) {
    const {
      includedOnly = false,
      planName = '',
      termMonths = 36
    } = options;

    const queryTerms = tokenize(query);

    let devices = this.filterBrand(brandName);

    if (includedOnly) {
      devices = devices.filter(device =>
        this.isIncludedFor(device, planName, termMonths)
      );
    }

    const results = devices.filter(device =>
      matchesStrictTerms(device, queryTerms)
    );

    /*
     * Ordena los resultados:
     * - El nombre que inicia exactamente con la búsqueda aparece primero.
     * - Después, orden alfabético.
     */
    const normalizedQuery = normalizeText(query);

    return results.sort((a, b) => {
      const aName = normalizeText(`${a.brand} ${a.name}`);
      const bName = normalizeText(`${b.brand} ${b.name}`);

      const aStarts = normalizedQuery && aName.includes(normalizedQuery) ? 0 : 1;
      const bStarts = normalizedQuery && bName.includes(normalizedQuery) ? 0 : 1;

      if (aStarts !== bStarts) {
        return aStarts - bStarts;
      }

      return aName.localeCompare(bName, 'es-MX');
    });
  }
}
