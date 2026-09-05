export const MODES = ['LIGHT', 'DARK', 'SYSTEM', 'BLACK_WHITE'];
export const PALETTES = [
  ['purple', 'Purple Raindrops', '#6344d5', '#4338ca'],
  ['nightfall', 'Vivid Nightfall', '#7c3aed', '#db2777'],
  ['ocean', 'Ocean Blue', '#0369a1', '#0891b2'],
  ['emerald', 'Emerald', '#047857', '#0f766e'],
  ['sunset', 'Sunset', '#c2410c', '#b45309'],
  ['rose', 'Rose', '#be123c', '#a21caf'],
  ['graphite', 'Graphite', '#374151', '#64748b'],
  ['monochrome', 'Black & White', '#000000', '#525252'],
].map(([id, name, primary, accent]) => ({ id, name, primary, accent }));
export const DEFAULTS = { mode: 'SYSTEM', palette: 'purple', favorites: [], customs: [] };
export const COLOR_FIELDS = ['primary', 'secondary', 'accent', 'background', 'surface', 'sidebar', 'foreground', 'mutedForeground', 'border'];
export const validHex = (value) => /^#[\da-f]{6}$/i.test(value || '');
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function mix(a, b, amount) {
  return '#' + rgb(a).map((n, i) => Math.round(n * (1 - amount) + rgb(b)[i] * amount).toString(16).padStart(2, '0')).join('');
}
function luminance(hex) {
  return rgb(hex).map((n) => { const s = n / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((a, n, i) => a + n * [.2126, .7152, .0722][i], 0);
}
export function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
export function onColor(color) { return contrast(color, '#ffffff') >= contrast(color, '#0a0a0a') ? '#ffffff' : '#0a0a0a'; }
function readable(color, background) { return contrast(color, background) >= 4.5 ? color : onColor(background); }
export function sanitize(value) {
  const customs = Array.isArray(value?.customs) ? value.customs.filter((p) => typeof p?.id === 'string' && p.id.startsWith('custom-') && typeof p.name === 'string' && p.name.trim() && COLOR_FIELDS.every((key) => validHex(p[key]))).slice(0, 50).map((p) => Object.fromEntries(['id', 'name', ...COLOR_FIELDS].map((key) => [key, p[key].slice(0, 80)]))) : [];
  const ids = [...PALETTES, ...customs].map((p) => p.id);
  return { mode: MODES.includes(value?.mode) ? value.mode : DEFAULTS.mode, palette: ids.includes(value?.palette) ? value.palette : DEFAULTS.palette, favorites: Array.isArray(value?.favorites) ? [...new Set(value.favorites.filter((id) => ids.includes(id)))] : [], customs };
}
export function paletteFor(preferences) { return [...PALETTES, ...preferences.customs].find((p) => p.id === preferences.palette) || PALETTES[0]; }
export function paletteStrip(palette) {
  if (palette.id === 'monochrome') return ['#000000','#171717','#262626','#404040','#737373','#a3a3a3','#d4d4d4','#ffffff'];
  return [mix(palette.primary, '#000000', .65), mix(palette.primary, '#000000', .35), palette.primary, palette.accent, mix(palette.accent, '#ffffff', .25), mix(palette.primary, '#ffffff', .55), mix(palette.primary, '#ffffff', .78), mix(palette.primary, '#ffffff', .93)];
}
export function themeTokens(preferences, systemDark = false) {
  const mode = preferences.mode === 'SYSTEM' ? (systemDark ? 'DARK' : 'LIGHT') : preferences.mode;
  const dark = mode === 'DARK', mono = mode === 'BLACK_WHITE' || preferences.palette === 'monochrome';
  const p = paletteFor(preferences), custom = p.id.startsWith('custom-') && !mono;
  const background = mono ? (dark ? '#111111' : '#ffffff') : custom ? (dark ? mix(p.background, '#0b1020', .94) : p.background) : dark ? '#10131a' : '#f5f7fb';
  const surface = mono ? (dark ? '#1b1b1b' : '#ffffff') : custom ? (dark ? mix(p.surface, '#171b25', .94) : p.surface) : dark ? '#1b202b' : '#ffffff';
  const foreground = readable(custom && !dark ? p.foreground : dark ? '#f5f5f5' : '#0a0a0a', surface);
  const primary = mono ? (dark ? '#f5f5f5' : '#000000') : dark ? mix(p.primary, '#ffffff', .35) : p.primary;
  const accent = mono ? (dark ? '#d4d4d4' : '#525252') : dark ? mix(p.accent, '#ffffff', .3) : p.accent;
  const secondary = custom ? (dark ? mix(p.secondary, surface, .85) : p.secondary) : dark ? (mono ? '#282828' : '#282f3d') : mono ? '#f7f7f7' : '#eef1f6';
  const border = custom ? (dark ? mix(p.border, surface, .7) : p.border) : dark ? (mono ? '#404040' : '#404858') : mono ? '#e5e5e5' : '#dce1e9';
  const muted = readable(custom && !dark ? p.mutedForeground : dark ? (mono ? '#b3b3b3' : '#aeb8c8') : mono ? '#525252' : '#596579', surface);
  const sidebar = mono ? '#050505' : custom ? p.sidebar : '#111827';
  const sidebarForeground = onColor(sidebar);
  const tokens = {
    background, foreground, surface, 'surface-secondary': secondary, card: surface, 'card-foreground': foreground,
    primary, 'primary-foreground': onColor(primary), 'primary-hover': mix(primary, onColor(primary) === '#ffffff' ? '#000000' : '#ffffff', .12),
    'primary-text': readable(primary, mix(primary, surface, .90)), 'primary-soft': mix(primary, surface, .90), 'primary-border': mix(primary, surface, .55),
    secondary, 'secondary-foreground': readable(foreground, secondary), muted: secondary, 'muted-foreground': muted,
    accent, 'accent-foreground': onColor(accent), 'accent-text': readable(accent, mix(accent, surface, .90)), 'accent-soft': mix(accent, surface, .9),
    border, input: surface, ring: primary, sidebar, 'sidebar-foreground': sidebarForeground,
    'sidebar-muted': mix(sidebarForeground, sidebar, .28), 'sidebar-active': mono ? '#ffffff' : primary,
    'sidebar-active-foreground': mono ? '#000000' : onColor(primary),
    hero: mono ? '#111111' : '#111827', 'hero-end': mono ? '#262626' : mix(p.primary, '#111827', .65), 'hero-foreground': '#ffffff', 'hero-muted': mono ? '#d4d4d4' : '#cbd5e1',
    hover: mono ? (dark ? '#303030' : '#f2f2f2') : secondary, overlay: '#000000',
  };
  for (const [key, color, gray] of [['success','#047857','#171717'],['warning','#854d0e','#525252'],['danger','#b91c1c','#0a0a0a'],['info','#0369a1','#404040']]) {
    const base = mono ? (dark ? mix(gray, '#ffffff', .75) : gray) : dark ? mix(color, '#ffffff', .55) : color;
    tokens[key] = readable(base, surface);
    tokens[`${key}-soft`] = mix(base, surface, .9);
    tokens[`${key}-border`] = mix(base, surface, .6);
    tokens[`${key}-foreground`] = onColor(tokens[key]);
  }
  const chart = mono ? (dark ? ['#eeeeee','#cccccc','#aaaaaa','#888888','#666666','#555555','#444444'] : ['#111111','#333333','#555555','#777777','#999999','#bbbbbb','#dddddd']) : [primary, accent, mix(primary, '#ffffff', .4), tokens.success, tokens.warning, tokens.info, tokens.danger];
  chart.forEach((color, index) => { tokens[`chart-${index + 1}`] = color; });
  return { mode, mono, tokens };
}
export function applyTheme(preferences, systemDark = false, element = document.documentElement) {
  const { mode, mono, tokens } = themeTokens(preferences, systemDark);
  Object.entries(tokens).forEach(([key, value]) => element.style.setProperty(`--${key}`, value));
  element.dataset.theme = mode.toLowerCase();
  element.dataset.monochrome = String(mono);
  element.style.colorScheme = mode === 'DARK' ? 'dark' : 'light';
  element.style.backgroundColor = tokens.background;
  element.style.color = tokens.foreground;
}
export const storageKey = (userId) => `remote-office-appearance:v1:${userId ?? 'guest'}`;
export function readPreferences(userId, storage) {
  try { return sanitize(JSON.parse((storage ?? localStorage).getItem(storageKey(userId)))); } catch { return sanitize(null); }
}
export function initialPreferences() {
  try { return readPreferences(localStorage.getItem('remote-office-appearance:last-user')); } catch { return sanitize(null); }
}
