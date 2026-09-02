/**
 * ARSA Cotizador Next - Controlador Principal (app.js)
 * Orquesta todos los módulos y maneja la interactividad de la UI
 */

import { CatalogEngine } from './catalogEngine.js';
import { loadWorkbook } from './excelImporter.js';

import {
  calculatePromotion,
  calculateTotal,
  formatMXN
} from './quoteEngine.js';

import {
  saveCatalogData,
  loadCatalogData,
  saveFormState,
  loadFormState
} from './storageService.js';

import { resolvePlanTheme } from './planThemes.js';

// Instancia global del motor de catálogo
export const catalogEngine = new CatalogEngine();

// Referencias DOM - Panel Izquierdo
export const elements = {
  excelFileInput: null,
  catalogStatus: null,
  brandSelect: null,
  deviceSearch: null,
  deviceSelect: null,
  planSelect: null,
  termSelect: null,
  downPaymentInput: null,
  portabilityToggle: null,
  insuranceToggle: null,
  controlToggle: null,
  
  // Ficha técnica
  cardPlanBand: null,
  cardTotalBand: null,
  cardPlanTitle: null,
  cardPlanTerm: null,
  cardPlanPrice: null,
  cardDeviceBrand: null,
  cardDeviceName: null,
  cardValidity: null,
  cardListPrice: null,
  cardPromoPrice: null,
  cardDownPayment: null,
  cardBalance: null,
  cardTotalMonthly: null,
  cardSavingsLabel: null,
  
  // Cliente
  clientNameInput: null,
  clientPhoneInput: null,
  
  // Operaciones
  operationSelect: null,
  
  // Botones
  btnExportPNG: null,
  btnExportPDF: null
};

// Estado de la aplicación
export const appState = {
  selectedDevice: null,
  selectedPlan: null,
  selectedTerm: 36,
  isTitanio: false
};

/**
 * Inicializa la aplicación
 */
export function init() {
  // Capturar referencias DOM
  elements.excelFileInput = document.getElementById('excelFileInput');
  elements.catalogStatus = document.getElementById('catalogStatus');
  elements.brandSelect = document.getElementById('brandSelect');
  elements.deviceSearch = document.getElementById('deviceSearch');
  elements.deviceSelect = document.getElementById('deviceSelect');
  elements.planSelect = document.getElementById('planSelect');
  elements.termSelect = document.getElementById('termSelect');
  elements.downPaymentInput = document.getElementById('downPaymentInput');
  elements.portabilityToggle = document.getElementById('portabilityToggle');
  elements.insuranceToggle = document.getElementById('insuranceToggle');
  elements.controlToggle = document.getElementById('controlToggle');
  
  elements.cardPlanBand = document.getElementById('planBand');
  elements.cardTotalBand = document.getElementById('totalBand');
  elements.cardPlanTitle = document.getElementById('cardPlanTitle');
  elements.cardPlanTerm = document.getElementById('cardPlanTerm');
  elements.cardPlanPrice = document.getElementById('cardPlanPrice');
  elements.cardDeviceBrand = document.getElementById('cardDeviceBrand');
  elements.cardDeviceName = document.getElementById('cardDeviceName');
  elements.cardValidity = document.getElementById('cardValidity');
  elements.cardListPrice = document.getElementById('cardListPrice');
  elements.cardPromoPrice = document.getElementById('cardPromoPrice');
  elements.cardDownPayment = document.getElementById('cardDownPayment');
  elements.cardBalance = document.getElementById('cardBalance');
  elements.cardTotalMonthly = document.getElementById('cardTotalMonthly');
  elements.cardSavingsLabel = document.getElementById('cardSavingsLabel');
  
  elements.clientNameInput = document.getElementById('clientNameInput');
  elements.clientPhoneInput = document.getElementById('clientPhoneInput');
  elements.operationSelect = document.getElementById('operationSelect');
  
  elements.btnExportPNG = document.getElementById('btnExportPNG');
  elements.btnExportPDF = document.getElementById('btnExportPDF');
  
  // Cargar catálogo guardado
  const cached = loadCatalogData();
  if (cached && cached.catalog) {
    catalogEngine.setCatalog(cached.catalog);
    elements.catalogStatus.textContent = `Catalizado: ${cached.catalog.length} equipos (${cached.meta?.fileName || 'Guardado'}).`;
    populateBrands();
    populateDevices();
  }
  
  // Cargar estado del formulario
  const savedState = loadFormState();
  if (savedState) {
    if (savedState.brand) elements.brandSelect.value = savedState.brand;
    if (savedState.search) elements.deviceSearch.value = savedState.search;
    if (savedState.deviceId) elements.deviceSelect.value = savedState.deviceId;
    if (savedState.plan) elements.planSelect.value = savedState.plan;
    if (savedState.term) elements.termSelect.value = savedState.term;
    if (savedState.downPayment) elements.downPaymentInput.value = savedState.downPayment;
    if (savedState.portability !== undefined) elements.portabilityToggle.checked = savedState.portability;
    if (savedState.insurance !== undefined) elements.insuranceToggle.checked = savedState.insurance;
    if (savedState.control !== undefined) elements.controlToggle.checked = savedState.control;
    if (savedState.clientName) elements.clientNameInput.value = savedState.clientName;
    if (savedState.clientPhone) elements.clientPhoneInput.value = savedState.clientPhone;
    if (savedState.operation) elements.operationSelect.value = savedState.operation;
  }
  
  // Renderizar cotizacion inicial
  renderQuote();
  
  // Configurar event listeners
  setupEventListeners();
}

