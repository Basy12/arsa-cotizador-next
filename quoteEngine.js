/**
 * ARSA Cotizador Next - QuoteEngine
 * Motor de logica y reglas comerciales desacoplado
 */

export const TITANIO_RULES = [
  { rx: /IPHONE 17 PRO MAX.*256GB/i, promo: 11999, extra: 400 },
  { rx: /IPHONE 17 PRO.*256GB/i, promo: 8999, extra: 300 },
  { rx: /IPHONE 17 ?AIR.*256GB/i, promo: 7499, extra: 250 },
  { rx: /IPHONE 17.*256GB/i, promo: 0, extra: 0 }
];

export function getTitanioRule(deviceName) {
  if (!deviceName) return null;
  return TITANIO_RULES.find(r => r.rx.test(deviceName)) || null;
}

export function calculatePortability(isPortability, planName) {
  if (!isPortability) return 0;
  const isTitanio = String(planName || '').toLowerCase().includes('titanio');
  return isTitanio ? 0.10 : 0.20;
}

export function calculateTitanioExtra(device, planName, fallbackName = '') {
  const isTitanio = String(planName || '').toLowerCase().includes('titanio');
  if (!isTitanio) return 0;
  const name = device?.name || fallbackName;
  const rule = getTitanioRule(name);
  return rule ? rule.extra : 0;
}

export function calculatePromotion(device, planName, termMonths) {
  if (!device) return null;
  const planKey = planName;
  const isTitanio = String(planName || '').toLowerCase().includes('titanio');

  if (isTitanio) {
    const rule = getTitanioRule(device.name);
    return rule ? rule.promo : null;
  }

  return device.promos?.[planKey]?.[termMonths] ?? null;
}

export function calculateInsurance(hasInsurance, insuranceTier) {
  if (!hasInsurance) return 0;
  const val = Number(insuranceTier);
  return Number.isFinite(val) && val > 0 ? val : 0;
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
  
  const finalPrice = Math.max(0, Number(promoPrice) || 0);
  const oldPrice = Math.max(0, Number(listPrice) || 0);
  const payToday = Math.min(Math.max(0, Number(downPayment) || 0), finalPrice);
  const balance = Math.max(0, finalPrice - payToday);
  
  const extraTitanio = calculateTitanioExtra({ name: deviceName }, planName, deviceName);
  const equipmentMonthly = isTitanio
    ? extraTitanio
    : Math.round((balance / term + Number.EPSILON) * 100) / 100;

  const portDiscountRate = calculatePortability(hasPortability, planName);
  const rentWithPromo = Math.round((baseRent * (1 - portDiscountRate) + Number.EPSILON) * 100) / 100;

  const insuranceCost = calculateInsurance(hasInsurance, insuranceTier);
  const controlCost = hasControl ? 50 : 0;

  const totalMonthlyPromo = Math.round((equipmentMonthly + rentWithPromo + insuranceCost + controlCost + Number.EPSILON) * 100) / 100;
  const totalMonthlyRegular = Math.round((equipmentMonthly + baseRent + insuranceCost + controlCost + Number.EPSILON) * 100) / 100;

  const savings = Math.max(0, oldPrice - finalPrice);
  const discountPercent = oldPrice > 0 ? (savings / oldPrice) * 100 : 0;

  return {
    term,
    finalPrice,
    oldPrice,
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

export function formatMXN(amount) {
  const n = Math.round((Number(amount) || 0) * 100) / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  }).format(n);
}