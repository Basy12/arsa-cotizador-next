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

const catalogEngine = new CatalogEngine();

const elements = {};
let selectedDevice = null;
let commercialValidation = {
  valid: false,
  blockExport: true,
  messages: []
};

export function init() {
  captureElements();
  addListeners();
  loadSavedData();
  renderQuote();
}

function captureElements() {
  [
    'excelFileInput',
    'catalogStatus',
    'commercialAlert',
    'clientNameInput',
    'clientPhoneInput',
    'operationSelect',
    'brandSelect',
    'deviceSearch',
    'deviceSelect',
    'planSelect',
    'termSelect',
    'downPaymentInput',
    'portabilityToggle',
    'insuranceToggle',
    'controlToggle',
    'cardPlanTitle',
    'cardPlanTerm',
    'cardPlanPrice',
    'cardCommercialAlert',
    'cardClientName',
    'cardClientPhone',
    'cardOperation',
    'cardDeviceBrand',
    'cardDeviceName',
    'cardValidity',
    'promoStatus',
    'cardListPrice',
    'cardPromoPrice',
    'cardDownPayment',
    'cardBalance',
    'cardTotalSavings',
    'cardDiscountPercent',
    'breakdownDeviceLabel',
    'breakdownDevice',
    'breakdownPlan',
    'breakdownInsuranceRow',
    'breakdownInsurance',
    'breakdownControlRow',
    'breakdownControl',
    'cardSavingsLabel',
    'cardTotalMonthly',
    'btnExportPNG',
    'btnExportPDF',
    'quoteCard'
  ].forEach(id => {
    elements[id] = document.getElementById(id);
  });
}

function addListeners() {
  elements.excelFileInput.addEventListener('change', importExcel);

  elements.brandSelect.addEventListener('change', updateDevices);
  elements.deviceSearch.addEventListener('input', updateDevices);

  elements.deviceSelect.addEventListener('change', () => {
    selectedDevice = catalogEngine.getDeviceById(elements.deviceSelect.value);
    renderQuote();
  });

  [
    elements.clientNameInput,
    elements.clientPhoneInput,
    elements.operationSelect,
    elements.planSelect,
    elements.termSelect,
    elements.downPaymentInput,
    elements.portabilityToggle,
    elements.insuranceToggle,
    elements.controlToggle
  ].forEach(element => {
    element.addEventListener('input', renderQuote);
    element.addEventListener('change', renderQuote);
  });

  elements.btnExportPNG.addEventListener('click', exportPNG);
  elements.btnExportPDF.addEventListener('click', exportPDF);
}

function loadSavedData() {
  const savedCatalog = loadCatalogData();

  if (savedCatalog?.catalog?.length) {
    catalogEngine.setCatalog(savedCatalog.catalog);

    populateBrands();
    updateDevices();

    elements.catalogStatus.textContent =
      `Catálogo listo: ${savedCatalog.catalog.length} equipos cargados.`;
  }

  const savedForm = loadFormState();

  if (savedForm) {
    restoreState(savedForm);

    if (savedCatalog?.catalog?.length) {
      updateDevices(savedForm.deviceId || '');
      selectedDevice = catalogEngine.getDeviceById(elements.deviceSelect.value);
    }
  }
}

function restoreState(state) {
  const values = [
    'clientNameInput',
    'clientPhoneInput',
    'operationSelect',
    'deviceSearch',
    'planSelect',
    'termSelect',
    'downPaymentInput'
  ];

  values.forEach(id => {
    if (state[id] !== undefined) {
      elements[id].value = state[id];
    }
  });

  if (state.brandSelect) {
    elements.brandSelect.value = state.brandSelect;
  }

  elements.portabilityToggle.checked = Boolean(state.portabilityToggle);
  elements.insuranceToggle.checked = Boolean(state.insuranceToggle);
  elements.controlToggle.checked = Boolean(state.controlToggle);
}

