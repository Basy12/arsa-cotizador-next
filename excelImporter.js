export function parseCommercialValue(value) {
  const raw = String(value ?? '').trim();
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (!raw) {
    return {
      type: 'MISSING',
      value: null,
      raw: ''
    };
  }

  if (
    normalized === 'N/A' ||
    normalized === 'NA' ||
    normalized === 'N / A'
  ) {
    return {
      type: 'NOT_AVAILABLE',
      value: null,
      raw
    };
  }

  if (normalized.includes('INCLUIDO')) {
    return {
      type: 'INCLUDED',
      value: 0,
      raw
    };
  }

  let numericValue = null;

  if (typeof value === 'number') {
    numericValue = value;
  } else {
    const cleanNumber = raw
      .replace(/\$/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '');

    numericValue = Number(cleanNumber);
  }

  if (!Number.isFinite(numericValue)) {
    return {
      type: 'INVALID',
      value: null,
      raw
    };
  }

  return {
    type: 'PRICE',
    value: Math.round(numericValue * 100) / 100,
    raw
  };
}
