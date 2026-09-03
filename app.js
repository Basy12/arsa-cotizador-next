/**
 * ARSA Cotizador Next - app.js
 * Controlador principal con contraste dinámico por plan.
 */

import { CatalogEngine } from './catalogEngine.js';
import { loadWorkbook } from './excelImporter.js';
import {
  calculatePromotion,
  calculateTotal,
  formatMXN,
  TITANIO_TERM
} from './quoteEngine.js';
import {
  saveCatalogData,
  loadCatalogData,
  saveFormState,
  loadFormState,
  clearState
} from './storageService.js';
import { resolvePlanTheme } from './planThemes.js';
import { getRecommendedDevices } from './recommendationEngine.js';

const catalogEngine = new CatalogEngine();
const elements = {};

let selectedDevice = null;
let currentQuote = null;

let commercialValidation = {
  valid: false,
  blockExport: true,
  messages: []
};

export function init() {
  captureElements();
  setDefaultDate();
  setupListeners();
  hydrateStoredData();
  renderQuote();
}

function captureElements() {
  const ids = [
    'excelFileInput',
    'catalogStatus',
    'commercialAlert',

    'clientNameInput',
    'clientPhoneInput',
    'operationSelect',

    'earlyRenewalToggle',
    'earlyRenewalInputs',
    'naturalCompletionInput',
    'earlyRenewalPaymentInput',
    'earlyRenewalWarning',

    'brandSelect',
    'deviceSearch',
    'includedOnlyToggle',
    'deviceSelect',
    'planSelect',
    'termSelect',
    'downPaymentInput',

    'portabilityToggle',
    'insuranceToggle',
    'controlToggle',

    'currentMonthlyInput',
    'desiredMonthlyInput',
    'toleranceInput',
    'findSimilarBtn',
    'findBudgetBtn',
    'findCheapestBtn',

    'advisorInput',
    'quoteDateInput',
    'folioInput',
    'refreshFolioBtn',
    'resetQuoteBtn',

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

    'earlyRenewalCard',
    'naturalCompletionValue',
    'earlyRenewalPaymentValue',
    'earlyRenewalSavingsValue',
    'earlyRenewalPercentValue',

    'recommendationsPanel',
    'recommendationsSubtitle',
    'recommendationsList',
    'closeRecommendationsBtn',

    'quoteBreakdown',
    'toggleBreakdown',
    'toggleBreakdownIcon',
    'toggleBreakdownText',

    'breakdownDeviceLabel',
    'breakdownDevice',
    'breakdownPlan',
    'breakdownPortabilityRow',
    'breakdownPortability',
    'breakdownInsuranceRow',
    'breakdownInsurance',
    'breakdownControlRow',
    'breakdownControl',
    'breakdownTotal',

    'cardSavingsLabel',
    'cardTotalMonthly',

    'cardAdvisor',
    'cardDate',
    'cardFolio',

    'btnExportPNG',
    'btnExportPDF',
    'quoteCard'
  ];

  ids.forEach(id => {
    elements[id] = document.getElementById(id);
  });
}

