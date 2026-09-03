/**
 * ARSA Cotizador Next - Recommendation Engine
 * Genera alternativas de equipos usando el catálogo comercial y
 * las mismas reglas del motor de cotización.
 */

import {
  calculatePromotion,
  calculateTotal,
  isTitanioPlan,
  TITANIO_TERM
} from './quoteEngine.js';

function getPromotionType(promotion) {
  return String(promotion?.type || '').toUpperCase();
}

function isValidPromotion(promotion) {
  const type = getPromotionType(promotion);

  return type === 'PRICE' || type === 'INCLUDED';
}

function isIncludedPromotion(promotion) {
  return getPromotionType(promotion) === 'INCLUDED' ||
    (
      getPromotionType(promotion) === 'PRICE' &&
      Number(promotion?.value) === 0
    );
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getTargetMonthly({
  currentMonthly = 0,
  currentPayment = 0,
  desiredPayment = 0
}) {
  const desired = Number(desiredPayment) || 0;
  const current = Number(currentPayment) || 0;
  const quote = Number(currentMonthly) || 0;

  if (desired > 0) {
    return {
      value: desired,
      source: 'deseada'
    };
  }

  if (current > 0) {
    return {
      value: current,
      source: 'actual'
    };
  }

  return {
    value: quote,
    source: 'cotizacion'
  };
}

function getValidityScore(validity = '') {
  const text = String(validity)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (text.includes('INDEFINIDO')) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match = text.match(
    /\b(\d{1,2})\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+(\d{2,4})\b/g
  );

  if (!match?.length) {
    return 0;
  }

  const lastDate = match[match.length - 1];
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

  const parts = lastDate.split(/\s+/);
  const day = Number(parts[0]);
  const month = months[parts[1]];
  let year = Number(parts[2]);

  if (year < 100) {
    year += 2000;
  }

  if (
    !Number.isFinite(day) ||
    month === undefined ||
    !Number.isFinite(year)
  ) {
    return 0;
  }

  return new Date(year, month, day, 12, 0, 0).getTime();
}

function buildReasons({
  candidate,
  target,
  mode,
  tolerance
}) {
  const reasons = [];
  const difference = candidate.difference;
  const absDifference = Math.abs(difference);

  if (candidate.included) {
    reasons.push('Equipo incluido');
  }

  if (mode === 'budget') {
    if (difference <= 0) {
      reasons.push('Dentro de presupuesto');
    } else if (difference <= tolerance) {
      reasons.push('Dentro de tolerancia');
    }
  }

  if (mode === 'similar' && absDifference <= tolerance) {
    reasons.push('Mensualidad similar');
  }

  if (mode === 'cheapest') {
    reasons.push('Alternativa más económica');
  }

  if (candidate.device.validity) {
    reasons.push('Vigencia registrada');
  }

  return reasons;
}

function createCandidate({
  device,
  planName,
  termMonths,
  baseRent,
  downPayment,
  hasPortability,
  hasInsurance,
  hasControl,
  target
}) {
  const finalTerm = isTitanioPlan(planName)
    ? TITANIO_TERM
    : termMonths;

  const promotion = calculatePromotion(
    device,
    planName,
    finalTerm
  );

  if (!isValidPromotion(promotion)) {
    return null;
  }

  const quote = calculateTotal({
    listPrice: device.list || 0,
    promoPrice: promotion.value || 0,
    downPayment,
    termMonths: finalTerm,
    baseRent,
    planName,
    hasPortability,
    hasInsurance,
    insuranceTier: device.insurance || 0,
    hasControl,
    deviceName: device.name || ''
  });

  const difference = roundMoney(
    quote.totalMonthlyPromo - target
  );

  return {
    device,
    promotion,
    quote,
    included: isIncludedPromotion(promotion),
    monthly: quote.totalMonthlyPromo,
    difference,
    validityScore: getValidityScore(device.validity)
  };
}

/**
 * Devuelve sugerencias según el modo solicitado.
 *
 * mode:
 * - similar  : mensualidad cercana al objetivo
 * - budget   : dentro del presupuesto o tolerancia
 * - cheapest : alternativas válidas más económicas
 */
export function getRecommendedDevices({
  catalog = [],
  selectedDeviceId = '',
  planName = '',
  termMonths = 36,
  baseRent = 0,
  downPayment = 0,
  hasPortability = false,
  hasInsurance = false,
  hasControl = false,
  currentMonthly = 0,
  currentPayment = 0,
  desiredPayment = 0,
  tolerance = 100,
  mode = 'similar',
  limit = 4
}) {
  const targetInfo = getTargetMonthly({
    currentMonthly,
    currentPayment,
    desiredPayment
  });

  const target = targetInfo.value;
  const safeTolerance = Math.max(0, Number(tolerance) || 0);
  const finalTerm = isTitanioPlan(planName)
    ? TITANIO_TERM
    : Number(termMonths) || 36;

  const candidates = catalog
    .filter(device =>
      String(device?.id) !== String(selectedDeviceId)
    )
    .map(device =>
      createCandidate({
        device,
        planName,
        termMonths: finalTerm,
        baseRent,
        downPayment,
        hasPortability,
        hasInsurance,
        hasControl,
        target
      })
    )
    .filter(Boolean);

  let results = candidates;

  if (mode === 'budget') {
    results = candidates.filter(candidate =>
      candidate.monthly <= target + safeTolerance
    );
  }

  if (mode === 'similar') {
    results = candidates.filter(candidate =>
      Math.abs(candidate.difference) <= safeTolerance
    );

    /*
     * Si no hay equipos dentro del rango, mostrar los más cercanos.
     */
    if (!results.length) {
      results = [...candidates];
    }
  }

  if (mode === 'cheapest') {
    results = [...candidates];
  }

  results = results
    .map(candidate => ({
      ...candidate,
      reasons: buildReasons({
        candidate,
        target,
        mode,
        tolerance: safeTolerance
      })
    }))
    .sort((a, b) => {
      if (mode === 'cheapest') {
        if (a.monthly !== b.monthly) {
          return a.monthly - b.monthly;
        }
      } else {
        const aDifference = Math.abs(a.difference);
        const bDifference = Math.abs(b.difference);

        if (aDifference !== bDifference) {
          return aDifference - bDifference;
        }
      }

      /*
       * En empate: primero incluido.
       */
      if (a.included !== b.included) {
        return a.included ? -1 : 1;
      }

      /*
       * Después la vigencia más amplia/actual.
       */
      if (a.validityScore !== b.validityScore) {
        return b.validityScore - a.validityScore;
      }

      return String(a.device.name || '').localeCompare(
        String(b.device.name || ''),
        'es-MX'
      );
    })
    .slice(0, Math.max(1, Number(limit) || 4));

  return {
    target,
    targetSource: targetInfo.source,
    tolerance: safeTolerance,
    mode,
    results
  };
}
