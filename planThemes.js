/**
 * ARSA Cotizador Next - Theme Engine
 * Colores Crystal Glass con contraste adaptativo.
 */

export const PLAN_THEMES = {
  'Azul 1': {
    name: 'Azul 1',
    price: 330,
    c1: '#19a8d8',
    c2: '#0879b9',
    glow: 'rgba(25, 168, 216, 0.40)',
    glass: 'rgba(25, 168, 216, 0.16)',
    border: 'rgba(148, 230, 255, 0.40)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.88)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.24)',
    lightPlan: false
  },

  'Azul 2': {
    name: 'Azul 2',
    price: 435,
    c1: '#35a9d7',
    c2: '#1976ad',
    glow: 'rgba(53, 169, 215, 0.40)',
    glass: 'rgba(53, 169, 215, 0.16)',
    border: 'rgba(166, 231, 255, 0.40)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.88)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.24)',
    lightPlan: false
  },

  'Azul 3': {
    name: 'Azul 3',
    price: 550,
    c1: '#16a8a7',
    c2: '#087b82',
    glow: 'rgba(22, 168, 167, 0.38)',
    glass: 'rgba(22, 168, 167, 0.16)',
    border: 'rgba(160, 255, 250, 0.38)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.88)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.24)',
    lightPlan: false
  },

  Plata: {
    name: 'Plata',
    price: 650,
    c1: '#eef4fb',
    c2: '#7e91a8',
    glow: 'rgba(215, 234, 255, 0.45)',
    glass: 'rgba(224, 240, 255, 0.20)',
    border: 'rgba(255, 255, 255, 0.68)',
    text: '#13233a',
    textSoft: '#2b405d',
    headerShadow: '0 1px 1px rgba(255, 255, 255, 0.72)',
    lightPlan: true
  },

  Oro: {
    name: 'Oro',
    price: 725,
    c1: '#e9c75f',
    c2: '#aa7710',
    glow: 'rgba(240, 199, 87, 0.40)',
    glass: 'rgba(240, 199, 87, 0.17)',
    border: 'rgba(255, 232, 155, 0.46)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.90)',
    headerShadow: '0 2px 8px rgba(71, 43, 0, 0.30)',
    lightPlan: false
  },

  Black: {
    name: 'Black',
    price: 825,
    c1: '#393640',
    c2: '#050506',
    glow: 'rgba(158, 112, 255, 0.28)',
    glass: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.26)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.86)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.50)',
    lightPlan: false
  },

  Platino: {
    name: 'Platino',
    price: 1035,
    c1: '#ffffff',
    c2: '#7f91a7',
    glow: 'rgba(235, 247, 255, 0.50)',
    glass: 'rgba(242, 250, 255, 0.22)',
    border: 'rgba(255, 255, 255, 0.70)',
    text: '#13233a',
    textSoft: '#2b405d',
    headerShadow: '0 1px 1px rgba(255, 255, 255, 0.74)',
    lightPlan: true
  },

  Diamante: {
    name: 'Diamante',
    price: 1300,
    c1: '#20a7a8',
    c2: '#087f82',
    glow: 'rgba(72, 231, 224, 0.42)',
    glass: 'rgba(72, 231, 224, 0.16)',
    border: 'rgba(185, 255, 250, 0.46)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.88)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.24)',
    lightPlan: false
  },

  Titanio: {
    name: 'Titanio',
    price: 1599,
    c1: '#cbd0d7',
    c2: '#4d5863',
    glow: 'rgba(210, 221, 232, 0.40)',
    glass: 'rgba(218, 227, 236, 0.16)',
    border: 'rgba(245, 248, 252, 0.44)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.88)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.30)',
    lightPlan: false
  }
};

export function resolvePlanTheme(planName = '') {
  const normalized = String(planName)
    .trim()
    .toLowerCase();

  const theme = Object.values(PLAN_THEMES).find(item =>
    normalized.includes(item.name.toLowerCase())
  );

  return theme || PLAN_THEMES['Azul 1'];
}
