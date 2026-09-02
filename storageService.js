/**
 * ARSA Cotizador Next - StorageService
 * Manejo de persistencia local y estado de la aplicacion
 */

export const STORAGE_KEYS = {
  CATALOG: 'arsa-cat-final-v1',
  STATE: 'arsa-v7'
};

export function saveCatalogData(catalog, meta = {}) {
  try {
    const payload = JSON.stringify({ catalog, meta });
    localStorage.setItem(STORAGE_KEYS.CATALOG, payload);
    return true;
  } catch (err) {
    console.error('Error al guardar catalogo en LocalStorage:', err);
    return false;
  }
}

export function loadCatalogData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.catalog)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Error al recuperar catalogo:', err);
    return null;
  }
}

export function saveFormState(formObject) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(formObject));
    return true;
  } catch (err) {
    console.error('Error al guardar estado de formulario:', err);
    return false;
  }
}

export function loadFormState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATE);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error al cargar estado del cotizador:', err);
    return null;
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEYS.STATE);
}