/**
 * ARSA Cotizador Next - Theme Engine
 * Temas Crystal Glass y contraste adaptativo por plan.
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
    c1: '#f6f9fd',
    c2: '#8498b0',
    glow: 'rgba(218, 235, 255, 0.42)',
    glass: 'rgba(226, 239, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.62)',
    text: '#142238',
    textSoft: '#2e4059',
    headerShadow: '0 1px 1px rgba(255, 255, 255, 0.60)',
    lightPlan: true
  },

  Oro: {
    name: 'Oro',
    price: 725,
    c1: '#e8c55d',
    c2: '#ab7811',
    glow: 'rgba(240, 198, 84, 0.40)',
    glass: 'rgba(240, 198, 84, 0.17)',
    border: 'rgba(255, 231, 151, 0.46)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.90)',
    headerShadow: '0 2px 8px rgba(71, 43, 0, 0.28)',
    lightPlan: false
  },

  Black: {
    name: 'Black',
    price: 825,
    c1: '#373540',
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
    c2: '#8495aa',
    glow: 'rgba(236, 247, 255, 0.48)',
    glass: 'rgba(243, 250, 255, 0.20)',
    border: 'rgba(255, 255, 255, 0.66)',
    text: '#142238',
    textSoft: '#2e4059',
    headerShadow: '0 1px 1px rgba(255, 255, 255, 0.65)',
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
    c2: '#4e5964',
    glow: 'rgba(210, 221, 232, 0.40)',
    glass: 'rgba(218, 227, 236, 0.16)',
    border: 'rgba(245, 248, 252, 0.44)',
    text: '#ffffff',
    textSoft: 'rgba(255, 255, 255, 0.88)',
    headerShadow: '0 2px 8px rgba(0, 0, 0, 0.28)',
    lightPlan: false
  }
};

export function resolvePlanTheme(planName = '') {
  const normalized = String(planName)
    .trim()
    .toLowerCase();

  const foundTheme = Object.values(PLAN_THEMES).find(theme =>
    normalized.includes(theme.name.toLowerCase())
  );

  return foundTheme || PLAN_THEMES['Azul 1'];
}