async function importExcel(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  try {
    elements.catalogStatus.textContent = 'Procesando Excel...';

    const result = await loadWorkbook(file);

    catalogEngine.setCatalog(result.catalog);

    saveCatalogData(result.catalog, {
      ...result.meta,
      fileName: result.fileName
    });

    populateBrands();
    updateDevices();

    elements.catalogStatus.textContent =
      `Excel vigente cargado: ${result.catalog.length} equipos.`;

    renderQuote();
  } catch (error) {
    console.error(error);

    elements.catalogStatus.textContent =
      'No se pudo importar el Excel.';

    alert(error.message || 'Error al importar Excel.');
  } finally {
    event.target.value = '';
  }
}

function populateBrands() {
  const currentBrand = elements.brandSelect.value || 'TODAS';

  const options = [
    '<option value="TODAS">Todas las marcas</option>',
    ...catalogEngine.getBrands().map(brand =>
      `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`
    )
  ];

  elements.brandSelect.innerHTML = options.join('');

  const valid = [...elements.brandSelect.options]
    .some(option => option.value === currentBrand);

  elements.brandSelect.value = valid ? currentBrand : 'TODAS';
}

function updateDevices(preferredDeviceId = '') {
  const devices = catalogEngine.searchDevice(
    elements.brandSelect.value,
    elements.deviceSearch.value
  );

  if (!devices.length) {
    elements.deviceSelect.innerHTML =
      '<option value="">No se encontraron equipos</option>';

    selectedDevice = null;
    renderQuote();
    return;
  }

  const currentId = preferredDeviceId || elements.deviceSelect.value;

  elements.deviceSelect.innerHTML = devices.map(device => `
    <option value="${escapeHtml(String(device.id))}">
      ${escapeHtml(`${device.brand} - ${device.name}`)}
    </option>
  `).join('');

  const exists = devices.some(device =>
    String(device.id) === String(currentId)
  );

  elements.deviceSelect.value = exists
    ? String(currentId)
    : String(devices[0].id);

  selectedDevice = catalogEngine.getDeviceById(elements.deviceSelect.value);

  renderQuote();
}

function renderQuote() {
  const planName = elements.planSelect.value;
  const theme = resolvePlanTheme(planName);
  const isTitanio = planName.toLowerCase().includes('titanio');

  if (isTitanio) {
    elements.termSelect.value = '30';
  }

  const term = Number(elements.termSelect.value) || 36;

  document.documentElement.style.setProperty('--p1', theme.c1);
  document.documentElement.style.setProperty('--p2', theme.c2);

  const hasPortability =
    elements.operationSelect.value === 'portabilidad' ||
    elements.portabilityToggle.checked;

  const promo = selectedDevice
    ? calculatePromotion(selectedDevice, theme.name, term)
    : { type: 'MISSING', value: null, raw: '' };

  const quote = calculateTotal({
    listPrice: selectedDevice?.list || 0,
    promoPrice: promo.value || 0,
    downPayment: Number(elements.downPaymentInput.value) || 0,
    termMonths: term,
    baseRent: theme.price,
    planName,
    hasPortability,
    hasInsurance: elements.insuranceToggle.checked,
    insuranceTier: selectedDevice?.insurance || 0,
    hasControl: elements.controlToggle.checked,
    deviceName: selectedDevice?.name || ''
  });

  commercialValidation = validateCommercialQuote({
    device: selectedDevice,
    promo,
    quote
  });

  renderCommercialAlerts();
  renderCard(theme, quote, promo);
  persistState();
}

