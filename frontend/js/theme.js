/**
 * theme.js
 * Three modes: "auto" (follows the device's light/dark setting —
 * the default for anyone who hasn't chosen otherwise), "light", and
 * "dark". Clicking the toggle cycles auto -> light -> dark -> auto.
 * The button always shows the current mode as text so a first-time
 * visitor knows what they're looking at.
 */

const THEME_MODE_KEY = 'cosmeticshop_theme_mode';
const THEME_MODES = ['auto', 'light', 'dark'];
const THEME_LABELS = { auto: 'Auto', light: 'Light', dark: 'Dark' };

function getStoredMode() {
  const stored = localStorage.getItem(THEME_MODE_KEY);
  return THEME_MODES.includes(stored) ? stored : 'auto';
}

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveVisualTheme(mode) {
  if (mode === 'auto') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

function applyMode(mode) {
  document.documentElement.setAttribute('data-theme', resolveVisualTheme(mode));
  document.documentElement.setAttribute('data-theme-mode', mode);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.setAttribute('title', `Color theme: ${THEME_LABELS[mode]} (click to change)`);
    const label = toggleBtn.querySelector('.theme-toggle-label');
    if (label) label.textContent = THEME_LABELS[mode];
  }
}

function initTheme() {
  let mode = getStoredMode();
  applyMode(mode);

  // If the person hasn't chosen a mode, keep following the device live.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredMode() === 'auto') applyMode('auto');
  });

  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    mode = THEME_MODES[(THEME_MODES.indexOf(mode) + 1) % THEME_MODES.length];
    localStorage.setItem(THEME_MODE_KEY, mode);
    applyMode(mode);
  });
}

document.addEventListener('DOMContentLoaded', initTheme);
