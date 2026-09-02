/**
 * ARSA Cotizador Next - CatalogEngine
 * Búsqueda estricta por nombre, marca, modelo e identificador.
 */

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function getSearchTerms(value = '') {
  return normalizeText(value)
    .replace(/[-_/.,]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

function containsAllTerms(text, terms) {
  const normalizedText = normalizeText(text);
  return terms.every(term => normalizedText.includes(term));
}

function containsModelNumber(text, number) {
  const normalizedText = normalizeText(text);

  const expressions = [
    new RegExp(`\\b${number}\\b`),
    new RegExp(`iphone\\s*${number}\\b`),
    new RegExp(`galaxy\\s*${number}\\b`),
    new RegExp(`samsung\\s*${number}\\b`),
    new RegExp(`redmi\\s*${number}\\b`),
    new RegExp(`note\\s*${number}\\b`),
    new RegExp(`edge\\s*${number}\\b`)
  ];

  return expressions.some(expression => expression.test(normalizedText));
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

  filterBrand(brandName = '') {
    const brand = normalizeText(brandName);

    if (!brand || brand === 'todas') {
      return [...this.catalog];
    }

    return this.catalog.filter(device =>
      normalizeText(device?.brand) === brand
    );
  }

  searchDevice(brand = '', query = '') {
    const devices = this.filterBrand(brand);
    const normalizedQuery = normalizeText(query);
    const terms = getSearchTerms(query);

    if (!normalizedQuery) {
      return devices;
    }

    // Si la búsqueda es solamente numérica, debe coincidir
    // con ese número exacto y no con otros números.
    if (/^\d+$/.test(normalizedQuery)) {
      return devices.filter(device => {
        const fullName = `${device?.brand || ''} ${device?.name || ''}`;
        return containsModelNumber(fullName, normalizedQuery);
      });
    }

    // Si la búsqueda contiene un modelo numérico,
    // todos los términos deben coincidir.
    const hasNumber = terms.some(term => /^\d+$/.test(term));

    if (hasNumber) {
      return devices.filter(device => {
        const fullName = `${device?.brand || ''} ${device?.name || ''}`;
        return containsAllTerms(fullName, terms);
      });
    }

    // Para búsquedas de texto, todos los términos deben coincidir.
    return devices.filter(device => {
      const fullName = `${device?.brand || ''} ${device?.name || ''}`;
      return containsAllTerms(fullName, terms);
    });
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
}