function validateCommercialQuote({ device, promo }) {
  const messages = [];
  let blockExport = false;

  if (!catalogEngine.catalog?.length) {
    messages.push({
      type: 'danger',
      text: 'Carga el Excel vigente antes de generar una cotización.'
    });

    blockExport = true;
  }

  if (!device) {
    messages.push({
      type: 'danger',
      text: 'Selecciona un equipo antes de cotizar.'
    });

    blockExport = true;
  }

  if (promo?.type === 'NOT_AVAILABLE') {
    messages.push({
      type: 'danger',
      text: 'No existe promoción disponible para esta combinación de equipo, plan y plazo.'
    });

    blockExport = true;
  }

  if (promo?.type === 'MISSING' || promo?.type === 'INVALID') {
    messages.push({
      type: 'danger',
      text: 'No se encontró información comercial válida. Revisa el Excel vigente.'
    });

    blockExport = true;
  }

  if (device) {
    const status = String(device.status || '').toLowerCase();

    if (
      status.includes('agotado') ||
      status.includes('no resurtible') ||
      status.includes('no resurt')
    ) {
      messages.push({
        type: 'danger',
        text: `El equipo está marcado como "${device.status}". No se recomienda exportar esta cotización.`
      });

      blockExport = true;
    } else if (
      status.includes('última') ||
      status.includes('ultima') ||
      status.includes('sobre pedido') ||
      status.includes('revisar')
    ) {
      messages.push({
        type: 'warning',
        text: `Disponibilidad limitada: ${device.status}. Confirma existencias antes de enviar.`
      });
    }

    if (device.validity) {
      messages.push({
        type: 'info',
        text: `Vigencia comercial: ${device.validity}`
      });
    }
  }

  return {
    valid: !blockExport,
    blockExport,
    messages
  };
}

function renderCommercialAlerts() {
  renderAlertBox(
    elements.commercialAlert,
    commercialValidation.messages
  );

  const importantMessages = commercialValidation.messages
    .filter(message => message.type !== 'info');

  renderAlertBox(
    elements.cardCommercialAlert,
    importantMessages
  );

  elements.btnExportPNG.disabled = commercialValidation.blockExport;
  elements.btnExportPDF.disabled = commercialValidation.blockExport;

  elements.btnExportPNG.classList.toggle(
    'button-disabled',
    commercialValidation.blockExport
  );

  elements.btnExportPDF.classList.toggle(
    'button-disabled',
    commercialValidation.blockExport
  );
}

function renderAlertBox(container, messages) {
  if (!messages.length) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  container.hidden = false;

  container.innerHTML = messages.map(message => `
    <div class="alert-item alert-${message.type}">
      ${escapeHtml(message.text)}
    </div>
  `).join('');
}

function renderCard(theme, quote, promo) {
  elements.cardPlanTitle.textContent = `Plan ${theme.name}`;
  elements.cardPlanTerm.textContent =
    quote.isTitanio
      ? '30 meses obligatorios'
      : `Plazo a ${quote.term} meses`;

  elements.cardPlanPrice.textContent = formatMXN(theme.price);

  elements.cardClientName.textContent =
    elements.clientNameInput.value.trim() || '-';

  elements.cardClientPhone.textContent =
    elements.clientPhoneInput.value.trim() || '-';

  elements.cardOperation.textContent =
    operationName(elements.operationSelect.value);

  elements.cardDeviceBrand.textContent =
    selectedDevice?.brand || 'ARSA';

  elements.cardDeviceName.textContent =
    selectedDevice?.name || 'Selecciona un equipo';

  elements.cardValidity.textContent = selectedDevice?.validity
    ? `Vigencia: ${selectedDevice.validity} · Estatus: ${selectedDevice.status}`
    : '';

  renderPromotionStatus(promo);

  elements.cardListPrice.textContent = formatMXN(quote.oldPrice);

  if (promo.type === 'INCLUDED') {
    elements.cardPromoPrice.textContent = 'INCLUIDO';
    elements.cardPromoPrice.classList.add('included-price');
  } else {
    elements.cardPromoPrice.textContent = formatMXN(quote.finalPrice);
    elements.cardPromoPrice.classList.remove('included-price');
  }

  elements.cardDownPayment.textContent = formatMXN(quote.payToday);
  elements.cardBalance.textContent = formatMXN(quote.balance);

  elements.cardTotalSavings.textContent = formatMXN(quote.savings);

  elements.cardDiscountPercent.textContent =
    `${quote.discountPercent.toFixed(2)}%`;

  elements.breakdownDeviceLabel.textContent =
    quote.isTitanio
      ? 'Cargo mensual del equipo'
      : `Equipo a ${quote.term} meses`;

  elements.breakdownDevice.textContent =
    formatMXN(quote.equipmentMonthly);

  elements.breakdownPlan.textContent =
    formatMXN(quote.rentWithPromo);

  elements.breakdownInsuranceRow.hidden =
    quote.insuranceCost <= 0;

  elements.breakdownInsurance.textContent =
    formatMXN(quote.insuranceCost);

  elements.breakdownControlRow.hidden =
    quote.controlCost <= 0;

  elements.breakdownControl.textContent =
    formatMXN(quote.controlCost);

  elements.cardTotalMonthly.textContent =
    formatMXN(quote.totalMonthlyPromo);

  elements.cardSavingsLabel.textContent =
    `Ahorro en equipo: ${formatMXN(quote.savings)} (${quote.discountPercent.toFixed(1)}%)`;
}

