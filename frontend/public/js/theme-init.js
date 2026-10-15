
(function () {
  var THEME_MODE_KEY = 'cosmeticshop_theme_mode';
  var mode = localStorage.getItem(THEME_MODE_KEY);
  if (mode !== 'light' && mode !== 'dark') mode = 'auto';
 
  var resolved = mode === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
 
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-mode', mode);
})();