/**
 * Configura todos los listeners de eventos
 */
function setupEventListeners() {
  elements.excelFileInput.addEventListener('change', handleFileImport);
  elements.brandSelect.addEventListener('change', populateDevices);
  elements.deviceSearch.addEventListener('input', populateDevices);
  elements.deviceSelect.addEventListener('change', handleDeviceChange);
  elements.planSelect.addEventListener('change', renderQuote);
  elements.termSelect.addEventListener('change', renderQuote);
  elements.downPaymentInput.addEventListener('input', renderQuote);
  elements.portabilityToggle.addEventListener('change', renderQuote);
  elements.insuranceToggle.addEventListener('change', renderQuote);
  elements.controlToggle.addEventListener('change', renderQuote);
  elements.clientNameInput.addEventListener('input', persistState);
  elements.clientPhoneInput.addEventListener('input', persistState);
  elements.operationSelect.addEventListener('change', renderQuote);
  
  elements.btnExportPNG.addEventListener('click', exportPNG);
  elements.btnExportPDF.addEventListener('click', exportPDF);
}

/**
 * Maneja la importacion del archivo Excel
 */
async function handleFileImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
    elements.catalogStatus.textContent = 'Procesando Excel...';
    const res = await loadWorkbook(file);
    catalogEngine.setCatalog(res.catalog);
    saveCatalogData(res.catalog, { ...res.meta, fileName: file.name });
    elements.catalogStatus.textContent = `Listo: ${res.catalog.length} equipos importados.`;
    populateBrands();
    populateDevices();
  } catch (err) {
    alert(err.message);
    elements.catalogStatus.textContent = 'Error al cargar Excel.';
  } finally {
    e.target.value = '';
  }
}

/**
 * Llena el select de marcas
 */
export function populateBrands() {
  const brands = catalogEngine.getBrands();
  elements.brandSelect.innerHTML = '<option value="TODAS">Todas las Marcas</option>' + 
    brands.map(b => `<option value="${b}">${b}</option>`).join('');
}

/**
 * Llena el select de dispositivos basado en filtros
 */
export function populateDevices() {
  const brand = elements.brandSelect.value;
  const query = elements.deviceSearch.value;
  const results = catalogEngine.searchDevice(brand, query);
  
  elements.deviceSelect.innerHTML = results.map((d, i) => 
    `<option value="${d.id}">${d.brand} - ${d.name}</option>`
  ).join('');
  
  handleDeviceChange();
}

/**
 * Maneja el cambio de dispositivo seleccionado
 */
function handleDeviceChange() {
  const selectedId = elements.deviceSelect.value;
  appState.selectedDevice = catalogEngine.getDeviceById(selectedId);
  renderQuote();
}

/**
 * Renderiza la cotizacion completa
 */
