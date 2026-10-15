

let cartItems = [];

function cartLineTemplate(item) {
  const soldOut = item.is_available === false;
  const thumb = api.assetUrl(item.photo_url) || `https://placehold.co/80x80/E1F1FB/0074BD?text=${encodeURIComponent(item.name.charAt(0))}`;

  return `
    <div class="cart-line ${soldOut ? 'cart-line--sold-out' : ''}" data-line-id="${item.product_id}">
      <img src="${thumb}" alt="${item.name}">
      <div>
        <p class="cart-line-name">${item.name}</p>
        <span class="cart-line-unit-price">KSh ${item.price.toLocaleString('en-KE')} each</span>
        ${soldOut ? '<span class="cart-line-unavailable-note">Sold out — remove or reduce quantity to continue</span>' : ''}
        <div class="quantity-stepper cart-line-quantity-stepper">
          <button type="button" data-decrease="${item.product_id}" aria-label="Decrease quantity" ${soldOut ? 'disabled' : ''}>&minus;</button>
          <input type="text" value="${item.quantity}" data-qty-input="${item.product_id}" inputmode="numeric" aria-label="Quantity" ${soldOut ? 'disabled' : ''}>
          <button type="button" data-increase="${item.product_id}" aria-label="Increase quantity" ${soldOut ? 'disabled' : ''}>+</button>
        </div>
      </div>
      <span class="cart-line-total">KSh ${(item.price * item.quantity).toLocaleString('en-KE')}</span>
      <button class="cart-line-remove" data-remove="${item.product_id}" aria-label="Remove ${item.name}">
        <i data-lucide="trash-2"></i>
      </button>
    </div>`;
}
function updateSummaryDisplay(subtotal) {
  const isDelivery = document.getElementById('fulfillment-delivery')?.checked;
  
  document.getElementById('summary-subtotal').textContent = `KSh ${subtotal.toLocaleString('en-KE')}`;
  
  if (isDelivery) {
    document.getElementById('summary-delivery').textContent = 'To be agreed';
    document.getElementById('summary-total').textContent = `KSh ${subtotal.toLocaleString('en-KE')} + Transport`;
  } else {
    document.getElementById('summary-delivery').textContent = 'KSh 0';
    document.getElementById('summary-total').textContent = `KSh ${subtotal.toLocaleString('en-KE')}`;
  }
}

async function renderCartPage() {
  const list = document.getElementById('cart-lines');
  const emptyState = document.getElementById('cart-empty-state');
  const summary = document.getElementById('order-summary');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!list) return;

  cartItems = await window.cartModule.readCart();

  if (cartItems.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('is-hidden');
    summary.classList.add('is-hidden');
    checkoutBtn.disabled = true;
  } else {
    emptyState.classList.add('is-hidden');
    summary.classList.remove('is-hidden');
    list.innerHTML = cartItems.map(cartLineTemplate).join('');

    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    window.currentCartSubtotal = subtotal;
    updateSummaryDisplay(subtotal);
    // Block checkout while anything in the cart just sold out.
    checkoutBtn.disabled = cartItems.some(i => i.is_available === false);
  }

  if (window.lucide) lucide.createIcons();
  attachLineHandlers();
}

function findItem(productId) {
  return cartItems.find(i => i.product_id === productId);
}

function attachLineHandlers() {
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item = findItem(Number(btn.dataset.remove));
      if (item) {
        await window.cartModule.removeItem(item);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('[data-increase]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item = findItem(Number(btn.dataset.increase));
      if (item) {
        await window.cartModule.updateQuantity(item, item.quantity + 1);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('[data-decrease]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item = findItem(Number(btn.dataset.decrease));
      if (item) {
        await window.cartModule.updateQuantity(item, item.quantity - 1);
        renderCartPage();
      }
    });
  });

  document.querySelectorAll('[data-qty-input]').forEach(input => {
    input.addEventListener('change', async () => {
      const item = findItem(Number(input.dataset.qtyInput));
      const value = Math.max(1, Number(input.value) || 1);
      if (item) {
        await window.cartModule.updateQuantity(item, value);
        renderCartPage();
      }
    });
  });
}

