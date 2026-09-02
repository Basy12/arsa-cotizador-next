/**
 * ARSA Cotizador Next - Theme Engine
 * Definicion de colores, rentas base y tokens cromaticos por Plan
 */

export const PLAN_THEMES = {
  'Azul 1': {
    name: 'Azul 1',
    price: 330,
    c1: '#19a8d8',
    c2: '#0879b9',
    accent: '#00d2ff',
    badge: 'rgba(25, 168, 216, 0.15)'
  },
  'Azul 2': {
    name: 'Azul 2',
    price: 435,
    c1: '#35a9d7',
    c2: '#1976ad',
    accent: '#38c1ff',
    badge: 'rgba(53, 169, 215, 0.15)'
  },
  'Azul 3': {
    name: 'Azul 3',
    price: 550,
    c1: '#16a8a7',
    c2: '#087b82',
    accent: '#00f0d2',
    badge: 'rgba(22, 168, 167, 0.15)'
  },
  'Plata': {
    name: 'Plata',
    price: 650,
    c1: '#9ca7ae',
    c2: '#5e6b73',
    accent: '#e2e8f0',
    badge: 'rgba(156, 167, 174, 0.2)'
  },
  'Oro': {
    name: 'Oro',
    price: 725,
    c1: '#d4af52',
    c2: '#a47716',
    accent: '#ffd700',
    badge: 'rgba(212, 175, 82, 0.2)'
  },
  'Black': {
    name: 'Black',
    price: 825,
    c1: '#29252d',
    c2: '#050507',
    accent: '#a855f7',
    badge: 'rgba(41, 37, 45, 0.4)'
  },
  'Platino': {
    name: 'Platino',
    price: 1035,
    c1: '#d5d5d8',
    c2: '#9699a0',
    accent: '#f8fafc',
    badge: 'rgba(213, 213, 216, 0.2)'
  },
  'Diamante': {
    name: 'Diamante',
    price: 1300,
    c1: '#20a7a8',
    c2: '#087f82',
    accent: '#38bdf8',
    badge: 'rgba(32, 167, 168, 0.2)'
  },
  'Titanio': {
    name: 'Titanio',
    price: 1599,
    c1: '#8a8c8f',
    c2: '#53565a',
    accent: '#f59e0b',
    badge: 'rgba(138, 140, 143, 0.2)'
  }
};

export function resolvePlanTheme(rawPlanName) {
  const str = String(rawPlanName || '').toLowerCase();
  for (const key of Object.keys(PLAN_THEMES)) {
    if (str.includes(key.toLowerCase())) {
      return PLAN_THEMES[key];
    }
  }
  return PLAN_THEMES['Azul 1'];
}