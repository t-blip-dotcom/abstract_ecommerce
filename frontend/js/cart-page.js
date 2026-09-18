/**
 * cart-page.js
 * Full cart view (as opposed to the header preview in cart.js).
 * Reads/writes through window.cartModule so both stay in sync.
 * Checkout opens a modal that mocks the M-Pesa STK push flow —
 * wire this to POST /api/orders + POST /api/payments/mpesa/stk-push
 * once the backend exists.
 */

const DELIVERY_FEE = 200;

function cartLineTemplate(item) {
  return `
    <div class="cart-line" data-line-id="${item.product_id}">
      <img src="${item.photo_url || `https://placehold.co/80x80/E1F1FB/0074BD?text=${encodeURIComponent(item.name.charAt(0))}`}" alt="${item.name}">
      <div>
        <p class="cart-line-name">${item.name}</p>
        <span class="cart-line-unit-price">KSh ${item.price.toLocaleString('en-KE')} each</span>
        <div class="quantity-stepper cart-line-quantity-stepper">
          <button type="button" data-decrease="${item.product_id}" aria-label="Decrease quantity">&minus;</button>
          <input type="text" value="${item.quantity}" data-qty-input="${item.product_id}" inputmode="numeric" aria-label="Quantity">
          <button type="button" data-increase="${item.product_id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <span class="cart-line-total">KSh ${(item.price * item.quantity).toLocaleString('en-KE')}</span>
      <button class="cart-line-remove" data-remove="${item.product_id}" aria-label="Remove ${item.name}">
        <i data-lucide="trash-2"></i>
      </button>
    </div>`;
}

function renderCartPage() {
  const list = document.getElementById('cart-lines');
  const emptyState = document.getElementById('cart-empty-state');
  const summary = document.getElementById('order-summary');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!list) return;

  const items = window.cartModule.readCart();

  if (items.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('is-hidden');
    summary.classList.add('is-hidden');
    checkoutBtn.disabled = true;
  } else {
    emptyState.classList.add('is-hidden');
    summary.classList.remove('is-hidden');
    list.innerHTML = items.map(cartLineTemplate).join('');

    const subtotal = window.cartModule.getTotal();
    document.getElementById('summary-subtotal').textContent = `KSh ${subtotal.toLocaleString('en-KE')}`;
    document.getElementById('summary-delivery').textContent = `KSh ${DELIVERY_FEE.toLocaleString('en-KE')}`;
    document.getElementById('summary-total').textContent = `KSh ${(subtotal + DELIVERY_FEE).toLocaleString('en-KE')}`;
  }

  if (window.lucide) lucide.createIcons();
  attachLineHandlers();
}

function attachLineHandlers() {
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.cartModule.removeItem(Number(btn.dataset.remove));
      renderCartPage();
    });
  });

  document.querySelectorAll('[data-increase]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.increase);
      const item = window.cartModule.readCart().find(i => i.product_id === id);
      if (item) {
        window.cartModule.updateQuantity(id, item.quantity + 1);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('[data-decrease]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.decrease);
      const item = window.cartModule.readCart().find(i => i.product_id === id);
      if (item) {
        window.cartModule.updateQuantity(id, item.quantity - 1);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('[data-qty-input]').forEach(input => {
    input.addEventListener('change', () => {
      const id = Number(input.dataset.qtyInput);
      const value = Math.max(1, Number(input.value) || 1);
      window.cartModule.updateQuantity(id, value);
      renderCartPage();
    });
  });
}

function generatePickupCode() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PU-${random}`;
}

function initFulfillmentToggle() {
  const pickupRadio = document.getElementById('fulfillment-pickup');
  const deliveryRadio = document.getElementById('fulfillment-delivery');
  const addressField = document.getElementById('shipping-address-field');
  const addressInput = document.getElementById('shipping-address');

  function sync() {
    const isDelivery = deliveryRadio.checked;
    addressField.classList.toggle('is-hidden', !isDelivery);
    addressInput.required = isDelivery;
    if (!isDelivery) {
      addressField.classList.remove('has-error');
      addressInput.value = '';
    }
  }

  pickupRadio.addEventListener('change', sync);
  deliveryRadio.addEventListener('change', sync);
  sync();
}

function initCheckoutModal() {
  const overlay = document.getElementById('checkout-modal');
  const openBtn = document.getElementById('checkout-btn');
  const closeBtn = document.getElementById('checkout-modal-close');
  const form = document.getElementById('checkout-form');
  const formStep = document.getElementById('checkout-form-step');
  const successStep = document.getElementById('checkout-success-step');
  const successPickup = document.getElementById('checkout-success-pickup');
  const successDelivery = document.getElementById('checkout-success-delivery');

  if (!overlay || !openBtn) return;

  initFulfillmentToggle();

  openBtn.addEventListener('click', () => {
    formStep.classList.remove('is-hidden');
    successStep.classList.add('is-hidden');
    overlay.classList.add('is-open');
  });

  closeBtn.addEventListener('click', () => overlay.classList.remove('is-open'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('is-open');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const phoneInput = document.getElementById('mpesa-phone');
    const phoneField = phoneInput.closest('.field');
    const phoneDigits = phoneInput.value.replace(/\s+/g, '');
    const validPhone = /^(?:\+254|0)7\d{8}$/.test(phoneDigits);

    if (!validPhone) {
      phoneField.classList.add('has-error');
      let errorEl = phoneField.querySelector('.field-error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'field-error';
        phoneField.appendChild(errorEl);
      }
      errorEl.textContent = 'Enter a valid M-Pesa number, e.g. 0712 345 678.';
      window.showToast('That phone number doesn\'t look right — please check it.', 'error');
      phoneInput.focus();
      return;
    }
    phoneField.classList.remove('has-error');

    const isPickup = document.getElementById('fulfillment-pickup').checked;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending STK push...';

    // Mock delay — replace with a real POST /api/orders + POST
    // /api/payments/mpesa/stk-push call. The pickup code/QR below
    // should come back from that order-creation response instead
    // of being generated in the browser.
    setTimeout(() => {
      formStep.classList.add('is-hidden');
      successStep.classList.remove('is-hidden');

      if (isPickup) {
        const code = generatePickupCode();
        document.getElementById('pickup-code').textContent = code;
        // Demo QR via a public QR image API — swap for a QR image the
        // backend generates and returns once that endpoint exists.
        document.getElementById('pickup-qr').src =
          `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(code)}`;
        successPickup.classList.remove('is-hidden');
        successDelivery.classList.add('is-hidden');
        window.showToast('Order placed — check your phone to complete payment.', 'success');
      } else {
        successPickup.classList.add('is-hidden');
        successDelivery.classList.remove('is-hidden');
        window.showToast('Order placed — we\'ll be in touch about delivery.', 'success');
      }

      if (window.lucide) lucide.createIcons();
      localStorage.removeItem('cosmeticshop_cart');
      document.getElementById('cart-badge').textContent = 0;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send STK push';
    }, 1400);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
  initCheckoutModal();
});