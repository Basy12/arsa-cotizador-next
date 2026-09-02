/**
 * ARSA Cotizador Next - Quote Engine
 * Motor comercial desacoplado.
 */

export const TITANIO_RULES = [
  { rx: /IPHONE 17 PRO MAX.*256GB/i, promo: 11999, extra: 400 },
  { rx: /IPHONE 17 PRO.*256GB/i, promo: 8999, extra: 300 },
  { rx: /IPHONE 17 ?AIR.*256GB/i, promo: 7499, extra: 250 },
  { rx: /IPHONE 17.*256GB/i, promo: 0, extra: 0 }
];

export function getTitanioRule(deviceName = '') {
  return TITANIO_RULES.find(rule => rule.rx.test(deviceName)) || null;
}

export function calculatePromotion(device, planName, termMonths) {
  if (!device) {
    return {
      type: 'MISSING',
      value: null,
      raw: ''
    };
  }

  const isTitanio = String(planName)
    .toLowerCase()
    .includes('titanio');

  if (isTitanio) {
    const rule = getTitanioRule(device.name);

    if (!rule) {
      return {
        type: 'NOT_AVAILABLE',
        value: null,
        raw: 'N/A'
      };
    }

    return {
      type: rule.promo === 0 ? 'INCLUDED' : 'PRICE',
      value: rule.promo,
      raw: rule.promo === 0 ? 'INCLUIDO' : String(rule.promo)
    };
  }

  return device.promos?.[planName]?.[termMonths] || {
    type: 'MISSING',
    value: null,
    raw: ''
  };
}

export function calculatePortability(hasPortability, planName) {
  if (!hasPortability) return 0;

  return String(planName).toLowerCase().includes('titanio')
    ? 0.10
    : 0.20;
}

export function calculateInsurance(hasInsurance, insuranceTier) {
  if (!hasInsurance) return 0;

  const value = Number(insuranceTier);

  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateTitanioExtra(deviceName, planName) {
  const isTitanio = String(planName).toLowerCase().includes('titanio');

  if (!isTitanio) return 0;

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
  const isTitanio = String(planName).toLowerCase().includes('titanio');
  const term = isTitanio ? 30 : Number(termMonths) || 36;

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