function setupListeners() {
  elements.excelFileInput.addEventListener('change', importExcel);

  elements.brandSelect.addEventListener('change', () => {
    updateDevices('');
    renderQuote();
  });

  elements.deviceSearch.addEventListener('input', () => {
    updateDevices('');
    renderQuote();
  });

  elements.includedOnlyToggle.addEventListener('change', () => {
    updateDevices('');
    renderQuote();
  });

  elements.deviceSelect.addEventListener('change', () => {
    syncSelectedDevice();
    renderQuote();
  });

  elements.planSelect.addEventListener('change', () => {
    updateDevices('');
    renderQuote();
  });

  elements.termSelect.addEventListener('change', () => {
    updateDevices('');
    renderQuote();
  });

  [
    elements.clientNameInput,
    elements.clientPhoneInput,
    elements.operationSelect,
    elements.downPaymentInput,
    elements.portabilityToggle,
    elements.insuranceToggle,
    elements.controlToggle,
    elements.advisorInput,
    elements.quoteDateInput,
    elements.naturalCompletionInput,
    elements.earlyRenewalPaymentInput,
    elements.currentMonthlyInput,
    elements.desiredMonthlyInput,
    elements.toleranceInput
  ].forEach(element => {
    element.addEventListener('input', renderQuote);
    element.addEventListener('change', renderQuote);
  });

  elements.earlyRenewalToggle.addEventListener('change', () => {
    elements.earlyRenewalInputs.hidden =
      !elements.earlyRenewalToggle.checked;

    renderQuote();
  });

  elements.toggleBreakdown.addEventListener(
    'click',
    toggleBreakdown
  );

  elements.refreshFolioBtn.addEventListener('click', () => {
    elements.folioInput.value = generateFolio();
    renderQuote();
  });

  elements.resetQuoteBtn.addEventListener('click', resetQuote);

  elements.findSimilarBtn.addEventListener('click', () => {
    showRecommendations('similar');
  });

  elements.findBudgetBtn.addEventListener('click', () => {
    showRecommendations('budget');
  });

  elements.findCheapestBtn.addEventListener('click', () => {
    showRecommendations('cheapest');
  });

  elements.closeRecommendationsBtn.addEventListener('click', () => {
    elements.recommendationsPanel.hidden = true;
  });

  elements.recommendationsList.addEventListener(
    'click',
    handleRecommendationClick
  );

  elements.btnExportPNG.addEventListener('click', exportPNG);
  elements.btnExportPDF.addEventListener('click', exportPDF);
}

function hydrateStoredData() {
  const savedCatalog = loadCatalogData();

  if (savedCatalog?.catalog?.length) {
    catalogEngine.setCatalog(savedCatalog.catalog);

    populateBrands();
    updateDevices('');

    const fileName =
      savedCatalog.meta?.fileName || 'Catálogo guardado';

    elements.catalogStatus.textContent =
      `Catálogo listo: ${savedCatalog.catalog.length} equipos (${fileName}).`;
  } else {
    elements.catalogStatus.textContent =
      'Carga tu Excel vigente para consultar promociones.';
  }

  const savedState = loadFormState();

  if (savedState) {
    restoreState(savedState);

    if (savedCatalog?.catalog?.length) {
      populateBrands();
      updateDevices(savedState.deviceId || '');
      syncSelectedDevice();
    }
  }

  if (!elements.folioInput.value) {
    elements.folioInput.value = generateFolio();
  }
}

function restoreState(state) {
  const inputIds = [
    'clientNameInput',
    'clientPhoneInput',
    'operationSelect',
    'deviceSearch',
    'planSelect',
    'termSelect',
    'downPaymentInput',
    'advisorInput',
    'quoteDateInput',
    'folioInput',
    'naturalCompletionInput',
    'earlyRenewalPaymentInput',
    'currentMonthlyInput',
    'desiredMonthlyInput',
    'toleranceInput'
  ];

  inputIds.forEach(id => {
    if (state[id] !== undefined && elements[id]) {
      elements[id].value = state[id];
    }
  });

  if (state.brandSelect) {
    elements.brandSelect.value = state.brandSelect;
  }

  elements.portabilityToggle.checked =
    Boolean(state.portabilityToggle);

  elements.insuranceToggle.checked =
    Boolean(state.insuranceToggle);

  elements.controlToggle.checked =
    Boolean(state.controlToggle);

  elements.includedOnlyToggle.checked =
    Boolean(state.includedOnlyToggle);

  elements.earlyRenewalToggle.checked =
    Boolean(state.earlyRenewalToggle);

  elements.earlyRenewalInputs.hidden =
    !elements.earlyRenewalToggle.checked;

  if (!elements.quoteDateInput.value) {
    setDefaultDate();
  }

  if (!elements.folioInput.value) {
    elements.folioInput.value = generateFolio();
  }

  if (!elements.toleranceInput.value) {
    elements.toleranceInput.value = '100';
  }
}

async function importExcel(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  try {
    elements.catalogStatus.textContent = 'Procesando Excel...';

    const result = await loadWorkbook(file);

    catalogEngine.setCatalog(result.catalog);

    saveCatalogData(result.catalog, {
      ...result.meta,
      fileName: result.fileName
    });

    populateBrands();
    updateDevices('');
    syncSelectedDevice();

    elements.catalogStatus.textContent =
      `Excel cargado: ${result.catalog.length} equipos disponibles.`;

    renderQuote();
  } catch (error) {
    console.error(error);

    elements.catalogStatus.textContent =
      'No se pudo importar el Excel.';

    alert(
      error.message ||
      'Ocurrió un error al importar el archivo Excel.'
    );
  } finally {
    event.target.value = '';
  }
}

