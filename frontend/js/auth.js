/**
 * auth.js
 * Customer login / register page: tab switching plus mock submit
 * handlers. Wire these to POST /api/auth/login and
 * POST /api/auth/register once the backend exists — on success the
 * server should set a session cookie and this script just redirects.
 */

function initAuthTabs() {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  const forms = document.querySelectorAll('[data-auth-form]');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      forms.forEach(f => f.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.querySelector(`[data-auth-form="${tab.dataset.authTab}"]`).classList.add('is-active');
    });
  });
}

function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(loginForm)) return;
    // Mock: replace with api.post('/auth/login', { email, password })
    window.showToast('Logged in successfully.', 'success');
    window.location.href = 'index.html';
  });

  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(registerForm)) return;
    // Mock: replace with api.post('/auth/register', { name, email, phone, password })
    window.showToast('Account created successfully.', 'success');
    window.location.href = 'index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
  initAuthForms();
});