function renderPromotionStatus(promo) {
  const statusClass = {
    INCLUDED: 'promo-included',
    PRICE: 'promo-ok',
    NOT_AVAILABLE: 'promo-danger',
    MISSING: 'promo-danger',
    INVALID: 'promo-danger'
  };

  const texts = {
    INCLUDED: 'Equipo incluido con el plan seleccionado.',
    PRICE: 'Precio promocional consultado desde Excel.',
    NOT_AVAILABLE: 'No disponible para este plan y plazo.',
    MISSING: 'Promoción no encontrada. Revisa el Excel.',
    INVALID: 'Dato comercial inválido. Revisa el Excel.'
  };

  elements.promoStatus.className =
    `promo-status ${statusClass[promo.type] || 'promo-danger'}`;

  elements.promoStatus.textContent =
    texts[promo.type] || 'Promoción no disponible.';
}

function persistState() {
  saveFormState({
    clientNameInput: elements.clientNameInput.value,
    clientPhoneInput: elements.clientPhoneInput.value,
    operationSelect: elements.operationSelect.value,
    brandSelect: elements.brandSelect.value,
    deviceSearch: elements.deviceSearch.value,
    deviceId: elements.deviceSelect.value,
    planSelect: elements.planSelect.value,
    termSelect: elements.termSelect.value,
    downPaymentInput: elements.downPaymentInput.value,
    portabilityToggle: elements.portabilityToggle.checked,
    insuranceToggle: elements.insuranceToggle.checked,
    controlToggle: elements.controlToggle.checked
  });
}

async function exportPNG() {
  if (commercialValidation.blockExport) {
    alert('No puedes exportar hasta corregir las alertas comerciales.');
    return;
  }

  const canvas = await window.html2canvas(elements.quoteCard, {
    scale: 2,
    backgroundColor: '#090d16',
    useCORS: true,
    logging: false,
    onclone: clonedDocument => {
      clonedDocument
        .querySelectorAll('[data-export-hide]')
        .forEach(node => {
          node.style.display = 'none';
        });
    }
  });

  const link = document.createElement('a');

  link.download = `Cotizacion-ARSA-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function exportPDF() {
  if (commercialValidation.blockExport) {
    alert('No puedes exportar hasta corregir las alertas comerciales.');
    return;
  }

  const canvas = await window.html2canvas(elements.quoteCard, {
    scale: 2,
    backgroundColor: '#090d16',
    useCORS: true,
    logging: false,
    onclone: clonedDocument => {
      clonedDocument
        .querySelectorAll('[data-export-hide]')
        .forEach(node => {
          node.style.display = 'none';
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
  const width = pageWidth - margin * 2;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(
    imageData,
    'PNG',
    margin,
    margin,
    width,
    Math.min(height, pageHeight - margin * 2)
  );

  pdf.save(`Cotizacion-ARSA-${Date.now()}.pdf`);
}

function operationName(value) {
  const names = {
    renovacion: 'Renovación',
    renovacion_anticipada: 'Renovación anticipada',
    linea_nueva: 'Línea nueva',
    linea_adicional: 'Línea adicional',
    portabilidad: 'Portabilidad'
  };

  return names[value] || 'Renovación';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