function initCheckoutFieldToggles() {
  const pickupRadio = document.getElementById('fulfillment-pickup');
  const deliveryRadio = document.getElementById('fulfillment-delivery');
  const mpesaRadio = document.getElementById('payment-mpesa');
  const cashRadio = document.getElementById('payment-cash');
  const addressField = document.getElementById('shipping-address-field');
  const addressInput = document.getElementById('shipping-address');
  const phoneField = document.getElementById('mpesa-phone-field');
  const phoneInput = document.getElementById('mpesa-phone');
  const cashHint = document.getElementById('cash-payment-hint');
  const submitBtn = document.getElementById('checkout-submit-btn');

  function sync() {
    const isDelivery = deliveryRadio.checked;
    const isCash = cashRadio.checked;

    addressField.classList.toggle('is-hidden', !isDelivery);
    addressInput.required = isDelivery;
    if (!isDelivery) {
      addressField.classList.remove('has-error');
      addressInput.value = '';
    }

    phoneField.classList.toggle('is-hidden', isCash);
    phoneInput.required = !isCash;
    if (isCash) {
      phoneField.classList.remove('has-error');
    }

    cashHint.textContent = isDelivery
      ? 'Pay in cash when your order is delivered.'
      : 'Pay in cash when you collect your order.';

    submitBtn.textContent = isCash ? 'Place order' : 'Send STK push';
  }
  if (window.currentCartSubtotal) updateSummaryDisplay(window.currentCartSubtotal);

  [pickupRadio, deliveryRadio, mpesaRadio, cashRadio].forEach(radio =>
    radio.addEventListener('change', sync)
  );
  sync();
}


async function reconcileShortages(shortages) {
  for (const shortage of shortages) {
    const item = findItem(shortage.product_id);
    if (!item) continue;

    if (shortage.available === 0) {
      await window.cartModule.removeItem(item);
    } else {
      await window.cartModule.updateQuantity(item, shortage.available);
    }
  }
  await renderCartPage();
}

async function initCheckoutModal() {
  const overlay = document.getElementById('checkout-modal');
  const openBtn = document.getElementById('checkout-btn');
  const closeBtn = document.getElementById('checkout-modal-close');
  const form = document.getElementById('checkout-form');
  const formStep = document.getElementById('checkout-form-step');
  const successStep = document.getElementById('checkout-success-step');
  const successPickup = document.getElementById('checkout-success-pickup');
  const successDelivery = document.getElementById('checkout-success-delivery');

  if (!overlay || !openBtn) return;

  initCheckoutFieldToggles();

  openBtn.addEventListener('click', async () => {
    // Checkout needs a real account — cart_items live server-side
    // once you're logged in, and that's what checkout reads from.
    if (!(await window.cartModule.isLoggedInCustomer())) {
      window.showToast('Please log in to complete your purchase.', 'error');
      window.location.href = '/login?redirect=/cart';
      return;
    }

    formStep.classList.remove('is-hidden');
    successStep.classList.add('is-hidden');
    overlay.classList.add('is-open');
  });

  closeBtn.addEventListener('click', () => overlay.classList.remove('is-open'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('is-open');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const isCash = document.getElementById('payment-cash').checked;
    const phoneInput = document.getElementById('mpesa-phone');

    if (!isCash) {
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
    }

    const isPickup = document.getElementById('fulfillment-pickup').checked;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = isCash ? 'Placing order...' : 'Sending STK push...';

    const paymentNote = isCash
      ? (isPickup ? 'Have the exact cash ready when you collect your order.' : 'Have the exact cash ready for our delivery person.')
      : 'Check your phone and enter your M-Pesa PIN to complete the payment.';

    try {
      const order = await api.post('/orders/checkout', {
        payment_method: isCash ? 'cash_on_delivery' : 'mpesa',
        fulfillment_method: isPickup ? 'pickup' : 'delivery',
        shipping_address: isPickup ? undefined : document.getElementById('shipping-address').value
      });

      formStep.classList.add('is-hidden');
      successStep.classList.remove('is-hidden');

      if (isPickup) {
        document.getElementById('pickup-payment-note').textContent = paymentNote;
        document.getElementById('pickup-code').textContent = order.pickup_code;
        document.getElementById('pickup-qr').src = order.pickup_qr_data_url;
        successPickup.classList.remove('is-hidden');
        successDelivery.classList.add('is-hidden');
      } else {
        document.getElementById('delivery-payment-note').textContent = paymentNote;
        successPickup.classList.add('is-hidden');
        successDelivery.classList.remove('is-hidden');
      }

      window.showToast(
        isCash ? 'Order placed — pay cash when you get it.' : 'Order placed — check your phone to complete payment.',
        'success'
      );

      if (window.lucide) lucide.createIcons();
      document.getElementById('cart-badge').textContent = 0;
      document.getElementById('cart-badge').dataset.count = 0;
    } catch (err) {
      if (err.status === 409 && err.data?.shortages) {
        overlay.classList.remove('is-open');
        await reconcileShortages(err.data.shortages);
        window.showToast("Some items in your cart sold out or dropped in stock — we've updated your cart. Please review and try again.", 'error');
      } else {
        window.showToast(err.message, 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isCash ? 'Place order' : 'Send STK push';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
  initCheckoutModal();
});