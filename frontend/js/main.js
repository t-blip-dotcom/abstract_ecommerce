/**
 * main.js
 * Page-wide glue: renders lucide icons once everything else has
 * written its markup, and handles opening/closing the cart and
 * notifications dropdown panels (click trigger, click outside, Escape).
 */

function initIcons() {
  if (window.lucide) lucide.createIcons();
}

function closeAllPanels(except) {
  document.querySelectorAll('.dropdown-panel.is-open').forEach(panel => {
    if (panel !== except) panel.classList.remove('is-open');
  });
}

function initDropdown(triggerId, panelId) {
  const trigger = document.getElementById(triggerId);
  const panel = document.getElementById(panelId);
  if (!trigger || !panel) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !panel.classList.contains('is-open');
    closeAllPanels();
    panel.classList.toggle('is-open', willOpen);
  });

  panel.addEventListener('click', (e) => e.stopPropagation());

  panel.querySelectorAll('[data-close-panel]').forEach(btn => {
    btn.addEventListener('click', () => panel.classList.remove('is-open'));
  });
}

let toastTimer;
function showToast(message, type = 'success') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    document.body.appendChild(toast);
  }
  const icon = type === 'error' ? 'alert-circle' : 'check-circle';
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
  if (window.lucide) lucide.createIcons();

  clearTimeout(toastTimer);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}
window.showToast = showToast;

function initGlobalDismiss() {
  document.addEventListener('click', () => closeAllPanels());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPanels();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initDropdown('cart-trigger', 'cart-panel');
  initDropdown('notifications-trigger', 'notifications-panel');
  initGlobalDismiss();

  // Re-run icon creation once the dynamic modules (products, cart,
  // notifications) finish their first render.
  setTimeout(initIcons, 50);
});
