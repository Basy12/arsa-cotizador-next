/**
 * ARSA Cotizador Next - CatalogEngine
 * Motor de búsqueda, filtrado y selección de equipos.
 */

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
    const brand = String(brandName).trim().toUpperCase();

    if (!brand || brand === 'TODAS') {
      return [...this.catalog];
    }

    return this.catalog.filter(device =>
      String(device?.brand || '').trim().toUpperCase() === brand
    );
  }

  searchDevice(brand = '', query = '') {
    const normalizedQuery = String(query).trim().toLowerCase();
    const devices = this.filterBrand(brand);

    if (!normalizedQuery) {
      return devices;
    }

    return devices.filter(device => {
      const searchableText = [
        device?.brand || '',
        device?.name || '',
        device?.id || ''
      ].join(' ').toLowerCase();

      return searchableText.includes(normalizedQuery);
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
