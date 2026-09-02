/**
 * ARSA Cotizador Next - CatalogEngine
 * Búsqueda, filtrado y selección de equipos.
 *
 * La búsqueda normaliza acentos, mayúsculas, signos y espacios.
 * Ejemplos equivalentes:
 * - "iphone 17 pro"
 * - "iPhone-17 Pro"
 * - "IPHONE 17 PRO"
 * - "iphone17pro"
 */

function normalizeSearchText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compactSearchText(value = '') {
  return normalizeSearchText(value).replace(/\s+/g, '');
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
    const brand = normalizeSearchText(brandName);

    if (!brand || brand === 'todas') {
      return [...this.catalog];
    }

    return this.catalog.filter(device =>
      normalizeSearchText(device?.brand) === brand
    );
  }

  /**
   * Búsqueda inteligente con prioridad:
   * 1. Coincidencia exacta de nombre.
   * 2. Coincidencia exacta ignorando espacios, guiones y signos.
   * 3. El nombre empieza con la búsqueda.
   * 4. Todos los términos aparecen en el nombre, sin importar orden o separadores.
   * 5. Coincidencia parcial como último recurso.
   */
  searchDevice(brand = '', query = '') {
    const devices = this.filterBrand(brand);
    const normalizedQuery = normalizeSearchText(query);
    const compactQuery = compactSearchText(query);

    if (!normalizedQuery) {
      return devices;
    }

    const queryTerms = normalizedQuery.split(' ').filter(Boolean);

    const ranked = devices
      .map(device => {
        const name = String(device?.name || '');
        const deviceBrand = String(device?.brand || '');
        const id = String(device?.id || '');

        const normalizedName = normalizeSearchText(name);
        const normalizedFull = normalizeSearchText(`${deviceBrand} ${name}`);
        const normalizedId = normalizeSearchText(id);
        const compactName = compactSearchText(name);
        const compactFull = compactSearchText(`${deviceBrand} ${name}`);
        const compactId = compactSearchText(id);

        let score = 0;

        if (normalizedName === normalizedQuery) score = 1000;
        else if (normalizedFull === normalizedQuery) score = 990;
        else if (compactName === compactQuery) score = 980;
        else if (compactFull === compactQuery) score = 970;
        else if (normalizedId === normalizedQuery || compactId === compactQuery) score = 960;
        else if (normalizedName.startsWith(normalizedQuery)) score = 900;
        else if (normalizedFull.startsWith(normalizedQuery)) score = 890;
        else if (compactName.startsWith(compactQuery)) score = 880;
        else if (queryTerms.every(term => normalizedFull.includes(term))) score = 800;
        else if (normalizedFull.includes(normalizedQuery)) score = 700;
        else if (compactFull.includes(compactQuery)) score = 690;
        else if (queryTerms.some(term => normalizedFull.includes(term))) score = 100;

        return { device, score, name: normalizedName };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.localeCompare(b.name, 'es-MX');
      });

    return ranked.map(item => item.device);
  }

  getDeviceById(id) {
    return this.catalog.find(device =>
      String(device?.id) === String(id)
    ) || null;
  }

  getDeviceByIndex(index) {
    const safeIndex = Number(index);
    return Number.isInteger(safeIndex) ? this.catalog[safeIndex] || null : null;
  }
}