export function renderQuote() {
  const device = appState.selectedDevice;
  const selectedPlan = elements.planSelect.value;
  const termMonths = parseInt(elements.termSelect.value, 10);
  const theme = resolvePlanTheme(selectedPlan);
  
  appState.selectedPlan = selectedPlan;
  appState.selectedTerm = termMonths;
  appState.isTitanio = selectedPlan.toLowerCase().includes('titanio');
  
  // Aplicar estilos cromativos del Tema
  document.documentElement.style.setProperty('--p1', theme.c1);
  document.documentElement.style.setProperty('--p2', theme.c2);
  
  // Validar plazo para Titanio
  if (appState.isTitanio && termMonths !== 30) {
    elements.termSelect.value = '30';
    appState.selectedTerm = 30;
  }
  
  // Calcular promocion
  let promoPrice = 0;
  if (device) {
    promoPrice = calculatePromotion(device, theme.name, appState.selectedTerm) ?? 0;
  }
  
  // Obtener tipo de operacion
  const operationType = elements.operationSelect?.value || 'renovacion';
  const isPortabilidad = operationType === 'portabilidad' || elements.portabilityToggle.checked;
  
  // Calcular cotizacion
  const quote = calculateTotal({
    listPrice: device?.list || 0,
    promoPrice: promoPrice,
    downPayment: parseFloat(elements.downPaymentInput.value) || 0,
    termMonths: appState.selectedTerm,
    baseRent: theme.price,
    planName: selectedPlan,
    hasPortability: isPortabilidad,
    hasInsurance: elements.insuranceToggle.checked,
    insuranceTier: device?.insurance || 0,
    hasControl: elements.controlToggle.checked,
    deviceName: device?.name || ''
  });
  
  // Renderizar datos en la tarjeta
  elements.cardPlanTitle.textContent = `Plan ${theme.name}`;
  elements.cardPlanTerm.textContent = appState.isTitanio ? '30 meses obligatorios' : `Plazo a ${quote.term} meses`;
  elements.cardPlanPrice.textContent = formatMXN(theme.price);
  
  if (device) {
    elements.cardDeviceBrand.textContent = device.brand;
    elements.cardDeviceName.textContent = device.name;
    elements.cardValidity.textContent = device.validity ? `Vigencia: ${device.validity} (${device.status})` : '';
  } else {
    elements.cardDeviceBrand.textContent = 'ARSA';
    elements.cardDeviceName.textContent = 'Seleccione un dispositivo';
    elements.cardValidity.textContent = '';
  }
  
  elements.cardListPrice.textContent = formatMXN(quote.oldPrice);
  elements.cardPromoPrice.textContent = formatMXN(quote.finalPrice);
  elements.cardDownPayment.textContent = formatMXN(quote.payToday);
  elements.cardBalance.textContent = formatMXN(quote.balance);
  elements.cardTotalMonthly.textContent = formatMXN(quote.totalMonthlyPromo);
  elements.cardSavingsLabel.textContent = `Ahorro en equipo: ${formatMXN(quote.savings)} (${quote.discountPercent.toFixed(1)}%)`;
  
  // Actualizar datos del cliente en tarjeta
  const clientName = elements.clientNameInput?.value?.trim() || '-';
  const clientPhone = elements.clientPhoneInput?.value?.trim() || '-';
  const operationMap = {
    'renovacion': 'Renovación',
    'renovacion_anticipada': 'Renovación Anticipada',
    'linea_nueva': 'Línea Nueva',
    'linea_adicional': 'Línea Adicional',
    'portabilidad': 'Portabilidad'
  };
  const operationName = operationMap[elements.operationSelect?.value] || 'Renovación';
  
  document.getElementById('cardClientName').textContent = clientName;
  document.getElementById('cardClientPhone').textContent = clientPhone;
  document.getElementById('cardOperation').textContent = operationName;
  
  // Actualizar beneficios
  const totalSavings = (quote.savings) + ((theme.price - quote.rentWithPromo) * quote.term);
  document.getElementById('cardTotalSavings').textContent = formatMXN(totalSavings);
  document.getElementById('cardDiscountPercent').textContent = `${quote.discountPercent.toFixed(1)}%`;
  
  // Persistir estado
  persistState();
}

/**
 * Persiste el estado del formulario en LocalStorage
 */
function persistState() {
  saveFormState({
    brand: elements.brandSelect.value,
    search: elements.deviceSearch.value,
    deviceId: elements.deviceSelect.value,
    plan: elements.planSelect.value,
    term: elements.termSelect.value,
    downPayment: elements.downPaymentInput.value,
    portability: elements.portabilityToggle.checked,
    insurance: elements.insuranceToggle.checked,
    control: elements.controlToggle.checked,
    clientName: elements.clientNameInput?.value || '',
    clientPhone: elements.clientPhoneInput?.value || '',
    operation: elements.operationSelect?.value || 'renovacion'
  });
}

/**
 * Exporta la cotizacion como PNG
 */
async function exportPNG() {
  const card = document.getElementById('quoteCard');
  if (!card) {
    alert('No se encontró la tarjeta de cotizacion.');
    return;
  }
  
  try {
    const canvas = await window.html2canvas(card, { 
      scale: 2, 
      backgroundColor: '#090d16',
      useCORS: true,
      logging: false
    });
    const link = document.createElement('a');
    link.download = `Cotizacion-ARSA-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    alert('Error al generar PNG: ' + err.message);
  }
}

/**
 * Exporta la cotizacion como PDF visual
 */
async function exportPDF() {
  const card = document.getElementById('quoteCard');
  if (!card) {
    alert('No se encontró la tarjeta de cotizacion.');
    return;
  }
  
  try {
    // Generar canvas desde HTML
    const canvas = await window.html2canvas(card, { 
      scale: 2, 
      backgroundColor: '#090d16',
      useCORS: true,
      logging: false
    });
    
    // Convertir a imagen
    const imgData = canvas.toDataURL('image/png');
    
    // Crear PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ 
      orientation: 'portrait', 
      unit: 'mm', 
      format: 'a4',
      compress: true
    });
    
    // Calcular dimensiones para ajustar imagen
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Agregar imagen al PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight > pdfHeight ? pdfHeight : imgHeight);
    
    // Guardar
    const clientName = elements.clientNameInput?.value?.trim() || 'Cliente';
    pdf.save(`Cotizacion-${clientName.replace(/\s+/g, '_')}-${Date.now()}.pdf`);
  } catch (err) {
    alert('Error al generar PDF: ' + err.message);
  }
}

// Exportar funciones para uso global
window.ARSA = {
  init,
  populateBrands,
  populateDevices,
  renderQuote,
  catalogEngine,
  elements,
  appState
};
