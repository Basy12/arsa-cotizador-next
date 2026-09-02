/**
 * ARSA Cotizador Next - Catalog Engine
 * Búsqueda estricta, filtrado por marca y filtro de equipos incluidos.
 *
 * Compatibilidad:
 * - Promociones importadas con estructura:
 *   { type: 'INCLUDED' | 'PRICE' | 'NOT_AVAILABLE' | 'MISSING', value, raw }
 * - Catálogos antiguos que pudieran guardar números o strings directamente.
 */

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[-_/.,]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function getTerms(value = '') {
  return normalizeText(value)
    .split(' ')
    .filter(Boolean);
}

function matchesAllTerms(text, terms = []) {
  const normalizedText = normalizeText(text);

  return terms.every(term => normalizedText.includes(term));
}

function hasExactNumber(text, number) {
  const normalizedText = normalizeText(text);
  const expression = new RegExp(`\\b${number}\\b`);

  return expression.test(normalizedText);
}

function isIncludedPromotion(promotion) {
  if (promotion === null || promotion === undefined) {
    return false;
  }

  /*
   * Catálogo nuevo:
   * {
   *   type: 'INCLUDED',
   *   value: 0,
   *   raw: 'INCLUIDO'
   * }
   */
  if (typeof promotion === 'object') {
    const type = String(promotion.type || '').toUpperCase();
    const value = Number(promotion.value);

    return (
      type === 'INCLUDED' ||
      (type === 'PRICE' && Number.isFinite(value) && value === 0)
    );
  }

  /*
   * Compatibilidad con catálogos antiguos:
   * 0 numérico.
   */
  if (typeof promotion === 'number') {
    return promotion === 0;
  }

  /*
   * Compatibilidad con texto directo:
   * 'INCLUIDO', '$0', '0', etc.
   */
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

export class CatalogEngine {
  constructor(initialCatalog = []) {
    this.catalog = [];
    this.brands = [];

    this.setCatalog(initialCatalog);
  }

  setCatalog(newCatalog = []) {
    this.catalog = Array.isArray(newCatalog)
      ? newCatalog
      : [];

    this.brands = this.extractUniqueBrands(this.catalog);
  }

  extractUniqueBrands(catalog = []) {
    return [...new Set(
      catalog
        .map(device => String(device?.brand || '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es-MX'));
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

    if (!Number.isInteger(safeIndex)) {
      return null;
    }

    return this.catalog[safeIndex] || null;
  }

  filterBrand(brandName = '') {
    const brand = normalizeText(brandName);

    if (!brand || brand === 'todas') {
      return [...this.catalog];
    }

    return this.catalog.filter(device =>
      normalizeText(device?.brand) === brand
    );
  }

  /**
   * Devuelve true únicamente cuando la promoción del equipo,
   * para el plan y plazo seleccionados, sea INCLUIDO o precio $0.
   *
   * IMPORTANTE:
   * - N/A no es incluido.
   * - Celda vacía no es incluido.
   * - Precio numérico distinto de $0 no es incluido.
   */
  isIncludedFor(device, planName, termMonths) {
    const promotion = device?.promos?.[planName]?.[termMonths];

    return isIncludedPromotion(promotion);
  }

  /**
   * Busca dispositivos usando:
   * - Marca.
   * - Texto de búsqueda.
   * - Filtro opcional "Solo equipos incluidos".
   *
   * Ejemplos:
   * searchDevice('APPLE', '17 256', {
   *   includedOnly: false,
   *   planName: 'Plata',
   *   termMonths: 36
   * });
   */
  searchDevice(brandName = '', query = '', options = {}) {
    const {
      includedOnly = false,
      planName = '',
      termMonths = 36
    } = options;

    const terms = getTerms(query);

    let results = this.filterBrand(brandName);

    /*
     * Filtro "Solo equipos incluidos".
     *
     * Solo devuelve equipos cuyo valor exacto en Excel para
     * plan + plazo diga INCLUIDO o corresponda al valor $0.
     */
    if (includedOnly) {
      results = results.filter(device =>
        this.isIncludedFor(device, planName, termMonths)
      );
    }

    if (!terms.length) {
      return results;
    }

    return results.filter(device => {
      const searchableText = [
        device?.brand || '',
        device?.name || '',
        device?.id || ''
      ].join(' ');

      const numericTerms = terms.filter(term => /^\d+$/.test(term));
      const textTerms = terms.filter(term => !/^\d+$/.test(term));

      /*
       * Si escribes "17", debe coincidir como número completo.
       * Así no encuentra equipos con 117, 170 o 2017 por error.
       */
      const numbersMatch = numericTerms.every(number =>
        hasExactNumber(searchableText, number)
      );

      /*
       * Texto como:
       * "iphone pro"
       * "honor x5d"
       * "samsung galaxy"
       *
       * Todos los términos deben existir.
       */
      const wordsMatch = matchesAllTerms(searchableText, textTerms);

      return numbersMatch && wordsMatch;
    });
  }
}
