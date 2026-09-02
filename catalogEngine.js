/**
 * ARSA Cotizador Next - Catalog Engine
 * Búsqueda estricta, filtrado por marca y filtro de equipos incluidos.
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

function matchesAllTerms(text, terms) {
  const normalized = normalizeText(text);
  return terms.every(term => normalized.includes(term));
}

function hasExactNumber(text, number) {
  const normalized = normalizeText(text);
  const expression = new RegExp(`\\b${number}\\b`);
  return expression.test(normalized);
}

export class CatalogEngine {
  constructor(initialCatalog = []) {
    this.catalog = [];
    this.brands = [];
    this.setCatalog(initialCatalog);
  }

  setCatalog(newCatalog = []) {
    this.catalog = Array.isArray(newCatalog) ? newCatalog : [];
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
   * Regresa true si el equipo tiene precio incluido ($0 / INCLUDED)
   * para el plan y plazo solicitados.
   *
   * Titanio se resuelve desde el motor comercial, por eso este filtro
   * se utiliza solamente para planes normales del Excel.
   */
  isIncludedFor(device, planName, termMonths) {
    const promo = device?.promos?.[planName]?.[termMonths];

    return (
      promo?.type === 'INCLUDED' ||
      (
        promo?.type === 'PRICE' &&
        Number(promo?.value) === 0
      )
    );
  }

  /**
   * Busca equipos por marca y texto.
   *
   * Si escribes solamente un número, como "17", busca el número como
   * un término individual y evita resultados como "117" o "170".
   */
  searchDevice(brandName = '', query = '', options = {}) {
    const {
      includedOnly = false,
      planName = '',
      termMonths = 36
    } = options;

    const terms = getTerms(query);

    let results = this.filterBrand(brandName);

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

      const numbersMatch = numericTerms.every(number =>
        hasExactNumber(searchableText, number)
      );

      const wordsMatch = matchesAllTerms(searchableText, textTerms);

      return numbersMatch && wordsMatch;
    });
  }
}
