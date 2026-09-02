/**
 * ARSA Cotizador Next - Plan Themes
 * Temas Crystal Glass por plan.
 */

export const PLAN_THEMES = {
  'Azul 1': {
    name: 'Azul 1',
    price: 330,
    c1: '#26c6f5',
    c2: '#1271db',
    glow: 'rgba(38, 198, 245, 0.40)',
    glass: 'rgba(38, 198, 245, 0.16)',
    border: 'rgba(144, 230, 255, 0.40)',
    text: '#ecfbff'
  },

  'Azul 2': {
    name: 'Azul 2',
    price: 435,
    c1: '#4fd4ff',
    c2: '#2886e7',
    glow: 'rgba(79, 212, 255, 0.40)',
    glass: 'rgba(79, 212, 255, 0.16)',
    border: 'rgba(170, 235, 255, 0.42)',
    text: '#effcff'
  },

  'Azul 3': {
    name: 'Azul 3',
    price: 550,
    c1: '#43ded4',
    c2: '#0a8f9f',
    glow: 'rgba(67, 222, 212, 0.38)',
    glass: 'rgba(67, 222, 212, 0.16)',
    border: 'rgba(167, 255, 247, 0.40)',
    text: '#effffc'
  },

  Plata: {
    name: 'Plata',
    price: 650,
    c1: '#e8f0fa',
    c2: '#71849d',
    glow: 'rgba(217, 233, 255, 0.36)',
    glass: 'rgba(219, 235, 255, 0.17)',
    border: 'rgba(255, 255, 255, 0.50)',
    text: '#ffffff'
  },

  Oro: {
    name: 'Oro',
    price: 725,
    c1: '#f7d76c',
    c2: '#b98612',
    glow: 'rgba(247, 215, 108, 0.38)',
    glass: 'rgba(247, 215, 108, 0.17)',
    border: 'rgba(255, 235, 168, 0.46)',
    text: '#fffdf4'
  },

  Black: {
    name: 'Black',
    price: 825,
    c1: '#4c4c58',
    c2: '#07070a',
    glow: 'rgba(166, 123, 255, 0.26)',
    glass: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.26)',
    text: '#ffffff'
  },

  Platino: {
    name: 'Platino',
    price: 1035,
    c1: '#ffffff',
    c2: '#8797ab',
    glow: 'rgba(238, 247, 255, 0.42)',
    glass: 'rgba(244, 251, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.58)',
    text: '#ffffff'
  },

  Diamante: {
    name: 'Diamante',
    price: 1300,
    c1: '#68f1e3',
    c2: '#1498b7',
    glow: 'rgba(104, 241, 227, 0.42)',
    glass: 'rgba(104, 241, 227, 0.16)',
    border: 'rgba(188, 255, 248, 0.48)',
    text: '#f0ffff'
  },

  Titanio: {
    name: 'Titanio',
    price: 1599,
    c1: '#d1d4d7',
    c2: '#515a62',
    glow: 'rgba(211, 217, 223, 0.36)',
    glass: 'rgba(218, 224, 230, 0.16)',
    border: 'rgba(244, 247, 250, 0.42)',
    text: '#ffffff'
  }
};

export function resolvePlanTheme(planName = '') {
  const normalized = String(planName).trim().toLowerCase();

  return Object.values(PLAN_THEMES).find(theme =>
    normalized.includes(theme.name.toLowerCase())
  ) || PLAN_THEMES['Azul 1'];
}