function populateBrands() {
  const currentBrand = elements.brandSelect.value || 'TODAS';

  const options = [
    '<option value="TODAS">Todas las marcas</option>',
    ...catalogEngine.getBrands().map(brand => `
      <option value="${escapeHtml(brand)}">
        ${escapeHtml(brand)}
      </option>
    `)
  ];

  elements.brandSelect.innerHTML = options.join('');

  const exists = [...elements.brandSelect.options]
    .some(option => option.value === currentBrand);

  elements.brandSelect.value = exists
    ? currentBrand
    : 'TODAS';
}

function updateDevices(preferredId = '') {
  if (!catalogEngine.catalog.length) {
    elements.deviceSelect.innerHTML =
      '<option value="">Carga el Excel para consultar equipos</option>';

    selectedDevice = null;
    return;
  }

  const planName = elements.planSelect.value;

  const isTitanio = planName
    .toLowerCase()
    .includes('titanio');

  if (isTitanio) {
    elements.termSelect.value = String(TITANIO_TERM);
  }

  const term = isTitanio
    ? TITANIO_TERM
    : Number(elements.termSelect.value) || 36;

  let devices = catalogEngine.searchDevice(
    elements.brandSelect.value,
    elements.deviceSearch.value,
    {
      includedOnly: elements.includedOnlyToggle.checked,
      planName,
      termMonths: term
    }
  );

  devices = [...devices].sort((a, b) => {
    const validityA = getValiditySortValue(a.validity);
    const validityB = getValiditySortValue(b.validity);

    if (validityB.end !== validityA.end) {
      return validityB.end - validityA.end;
    }

    if (validityB.start !== validityA.start) {
      return validityB.start - validityA.start;
    }

    return String(a.name || '').localeCompare(
      String(b.name || ''),
      'es-MX'
    );
  });

  if (!devices.length) {
    elements.deviceSelect.innerHTML =
      '<option value="">No se encontraron equipos con esos filtros</option>';

    elements.deviceSelect.value = '';
    selectedDevice = null;
    return;
  }

  const previousId = preferredId || elements.deviceSelect.value;

  const previousStillExists = devices.some(device =>
    String(device.id) === String(previousId)
  );

  elements.deviceSelect.innerHTML = devices.map(device => {
    const modelName = `${device.brand} - ${device.name}`;
    const validity = formatValidityForSelector(device.validity);

    const text = validity
      ? `${modelName} | Vigencia: ${validity}`
      : `${modelName} | Vigencia no indicada`;

    return `
      <option value="${escapeHtml(String(device.id))}">
        ${escapeHtml(text)}
      </option>
    `;
  }).join('');

  const selectedId = previousStillExists
    ? String(previousId)
    : String(devices[0].id);

  elements.deviceSelect.value = selectedId;

  selectedDevice = catalogEngine.getDeviceById(selectedId);
}

function syncSelectedDevice() {
  selectedDevice = catalogEngine.getDeviceById(
    elements.deviceSelect.value
  );
}

