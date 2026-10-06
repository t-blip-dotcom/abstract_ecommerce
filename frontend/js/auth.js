/**
 * auth.js
 * Customer login / register page. After a successful login or
 * signup: sync anything added to the cart as a guest onto the real
 * server cart (see cart.js), then go wherever the person was headed
 * before they were asked to log in — cart-page.js sends people here
 * as login.html?redirect=cart.html, otherwise it's just the home page.
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

async function afterLoginSuccess(message) {
  await window.cartModule.syncLocalCartToServer();
  window.showToast(message, 'success');
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  window.location.href = redirect || 'index.html';
}

function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(loginForm)) return;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await api.post('/auth/login', {
        email_address: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      });
      await afterLoginSuccess('Logged in successfully.');
    } catch (err) {
      window.applyServerFieldErrors(loginForm, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(registerForm)) return;

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      await api.post('/auth/register', {
        name: document.getElementById('register-name').value,
        primary_phone: document.getElementById('register-phone').value,
        email_address: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value
      });
      await afterLoginSuccess('Account created successfully.');
    } catch (err) {
      window.applyServerFieldErrors(registerForm, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
  initAuthForms();
});