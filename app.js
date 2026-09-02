/**
 * ARSA Cotizador Next - app.js
 * Controlador principal de la aplicación.
 *
 * Estructura plana:
 * index.html
 * app.js
 * quoteEngine.js
 * excelImporter.js
 * catalogEngine.js
 * storageService.js
 * planThemes.js
 * crystal.css
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

export const catalogEngine = new CatalogEngine();

export const elements = {
  excelFileInput: null,
  catalogStatus: null,

  clientNameInput: null,
  clientPhoneInput: null,
  operationSelect: null,

  brandSelect: null,
  deviceSearch: null,
  deviceSelect: null,
  planSelect: null,
  termSelect: null,
  downPaymentInput: null,

  portabilityToggle: null,
  insuranceToggle: null,
  controlToggle: null,

  cardPlanTitle: null,
  cardPlanTerm: null,
  cardPlanPrice: null,

  cardClientName: null,
  cardClientPhone: null,
  cardOperation: null,

  cardDeviceBrand: null,
  cardDeviceName: null,
  cardValidity: null,

  cardListPrice: null,
  cardPromoPrice: null,
  cardDownPayment: null,
  cardBalance: null,
  cardTotalMonthly: null,
  cardSavingsLabel: null,

  cardTotalSavings: null,
  cardDiscountPercent: null,

  quoteBreakdown: null,
  toggleBreakdown: null,
  toggleBreakdownText: null,
  toggleBreakdownIcon: null,

  breakdownPlan: null,
  breakdownDevice: null,
  breakdownInsurance: null,
  breakdownControl: null,
  breakdownTotal: null,

  btnExportPNG: null,
  btnExportPDF: null
};

export const appState = {
  selectedDevice: null,
  currentQuote: null,
  catalogMeta: null
};

export function init() {
  captureElements();
  setupEventListeners();
  loadApplicationData();
  renderQuote();
}

function captureElements() {
  elements.excelFileInput = document.getElementById('excelFileInput');
  elements.catalogStatus = document.getElementById('catalogStatus');

  elements.clientNameInput = document.getElementById('clientNameInput');
  elements.clientPhoneInput = document.getElementById('clientPhoneInput');
  elements.operationSelect = document.getElementById('operationSelect');

  elements.brandSelect = document.getElementById('brandSelect');
  elements.deviceSearch = document.getElementById('deviceSearch');
  elements.deviceSelect = document.getElementById('deviceSelect');
  elements.planSelect = document.getElementById('planSelect');
  elements.termSelect = document.getElementById('termSelect');
  elements.downPaymentInput = document.getElementById('downPaymentInput');

  elements.portabilityToggle = document.getElementById('portabilityToggle');
  elements.insuranceToggle = document.getElementById('insuranceToggle');
  elements.controlToggle = document.getElementById('controlToggle');

  elements.cardPlanTitle = document.getElementById('cardPlanTitle');
  elements.cardPlanTerm = document.getElementById('cardPlanTerm');
  elements.cardPlanPrice = document.getElementById('cardPlanPrice');

  elements.cardClientName = document.getElementById('cardClientName');
  elements.cardClientPhone = document.getElementById('cardClientPhone');
  elements.cardOperation = document.getElementById('cardOperation');

  elements.cardDeviceBrand = document.getElementById('cardDeviceBrand');
  elements.cardDeviceName = document.getElementById('cardDeviceName');
  elements.cardValidity = document.getElementById('cardValidity');

  elements.cardListPrice = document.getElementById('cardListPrice');
  elements.cardPromoPrice = document.getElementById('cardPromoPrice');
  elements.cardDownPayment = document.getElementById('cardDownPayment');
  elements.cardBalance = document.getElementById('cardBalance');
  elements.cardTotalMonthly = document.getElementById('cardTotalMonthly');
  elements.cardSavingsLabel = document.getElementById('cardSavingsLabel');

  elements.cardTotalSavings = document.getElementById('cardTotalSavings');
  elements.cardDiscountPercent = document.getElementById('cardDiscountPercent');

  elements.quoteBreakdown = document.getElementById('quoteBreakdown');
  elements.toggleBreakdown = document.getElementById('toggleBreakdown');
  elements.toggleBreakdownText = document.getElementById('toggleBreakdownText');
  elements.toggleBreakdownIcon = document.getElementById('toggleBreakdownIcon');

  elements.breakdownPlan = document.getElementById('breakdownPlan');
  elements.breakdownDevice = document.getElementById('breakdownDevice');
  elements.breakdownInsurance = document.getElementById('breakdownInsurance');
  elements.breakdownControl = document.getElementById('breakdownControl');
  elements.breakdownTotal = document.getElementById('breakdownTotal');

  elements.btnExportPNG = document.getElementById('btnExportPNG');
  elements.btnExportPDF = document.getElementById('btnExportPDF');
}

function setupEventListeners() {
  elements.excelFileInput.addEventListener('change', handleFileImport);

  elements.brandSelect.addEventListener('change', () => {
    populateDevices();
    renderQuote();
  });

  elements.deviceSearch.addEventListener('input', () => {
    populateDevices();
    renderQuote();
  });

  elements.deviceSelect.addEventListener('change', () => {
    syncSelectedDevice();
    renderQuote();
  });

  elements.planSelect.addEventListener('change', renderQuote);
  elements.termSelect.addEventListener('change', renderQuote);
  elements.downPaymentInput.addEventListener('input', renderQuote);

  elements.portabilityToggle.addEventListener('change', renderQuote);
  elements.insuranceToggle.addEventListener('change', renderQuote);
  elements.controlToggle.addEventListener('change', renderQuote);

  elements.clientNameInput.addEventListener('input', renderQuote);
  elements.clientPhoneInput.addEventListener('input', renderQuote);
  elements.operationSelect.addEventListener('change', renderQuote);

  elements.toggleBreakdown.addEventListener('click', toggleBreakdown);

  elements.btnExportPNG.addEventListener('click', exportPNG);
  elements.btnExportPDF.addEventListener('click', exportPDF);
}

function loadApplicationData() {
  const savedCatalog = loadCatalogData();

  if (savedCatalog?.catalog?.length) {
    catalogEngine.setCatalog(savedCatalog.catalog);
    appState.catalogMeta = savedCatalog.meta || null;

    populateBrands();
    populateDevices();

    const fileName = savedCatalog.meta?.fileName || 'Catálogo guardado';
    elements.catalogStatus.textContent =
      `Catálogo listo: ${savedCatalog.catalog.length} equipos (${fileName}).`;
  } else {
    elements.catalogStatus.textContent =
      'Carga tu Excel para consultar precios y promociones.';
  }

  const savedForm = loadFormState();

  if (savedForm) {
    restoreFormState(savedForm);

    if (savedCatalog?.catalog?.length) {
      populateDevices(savedForm.deviceId || '');
      syncSelectedDevice();
    }
  }
}

function restoreFormState(state) {
  if (state.clientName !== undefined) {
    elements.clientNameInput.value = state.clientName;
  }

  if (state.clientPhone !== undefined) {
    elements.clientPhoneInput.value = state.clientPhone;
  }

  if (state.operation !== undefined) {
    elements.operationSelect.value = state.operation;
  }

  if (state.brand !== undefined) {
    elements.brandSelect.value = state.brand;
  }

  if (state.search !== undefined) {
    elements.deviceSearch.value = state.search;
  }

  if (state.plan !== undefined) {
    elements.planSelect.value = state.plan;
  }

  if (state.term !== undefined) {
    elements.termSelect.value = state.term;
  }

  if (state.downPayment !== undefined) {
    elements.downPaymentInput.value = state.downPayment;
  }

  if (state.portability !== undefined) {
    elements.portabilityToggle.checked = Boolean(state.portability);
  }

  if (state.insurance !== undefined) {
    elements.insuranceToggle.checked = Boolean(state.insurance);
  }

  if (state.control !== undefined) {
    elements.controlToggle.checked = Boolean(state.control);
  }
}

async function handleFileImport(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    elements.catalogStatus.textContent = 'Procesando Excel...';

    const result = await loadWorkbook(file);

    catalogEngine.setCatalog(result.catalog);

    appState.catalogMeta = {
      ...result.meta,
      fileName: result.fileName
    };

    saveCatalogData(result.catalog, appState.catalogMeta);

    populateBrands();
    populateDevices();
    syncSelectedDevice();

    elements.catalogStatus.textContent =
      `Listo: ${result.catalog.length} equipos importados.`;

    renderQuote();
  } catch (error) {
    console.error(error);

    elements.catalogStatus.textContent =
      'No se pudo importar el Excel. Revisa el formato del archivo.';

    alert(error.message || 'No se pudo importar el archivo Excel.');
  } finally {
    event.target.value = '';
  }
}

function populateBrands() {
  const currentBrand = elements.brandSelect.value || 'TODAS';
  const brands = catalogEngine.getBrands();

  elements.brandSelect.innerHTML = [
    '<option value="TODAS">Todas las Marcas</option>',
    ...brands.map(brand =>
      `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`
    )
  ].join('');

  const exists = [...elements.brandSelect.options]
    .some(option => option.value === currentBrand);

  elements.brandSelect.value = exists ? currentBrand : 'TODAS';
}

function populateDevices(preferredDeviceId = '') {
  const currentDeviceId = preferredDeviceId || elements.deviceSelect.value;
  const brand = elements.brandSelect.value;
  const query = elements.deviceSearch.value;

  const devices = catalogEngine.searchDevice(brand, query);

  if (!devices.length) {
    elements.deviceSelect.innerHTML =
      '<option value="">No se encontraron equipos</option>';

    appState.selectedDevice = null;
    return;
  }

  elements.deviceSelect.innerHTML = devices
    .map(device => {
      const label = `${device.brand} - ${device.name}`;
      return `
        <option value="${escapeHtml(String(device.id))}">
          ${escapeHtml(label)}
        </option>
      `;
    })
    .join('');

  const requestedExists = devices.some(
    device => String(device.id) === String(currentDeviceId)
  );

  elements.deviceSelect.value = requestedExists
    ? String(currentDeviceId)
    : String(devices[0].id);

  syncSelectedDevice();
}

function syncSelectedDevice() {
  const selectedId = elements.deviceSelect.value;

  appState.selectedDevice = selectedId
    ? catalogEngine.getDeviceById(selectedId)
    : null;
}

export function renderQuote() {
  const device = appState.selectedDevice;
  const selectedPlan = elements.planSelect.value;
  const theme = resolvePlanTheme(selectedPlan);

  const isTitanio = selectedPlan.toLowerCase().includes('titanio');

  if (isTitanio && Number(elements.termSelect.value) !== 30) {
    elements.termSelect.value = '30';
  }

  const termMonths = Number(elements.termSelect.value) || 36;

  applyTheme(theme);

  const operation = elements.operationSelect.value;
  const hasPortability =
    operation === 'portabilidad' || elements.portabilityToggle.checked;

  let promoPrice = 0;

  if (device) {
    const promotion = calculatePromotion(
      device,
      theme.name,
      isTitanio ? 30 : termMonths
    );

    promoPrice = promotion ?? 0;
  }

  const quote = calculateTotal({
    listPrice: device?.list || 0,
    promoPrice,
    downPayment: Number(elements.downPaymentInput.value) || 0,
    termMonths: isTitanio ? 30 : termMonths,
    baseRent: theme.price,
    planName: selectedPlan,
    hasPortability,
    hasInsurance: elements.insuranceToggle.checked,
    insuranceTier: device?.insurance || 0,
    hasControl: elements.controlToggle.checked,
    deviceName: device?.name || ''
  });

  appState.currentQuote = quote;

  renderPlanData(theme, quote);
  renderClientData();
  renderDeviceData(device);
  renderPriceData(quote);
  renderBenefits(theme, quote);
  renderBreakdown(quote);

  persistState();
}

function applyTheme(theme) {
  document.documentElement.style.setProperty('--p1', theme.c1);
  document.documentElement.style.setProperty('--p2', theme.c2);
}

function renderPlanData(theme, quote) {
  elements.cardPlanTitle.textContent = `Plan ${theme.name}`;

  elements.cardPlanTerm.textContent = quote.isTitanio
    ? 'Plazo a 30 meses'
    : `Plazo a ${quote.term} meses`;

  elements.cardPlanPrice.textContent = formatMXN(theme.price);
}

function renderClientData() {
  const operationNames = {
    renovacion: 'Renovación',
    renovacion_anticipada: 'Renovación anticipada',
    linea_nueva: 'Línea nueva',
    linea_adicional: 'Línea adicional',
    portabilidad: 'Portabilidad'
  };

  elements.cardClientName.textContent =
    elements.clientNameInput.value.trim() || '-';

  elements.cardClientPhone.textContent =
    elements.clientPhoneInput.value.trim() || '-';

  elements.cardOperation.textContent =
    operationNames[elements.operationSelect.value] || 'Renovación';
}

function renderDeviceData(device) {
  if (!device) {
    elements.cardDeviceBrand.textContent = 'ARSA';
    elements.cardDeviceName.textContent = 'Selecciona un equipo';
    elements.cardValidity.textContent = '';
    return;
  }

  elements.cardDeviceBrand.textContent = device.brand || 'ARSA';
  elements.cardDeviceName.textContent = device.name || 'Equipo sin nombre';

  const validity = String(device.validity || '').trim();
  const status = String(device.status || '').trim();

  if (validity && status) {
    elements.cardValidity.textContent =
      `Vigencia: ${validity} (${status})`;
  } else if (validity) {
    elements.cardValidity.textContent = `Vigencia: ${validity}`;
  } else {
    elements.cardValidity.textContent = '';
  }
}

function renderPriceData(quote) {
  elements.cardListPrice.textContent = formatMXN(quote.oldPrice);
  elements.cardPromoPrice.textContent = formatMXN(quote.finalPrice);
  elements.cardDownPayment.textContent = formatMXN(quote.payToday);
  elements.cardBalance.textContent = formatMXN(quote.balance);

  elements.cardTotalMonthly.textContent =
    formatMXN(quote.totalMonthlyPromo);

  elements.cardSavingsLabel.textContent =
    `Ahorro en equipo: ${formatMXN(quote.savings)} (${quote.discountPercent.toFixed(1)}%)`;
}

function renderBenefits(theme, quote) {
  const monthlyPortabilitySavings =
    Math.max(0, theme.price - quote.rentWithPromo);

  const totalPortabilitySavings =
    monthlyPortabilitySavings * quote.term;

  const totalSavings =
    quote.savings + totalPortabilitySavings;

  elements.cardTotalSavings.textContent = formatMXN(totalSavings);
  elements.cardDiscountPercent.textContent =
    `${quote.discountPercent.toFixed(1)}%`;
}

function renderBreakdown(quote) {
  elements.breakdownPlan.textContent = formatMXN(quote.rentWithPromo);
  elements.breakdownDevice.textContent = formatMXN(quote.equipmentMonthly);
  elements.breakdownInsurance.textContent = formatMXN(quote.insuranceCost);
  elements.breakdownControl.textContent = formatMXN(quote.controlCost);
  elements.breakdownTotal.textContent =
    formatMXN(quote.totalMonthlyPromo);
}

function toggleBreakdown() {
  const willShow = elements.quoteBreakdown.hidden;

  elements.quoteBreakdown.hidden = !willShow;

  elements.toggleBreakdownText.textContent = willShow
    ? 'Quitar desglose'
    : 'Agregar desglose';

  elements.toggleBreakdownIcon.textContent = willShow
    ? '−'
    : '＋';
}

function persistState() {
  saveFormState({
    clientName: elements.clientNameInput.value,
    clientPhone: elements.clientPhoneInput.value,
    operation: elements.operationSelect.value,

    brand: elements.brandSelect.value,
    search: elements.deviceSearch.value,
    deviceId: elements.deviceSelect.value,

    plan: elements.planSelect.value,
    term: elements.termSelect.value,
    downPayment: elements.downPaymentInput.value,

    portability: elements.portabilityToggle.checked,
    insurance: elements.insuranceToggle.checked,
    control: elements.controlToggle.checked
  });
}

async function exportPNG() {
  const card = document.getElementById('quoteCard');

  if (!card) {
    alert('No se encontró la tarjeta para exportar.');
    return;
  }

  try {
    const canvas = await window.html2canvas(card, {
      scale: 2,
      backgroundColor: '#090d16',
      useCORS: true,
      logging: false,
      onclone: clonedDocument => {
        clonedDocument
          .querySelectorAll('[data-export-hide]')
          .forEach(element => {
            element.style.display = 'none';
          });
      }
    });

    const clientName =
      elements.clientNameInput.value.trim() || 'Cliente';

    const fileName = `Cotizacion-ARSA-${safeFileName(clientName)}-${Date.now()}.png`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error(error);
    alert(`Error al generar PNG: ${error.message}`);
  }
}

async function exportPDF() {
  const card = document.getElementById('quoteCard');

  if (!card) {
    alert('No se encontró la tarjeta para exportar.');
    return;
  }

  try {
    const canvas = await window.html2canvas(card, {
      scale: 2,
      backgroundColor: '#090d16',
      useCORS: true,
      logging: false,
      onclone: clonedDocument => {
        clonedDocument
          .querySelectorAll('[data-export-hide]')
          .forEach(element => {
            element.style.display = 'none';
          });
      }
    });

    const imageData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 8;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const imageWidth = canvas.width;
    const imageHeight = canvas.height;

    const scale = Math.min(
      printableWidth / imageWidth,
      printableHeight / imageHeight
    );

    const pdfImageWidth = imageWidth * scale;
    const pdfImageHeight = imageHeight * scale;

    const x = (pageWidth - pdfImageWidth) / 2;
    const y = margin;

    pdf.addImage(
      imageData,
      'PNG',
      x,
      y,
      pdfImageWidth,
      pdfImageHeight,
      undefined,
      'FAST'
    );

    const clientName =
      elements.clientNameInput.value.trim() || 'Cliente';

    const fileName = `Cotizacion-ARSA-${safeFileName(clientName)}-${Date.now()}.pdf`;

    pdf.save(fileName);
  } catch (error) {
    console.error(error);
    alert(`Error al generar PDF: ${error.message}`);
  }
}

function safeFileName(value) {
  return String(value)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'Cliente';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.ARSA = {
  init,
  renderQuote,
  catalogEngine,
  appState
};
