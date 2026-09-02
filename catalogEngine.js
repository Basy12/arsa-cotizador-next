/**
 * ARSA Cotizador Next - Catalog Engine
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

function isIncludedPromotion(promotion) {
  if (promotion === null || promotion === undefined) {
    return false;
  }

  if (typeof promotion === 'object') {
    return (
      promotion.type === 'INCLUDED' ||
      (
        promotion.type === 'PRICE' &&
        Number(promotion.value) === 0
      )
    );
  }

  if (typeof promotion === 'number') {
    return promotion === 0;
  }

  if (typeof promotion === 'string') {
    return promotion.toUpperCase().includes('INCLUIDO');
  }

  return false;
}

export class CatalogEngine {
  constructor(initialCatalog = []) {
    this.catalog = [];
    this.brands = [];
    this.setCatalog(initialCatalog);
  }

  setCatalog(catalog = []) {
    this.catalog = Array.isArray(catalog) ? catalog : [];

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
    return this.catalog.find(
      device => String(device.id) === String(id)
    ) || null;
  }

  filterBrand(brandName = '') {
    const brand = normalizeText(brandName);

    if (!brand || brand === 'todas') {
      return [...this.catalog];
    }

    return this.catalog.filter(device =>
      normalizeText(device.brand) === brand
    );
  }

  isIncludedFor(device, planName, termMonths) {
    return isIncludedPromotion(
      device?.promos?.[planName]?.[termMonths]
    );
  }

  searchDevice(brandName = '', query = '', options = {}) {
    const {
      includedOnly = false,
      planName = '',
      termMonths = 36
    } = options;

    const terms = normalizeText(query)
      .split(' ')
      .filter(Boolean);

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
      const text = normalizeText(
        `${device.brand || ''} ${device.name || ''} ${device.id || ''}`
      );

      return terms.every(term => {
        if (/^\d+$/.test(term)) {
          return new RegExp(`\\b${term}\\b`).test(text);
        }

        return text.includes(term);
      });
    });
  }
}