function renderQuote() {
  const planName = elements.planSelect.value;
  const theme = resolvePlanTheme(planName);

  const isTitanio = planName
    .toLowerCase()
    .includes('titanio');

  if (
    isTitanio &&
    Number(elements.termSelect.value) !== TITANIO_TERM
  ) {
    elements.termSelect.value = String(TITANIO_TERM);
  }

  const term = isTitanio
    ? TITANIO_TERM
    : Number(elements.termSelect.value) || 36;

  applyTheme(theme);

  const hasPortability =
    elements.operationSelect.value === 'portabilidad' ||
    elements.portabilityToggle.checked;

  const promotion = selectedDevice
    ? calculatePromotion(selectedDevice, theme.name, term)
    : {
      type: 'MISSING',
      value: null,
      raw: '',
      reason: ''
    };

  currentQuote = calculateTotal({
    listPrice: selectedDevice?.list || 0,
    promoPrice: promotion.value || 0,
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

  commercialValidation = validateCommercialQuote(
    selectedDevice,
    promotion
  );

  renderInternalAlerts();
  renderCard(theme, promotion, hasPortability);
  renderEarlyRenewalComparison();
  saveState();
}

function applyTheme(theme) {
  const root = document.documentElement;

  root.style.setProperty('--p1', theme.c1);
  root.style.setProperty('--p2', theme.c2);

  root.style.setProperty(
    '--plan-glow',
    theme.glow || 'rgba(54, 197, 255, 0.35)'
  );

  root.style.setProperty(
    '--plan-glass',
    theme.glass || 'rgba(54, 197, 255, 0.15)'
  );

  root.style.setProperty(
    '--plan-border',
    theme.border || 'rgba(154, 234, 255, 0.40)'
  );

  root.style.setProperty(
    '--plan-text',
    theme.text || '#ffffff'
  );

  root.style.setProperty(
    '--plan-text-soft',
    theme.textSoft ||
    theme.text ||
    'rgba(255, 255, 255, 0.88)'
  );

  root.style.setProperty(
    '--plan-header-shadow',
    theme.headerShadow ||
    '0 2px 8px rgba(0, 0, 0, 0.22)'
  );

  const planBand = document.querySelector('.plan-header-band');

  if (planBand) {
    planBand.dataset.lightPlan = String(
      Boolean(theme.lightPlan)
    );
  }
}

function validateCommercialQuote(device, promotion) {
  const messages = [];
  let blockExport = false;

  if (!catalogEngine.catalog.length) {
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

  if (promotion.type === 'NOT_ELIGIBLE_PLAN') {
    messages.push({
      type: 'info',
      text:
        promotion.reason ||
        'Este equipo aplica desde el plan Plata.'
    });

    blockExport = true;
  }

  if (promotion.type === 'NOT_AVAILABLE') {
    messages.push({
      type: 'danger',
      text:
        promotion.reason ||
        'No existe promoción para esta combinación.'
    });

    blockExport = true;
  }

  if (
    promotion.type === 'MISSING' ||
    promotion.type === 'INVALID'
  ) {
    messages.push({
      type: 'danger',
      text:
        'No se encontró una promoción válida. Revisa el Excel.'
    });

    blockExport = true;
  }

  if (device?.status) {
    messages.push({
      type: 'warning',
      text:
        `Estatus del catálogo: ${device.status}. ` +
        'Confirma disponibilidad antes de enviar.'
    });
  }

  if (device?.validity) {
    messages.push({
      type: 'info',
      text: `Vigencia interna: ${device.validity}`
    });
  }

  return {
    valid: !blockExport,
    blockExport,
    messages
  };
}

function renderInternalAlerts() {
  renderAlertBox(
    elements.commercialAlert,
    commercialValidation.messages
  );

  const cardMessages = commercialValidation.messages.filter(
    message => message.type !== 'info'
  );

  renderAlertBox(
    elements.cardCommercialAlert,
    cardMessages
  );

  elements.btnExportPNG.disabled =
    commercialValidation.blockExport;

  elements.btnExportPDF.disabled =
    commercialValidation.blockExport;

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

function renderCard(theme, promotion, hasPortability) {
  elements.cardPlanTitle.textContent = `Plan ${theme.name}`;

  elements.cardPlanTerm.textContent = currentQuote.isTitanio
    ? `Titanio · ${TITANIO_TERM} meses fijos`
    : `Plazo a ${currentQuote.term} meses`;

  elements.cardPlanPrice.textContent =
    formatMXN(theme.price);

  elements.cardClientName.textContent =
    elements.clientNameInput.value.trim() || '-';

  elements.cardClientPhone.textContent =
    elements.clientPhoneInput.value.trim() || '-';

  elements.cardOperation.textContent = operationName(
    elements.operationSelect.value
  );

  elements.cardDeviceBrand.textContent =
    selectedDevice?.brand || 'ARSA';

  elements.cardDeviceName.textContent =
    selectedDevice?.name || 'Selecciona un equipo';

  elements.cardValidity.textContent = selectedDevice?.validity
    ? `Vigencia: ${selectedDevice.validity} · Estatus: ${selectedDevice.status}`
    : '';

  renderPromotionStatus(promotion);

  elements.cardListPrice.textContent =
    formatMXN(currentQuote.oldPrice);

  elements.cardPromoPrice.classList.remove(
    'included-price',
    'not-available-price'
  );

  if (promotion.type === 'INCLUDED') {
    elements.cardPromoPrice.textContent = 'INCLUIDO';
    elements.cardPromoPrice.classList.add('included-price');
  } else if (
    promotion.type === 'NOT_AVAILABLE' ||
    promotion.type === 'NOT_ELIGIBLE_PLAN' ||
    promotion.type === 'MISSING' ||
    promotion.type === 'INVALID'
  ) {
    elements.cardPromoPrice.textContent = 'N/A';
    elements.cardPromoPrice.classList.add(
      'not-available-price'
    );
  } else {
    elements.cardPromoPrice.textContent =
      formatMXN(currentQuote.finalPrice);
  }

  elements.cardDownPayment.textContent =
    formatMXN(currentQuote.payToday);

  elements.cardBalance.textContent =
    formatMXN(currentQuote.balance);

  elements.cardTotalSavings.textContent =
    formatMXN(currentQuote.savings);

  elements.cardDiscountPercent.textContent =
    `${currentQuote.discountPercent.toFixed(2)}%`;

  elements.breakdownDeviceLabel.textContent =
    currentQuote.isTitanio
      ? 'Cargo mensual del equipo'
      : `Equipo a ${currentQuote.term} meses`;

  elements.breakdownDevice.textContent =
    formatMXN(currentQuote.equipmentMonthly);

  elements.breakdownPlan.textContent =
    formatMXN(currentQuote.rentWithPromo);

  const portabilitySaving = Math.max(
    0,
    theme.price - currentQuote.rentWithPromo
  );

  elements.breakdownPortabilityRow.hidden =
    !hasPortability || portabilitySaving <= 0;

  elements.breakdownPortability.textContent =
    `-${formatMXN(portabilitySaving)}`;

  elements.breakdownInsuranceRow.hidden =
    currentQuote.insuranceCost <= 0;

  elements.breakdownInsurance.textContent =
    formatMXN(currentQuote.insuranceCost);

  elements.breakdownControlRow.hidden =
    currentQuote.controlCost <= 0;

  elements.breakdownControl.textContent =
    formatMXN(currentQuote.controlCost);

  elements.breakdownTotal.textContent =
    formatMXN(currentQuote.totalMonthlyPromo);

  elements.cardTotalMonthly.textContent =
    formatMXN(currentQuote.totalMonthlyPromo);

  elements.cardSavingsLabel.textContent =
    `Ahorro en equipo: ${formatMXN(currentQuote.savings)} ` +
    `(${currentQuote.discountPercent.toFixed(1)}%)`;

  elements.cardAdvisor.textContent =
    elements.advisorInput.value.trim() ||
    'Ejecutivo ARSA';

  elements.cardDate.textContent =
    formatLongDate(elements.quoteDateInput.value);

  elements.cardFolio.textContent =
    elements.folioInput.value;
}

function renderPromotionStatus(promotion) {
  const classMap = {
    INCLUDED: 'promo-included',
    PRICE: 'promo-ok',
    NOT_ELIGIBLE_PLAN: 'promo-info',
    NOT_AVAILABLE: 'promo-danger',
    MISSING: 'promo-danger',
    INVALID: 'promo-danger'
  };

  const textMap = {
    INCLUDED:
      'Equipo incluido con el plan seleccionado.',

    PRICE:
      'Precio promocional consultado desde Excel.',

    NOT_ELIGIBLE_PLAN:
      promotion.reason ||
      'Este equipo aplica desde plan Plata.',

    NOT_AVAILABLE:
      promotion.reason ||
      'No disponible para este plan y plazo.',

    MISSING:
      'Promoción no encontrada. Revisa el Excel.',

    INVALID:
      'Dato comercial inválido. Revisa el Excel.'
  };

  elements.promoStatus.className =
    `promo-status ${classMap[promotion.type] || 'promo-danger'}`;

  elements.promoStatus.textContent =
    textMap[promotion.type] ||
    'Promoción no disponible.';
}

function renderEarlyRenewalComparison() {
  const enabled = elements.earlyRenewalToggle.checked;

  elements.earlyRenewalCard.hidden = !enabled;

  if (!enabled) {
    elements.earlyRenewalWarning.hidden = true;
    return;
  }

  const natural = Math.max(
    0,
    Number(elements.naturalCompletionInput.value) || 0
  );

  const early = Math.max(
    0,
    Number(elements.earlyRenewalPaymentInput.value) || 0
  );

  const savings = Math.max(0, natural - early);

  const percent = natural > 0
    ? (early / natural) * 100
    : null;

  elements.naturalCompletionValue.textContent =
    formatMXN(natural);

  elements.earlyRenewalPaymentValue.textContent =
    formatMXN(early);

  elements.earlyRenewalSavingsValue.textContent =
    formatMXN(savings);

  elements.earlyRenewalPercentValue.textContent =
    percent === null
      ? '—'
      : `${percent.toFixed(2)}%`;

  if (natural > 0 && early > natural) {
    elements.earlyRenewalWarning.hidden = false;

    elements.earlyRenewalWarning.textContent =
      'El pago para renovar antes es mayor al pago por concluir el plazo natural.';
  } else {
    elements.earlyRenewalWarning.hidden = true;
    elements.earlyRenewalWarning.textContent = '';
  }
}

function showRecommendations(mode) {
  if (!catalogEngine.catalog.length) {
    alert('Carga el Excel antes de buscar alternativas.');
    return;
  }

  if (!currentQuote || commercialValidation.blockExport) {
    alert(
      'Selecciona primero un equipo con una promoción válida.'
    );
    return;
  }

  const theme = resolvePlanTheme(elements.planSelect.value);

  const hasPortability =
    elements.operationSelect.value === 'portabilidad' ||
    elements.portabilityToggle.checked;

  const recommendationData = getRecommendedDevices({
    catalog: catalogEngine.catalog,
    selectedDeviceId: selectedDevice?.id || '',
    planName: theme.name,
    termMonths: currentQuote.term,
    baseRent: theme.price,
    downPayment: Number(elements.downPaymentInput.value) || 0,
    hasPortability,
    hasInsurance: elements.insuranceToggle.checked,
    hasControl: elements.controlToggle.checked,
    currentMonthly: currentQuote.totalMonthlyPromo,
    currentPayment: Number(elements.currentMonthlyInput.value) || 0,
    desiredPayment: Number(elements.desiredMonthlyInput.value) || 0,
    tolerance: Number(elements.toleranceInput.value) || 100,
    mode,
    limit: 4
  });

  renderRecommendations(recommendationData);
}

function renderRecommendations(data) {
  const titles = {
    similar: 'Mensualidad similar',
    budget: 'Dentro de presupuesto',
    cheapest: 'Alternativas más económicas'
  };

  const sources = {
    deseada: 'mensualidad deseada',
    actual: 'mensualidad actual',
    cotizacion: 'cotización actual'
  };

  elements.recommendationsPanel.hidden = false;

  elements.recommendationsSubtitle.textContent =
    `${titles[data.mode]} · Objetivo ${formatMXN(data.target)} ` +
    `(${sources[data.targetSource]}) · Tolerancia +/- ${formatMXN(data.tolerance)}`;

  if (!data.results.length) {
    elements.recommendationsList.innerHTML = `
      <div class="recommendation-empty">
        No se encontraron alternativas comerciales válidas.
      </div>
    `;

    return;
  }

  elements.recommendationsList.innerHTML = data.results
    .map((item, index) => {
      const tags = item.reasons
        .map(reason => `<span>${escapeHtml(reason)}</span>`)
        .join('');

      const validity = item.device.validity
        ? `Vigencia: ${escapeHtml(item.device.validity)}`
        : 'Vigencia no indicada';

      return `
        <article class="recommendation-item">
          <div class="recommendation-top">
            <div class="recommendation-rank">${index + 1}</div>

            <div class="recommendation-name-wrap">
              <div class="recommendation-brand">
                ${escapeHtml(item.device.brand || 'ARSA')}
              </div>

              <div class="recommendation-name">
                ${escapeHtml(item.device.name || 'Equipo')}
              </div>
            </div>

            <div class="recommendation-price">
              ${formatMXN(item.monthly)}
              <small>por mes</small>
            </div>
          </div>

          <div class="recommendation-difference ${
            item.difference <= 0
              ? 'difference-good'
              : 'difference-warn'
          }">
            ${escapeHtml(formatDifference(item.difference))}
          </div>

          <div class="recommendation-tags">
            ${tags}
          </div>

          <div class="recommendation-validity">
            ${validity}
          </div>

          <button
            class="use-recommendation-btn"
            type="button"
            data-device-id="${escapeHtml(String(item.device.id))}"
          >
            Usar este equipo
          </button>
        </article>
      `;
    })
    .join('');
}

function handleRecommendationClick(event) {
  const button = event.target.closest('[data-device-id]');

  if (!button) {
    return;
  }

  const deviceId = button.dataset.deviceId;

  if (!deviceId) {
    return;
  }

  useRecommendedDevice(deviceId);
}

function useRecommendedDevice(deviceId) {
  const device = catalogEngine.getDeviceById(deviceId);

  if (!device) {
    alert('No se encontró el equipo seleccionado.');
    return;
  }

  elements.includedOnlyToggle.checked = false;
  elements.brandSelect.value = device.brand;
  elements.deviceSearch.value = '';

  updateDevices(device.id);

  elements.deviceSelect.value = String(device.id);

  selectedDevice = device;

  elements.recommendationsPanel.hidden = true;

  renderQuote();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function formatDifference(difference) {
  const value = Number(difference) || 0;

  if (value === 0) {
    return 'Misma mensualidad estimada';
  }

  if (value < 0) {
    return `${formatMXN(Math.abs(value))} menos al mes`;
  }

  return `${formatMXN(value)} más al mes`;
}

function toggleBreakdown() {
  const willShow = elements.quoteBreakdown.hidden;

  elements.quoteBreakdown.hidden = !willShow;

  elements.toggleBreakdownIcon.textContent =
    willShow ? '−' : '＋';

  elements.toggleBreakdownText.textContent =
    willShow
      ? 'Quitar desglose'
      : 'Agregar desglose';
}

function resetQuote() {
  const confirmation = confirm(
    '¿Deseas iniciar una nueva cotización? ' +
    'El catálogo de Excel se conservará.'
  );

  if (!confirmation) {
    return;
  }

  clearState();

  elements.clientNameInput.value = '';
  elements.clientPhoneInput.value = '';
  elements.operationSelect.value = 'renovacion';

  elements.earlyRenewalToggle.checked = false;
  elements.earlyRenewalInputs.hidden = true;
  elements.naturalCompletionInput.value = '';
  elements.earlyRenewalPaymentInput.value = '';
  elements.earlyRenewalWarning.hidden = true;

  elements.brandSelect.value = 'TODAS';
  elements.deviceSearch.value = '';
  elements.includedOnlyToggle.checked = false;

  elements.planSelect.value = 'Azul 1';
  elements.termSelect.value = '36';
  elements.downPaymentInput.value = '0';

  elements.portabilityToggle.checked = false;
  elements.insuranceToggle.checked = false;
  elements.controlToggle.checked = false;

  elements.currentMonthlyInput.value = '';
  elements.desiredMonthlyInput.value = '';
  elements.toleranceInput.value = '100';

  elements.advisorInput.value = 'Akatzin Ortega';

  setDefaultDate();

  elements.folioInput.value = generateFolio();

  elements.quoteBreakdown.hidden = true;
  elements.toggleBreakdownIcon.textContent = '＋';
  elements.toggleBreakdownText.textContent =
    'Agregar desglose';

  elements.recommendationsPanel.hidden = true;
  elements.recommendationsList.innerHTML = '';

  updateDevices('');
  syncSelectedDevice();
  renderQuote();
}

function saveState() {
  saveFormState({
    clientNameInput: elements.clientNameInput.value,
    clientPhoneInput: elements.clientPhoneInput.value,
    operationSelect: elements.operationSelect.value,

    earlyRenewalToggle:
      elements.earlyRenewalToggle.checked,

    naturalCompletionInput:
      elements.naturalCompletionInput.value,

    earlyRenewalPaymentInput:
      elements.earlyRenewalPaymentInput.value,

    brandSelect: elements.brandSelect.value,
    deviceSearch: elements.deviceSearch.value,
    includedOnlyToggle:
      elements.includedOnlyToggle.checked,

    deviceId: elements.deviceSelect.value,

    planSelect: elements.planSelect.value,
    termSelect: elements.termSelect.value,
    downPaymentInput: elements.downPaymentInput.value,

    portabilityToggle: elements.portabilityToggle.checked,
    insuranceToggle: elements.insuranceToggle.checked,
    controlToggle: elements.controlToggle.checked,

    currentMonthlyInput: elements.currentMonthlyInput.value,
    desiredMonthlyInput: elements.desiredMonthlyInput.value,
    toleranceInput: elements.toleranceInput.value,

    advisorInput: elements.advisorInput.value,
    quoteDateInput: elements.quoteDateInput.value,
    folioInput: elements.folioInput.value
  });
}

async function exportPNG() {
  if (commercialValidation.blockExport) {
    alert(
      'No puedes exportar hasta seleccionar una combinación comercial válida.'
    );
    return;
  }

  try {
    const canvas = await window.html2canvas(
      elements.quoteCard,
      {
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
      }
    );

    const link = document.createElement('a');

    link.download =
      `Cotizacion-${safeFileName(elements.folioInput.value)}.png`;

    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error(error);
    alert('No se pudo generar el PNG.');
  }
}

async function exportPDF() {
  if (commercialValidation.blockExport) {
    alert(
      'No puedes exportar hasta seleccionar una combinación comercial válida.'
    );
    return;
  }

  try {
    const canvas = await window.html2canvas(
      elements.quoteCard,
      {
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
      }
    );

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
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const scale = Math.min(
      maxWidth / canvas.width,
      maxHeight / canvas.height
    );

    const width = canvas.width * scale;
    const height = canvas.height * scale;

    pdf.addImage(
      imageData,
      'PNG',
      (pageWidth - width) / 2,
      margin,
      width,
      height,
      undefined,
      'FAST'
    );

    pdf.save(
      `Cotizacion-${safeFileName(elements.folioInput.value)}.pdf`
    );
  } catch (error) {
    console.error(error);
    alert('No se pudo generar el PDF.');
  }
}

/* =========================================================
   VIGENCIAS
   ========================================================= */

function formatValidityForSelector(validity = '') {
  return String(validity || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function getValiditySortValue(validity = '') {
  const text = String(validity || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (text.includes('INDEFINIDO')) {
    return {
      start: extractFirstDateFromValidity(text),
      end: Number.MAX_SAFE_INTEGER
    };
  }

  const dateMatches = text.match(
    /\b\d{1,2}\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+\d{2,4}\b/g
  ) || [];

  const dates = dateMatches
    .map(parseSpanishDate)
    .filter(Boolean);

  return {
    start: dates[0]?.getTime() || 0,
    end: dates[dates.length - 1]?.getTime() || 0
  };
}

function extractFirstDateFromValidity(validityText = '') {
  const match = String(validityText).match(
    /\b\d{1,2}\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+\d{2,4}\b/
  );

  const date = match
    ? parseSpanishDate(match[0])
    : null;

  return date ? date.getTime() : 0;
}

function parseSpanishDate(dateText = '') {
  const months = {
    ENERO: 0,
    FEBRERO: 1,
    MARZO: 2,
    ABRIL: 3,
    MAYO: 4,
    JUNIO: 5,
    JULIO: 6,
    AGOSTO: 7,
    SEPTIEMBRE: 8,
    OCTUBRE: 9,
    NOVIEMBRE: 10,
    DICIEMBRE: 11
  };

  const parts = String(dateText)
    .trim()
    .toUpperCase()
    .split(/\s+/);

  if (parts.length !== 3) {
    return null;
  }

  const day = Number(parts[0]);
  const month = months[parts[1]];
  let year = Number(parts[2]);

  if (
    !Number.isFinite(day) ||
    month === undefined ||
    !Number.isFinite(year)
  ) {
    return null;
  }

  if (year < 100) {
    year += 2000;
  }

  return new Date(year, month, day, 12, 0, 0);
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function setDefaultDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  elements.quoteDateInput.value =
    new Date(now.getTime() - offset)
      .toISOString()
      .slice(0, 10);
}

function generateFolio() {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('');

  const random = Math.floor(1000 + Math.random() * 9000);

  return `ARSA-${date}-${random}`;
}

function formatLongDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(`${value}T12:00:00`);

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
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

function safeFileName(value = '') {
  return String(value)
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .trim() || 'Cotizacion-ARSA';
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
