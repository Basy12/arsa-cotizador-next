/**
 * ARSA Cotizador Next - Quote Engine
 * Motor comercial desacoplado.
 */

export const TITANIO_TERM = 30;

export const TITANIO_RULES = [
  { rx: /IPHONE 17 PRO MAX.*256GB/i, promo: 11999, extra: 400 },
  { rx: /IPHONE 17 PRO.*256GB/i, promo: 8999, extra: 300 },
  { rx: /IPHONE 17 ?AIR.*256GB/i, promo: 7499, extra: 250 },
  { rx: /IPHONE 17.*256GB/i, promo: 0, extra: 0 }
];

export function getTitanioRule(deviceName = '') {
  return TITANIO_RULES.find(rule => rule.rx.test(deviceName)) || null;
}

export function isTitanioPlan(planName = '') {
  return String(planName).toLowerCase().includes('titanio');
}

export function normalizePlanName(planName = '') {
  return String(planName)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function isAzulPlan(planName = '') {
  const plan = normalizePlanName(planName);

  return (
    plan === 'azul 1' ||
    plan === 'azul 2' ||
    plan === 'azul 3'
  );
}

/**
 * Detecta equipos recientes de iPhone.
 *
 * Regla comercial solicitada:
 * iPhone recientes no aplican en Azul 1, Azul 2 ni Azul 3.
 * La disponibilidad comercial inicia desde plan Plata.
 */
export function isRecentIPhone(deviceName = '') {
  const name = String(deviceName).toUpperCase();

  return (
    /IPHONE\s*(1[5-9]|2[0-9])/.test(name) ||
    /IPHONE\s*(1[5-9]|2[0-9])\s*(PRO|PLUS|AIR|MAX)/.test(name)
  );
}

export function requiresPlataOrHigher(deviceName = '') {
  return isRecentIPhone(deviceName);
}

export function getPlanEligibility(deviceName = '', planName = '') {
  if (requiresPlataOrHigher(deviceName) && isAzulPlan(planName)) {
    return {
      eligible: false,
      reason: 'Este equipo aplica desde el plan Plata.'
    };
  }

  return {
    eligible: true,
    reason: ''
  };
}

export function calculatePromotion(device, planName, termMonths) {
  if (!device) {
    return {
      type: 'MISSING',
      value: null,
      raw: ''
    };
  }

  const eligibility = getPlanEligibility(device.name, planName);

  if (!eligibility.eligible) {
    return {
      type: 'NOT_ELIGIBLE_PLAN',
      value: null,
      raw: 'N/A',
      reason: eligibility.reason
    };
  }

  if (isTitanioPlan(planName)) {
    const rule = getTitanioRule(device.name);

    if (!rule) {
      return {
        type: 'NOT_AVAILABLE',
        value: null,
        raw: 'N/A',
        reason: 'Este equipo no participa en la promoción Titanio.'
      };
    }

    return {
      type: rule.promo === 0 ? 'INCLUDED' : 'PRICE',
      value: rule.promo,
      raw: rule.promo === 0 ? 'INCLUIDO' : String(rule.promo),
      reason: ''
    };
  }

  const promotion = device.promos?.[planName]?.[termMonths];

  if (!promotion) {
    return {
      type: 'MISSING',
      value: null,
      raw: '',
      reason: 'No se encontró información comercial para esta combinación.'
    };
  }

  return promotion;
}

export function calculatePortability(hasPortability, planName) {
  if (!hasPortability) return 0;

  return isTitanioPlan(planName) ? 0.10 : 0.20;
}

export function calculateInsurance(hasInsurance, insuranceTier) {
  if (!hasInsurance) return 0;

  const value = Number(insuranceTier);

  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateTitanioExtra(deviceName, planName) {
  if (!isTitanioPlan(planName)) return 0;

  return getTitanioRule(deviceName)?.extra || 0;
}

export function calculateTotal({
  listPrice = 0,
  promoPrice = 0,
  downPayment = 0,
  termMonths = 36,
  baseRent = 0,
  planName = '',
  hasPortability = false,
  hasInsurance = false,
  insuranceTier = 0,
  hasControl = false,
  deviceName = ''
}) {
  const isTitanio = isTitanioPlan(planName);
  const term = isTitanio ? TITANIO_TERM : Number(termMonths) || 36;

  const oldPrice = Math.max(0, Number(listPrice) || 0);
  const finalPrice = Math.max(0, Number(promoPrice) || 0);

  const payToday = Math.min(
    Math.max(0, Number(downPayment) || 0),
    finalPrice
  );

  const balance = Math.max(0, finalPrice - payToday);

  const equipmentMonthly = isTitanio
    ? calculateTitanioExtra(deviceName, planName)
    : roundMoney(balance / term);

  const portDiscountRate = calculatePortability(
    hasPortability,
    planName
  );

  const rentWithPromo = roundMoney(
    Number(baseRent) * (1 - portDiscountRate)
  );

  const insuranceCost = calculateInsurance(
    hasInsurance,
    insuranceTier
  );

  const controlCost = hasControl ? 50 : 0;

  const totalMonthlyPromo = roundMoney(
    equipmentMonthly +
    rentWithPromo +
    insuranceCost +
    controlCost
  );

  const totalMonthlyRegular = roundMoney(
    equipmentMonthly +
    Number(baseRent) +
    insuranceCost +
    controlCost
  );

  const savings = Math.max(0, oldPrice - finalPrice);

  const discountPercent = oldPrice > 0
    ? (savings / oldPrice) * 100
    : 0;

  return {
    term,
    oldPrice,
    finalPrice,
    payToday,
    balance,
    equipmentMonthly,
    portDiscountRate,
    rentWithPromo,
    insuranceCost,
    controlCost,
    totalMonthlyPromo,
    totalMonthlyRegular,
    savings,
    discountPercent,
    isTitanio
  };
}

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function formatMXN(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  }).format(roundMoney(value));
}
