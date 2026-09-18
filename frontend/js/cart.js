/**
 * cart.js
 * Client-side cart state, persisted in localStorage so it survives a
 * refresh. Once a customer is logged in, `syncCartToServer()` is the
 * spot to POST this into the `cart` / `cart_items` tables instead.
 */

const CART_STORAGE_KEY = 'cosmeticshop_cart';

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  updateCartBadge();
}

function addItem(product, quantity = 1) {
  const items = readCart();
  const existing = items.find(i => i.product_id === product.product_id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      photo_url: product.photo_url,
      quantity
    });
  }
  writeCart(items);
  renderCartPreview();
}

function removeItem(productId) {
  const items = readCart().filter(i => i.product_id !== productId);
  writeCart(items);
  renderCartPreview();
}

function updateQuantity(productId, quantity) {
  const items = readCart();
  const item = items.find(i => i.product_id === productId);
  if (!item) return;
  if (quantity <= 0) {
    return removeItem(productId);
  }
  item.quantity = quantity;
  writeCart(items);
  renderCartPreview();
}

function getTotal() {
  return readCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function getItemCount() {
  // Number of distinct products in the cart, not the summed quantity —
  // the badge answers "how many different things are in here?"
  return readCart().length;
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getItemCount();
  badge.textContent = count;
  badge.dataset.count = count;
}

function cartPreviewItemTemplate(item) {
  return `
    <li class="cart-preview-item">
      <img src="${item.photo_url || `https://placehold.co/80x80/E1F1FB/0074BD?text=${encodeURIComponent(item.name.charAt(0))}`}" alt="${item.name}">
      <div class="cart-preview-details">
        <p class="cart-preview-name">${item.name}</p>
        <span class="cart-preview-meta">${item.quantity} × KSh ${item.price.toLocaleString('en-KE')}</span>
      </div>
      <button class="cart-preview-remove" data-remove-item="${item.product_id}" aria-label="Remove ${item.name}">
        <i data-lucide="x"></i>
      </button>
    </li>`;
}

function renderCartPreview() {
  const panel = document.getElementById('cart-panel');
  if (!panel) return;

  const items = readCart();
  const list = panel.querySelector('.cart-preview-list');
  const footer = panel.querySelector('.cart-preview-footer');

  if (items.length === 0) {
    list.innerHTML = `
      <div class="dropdown-panel-empty">
        <i data-lucide="shopping-cart"></i>
        <p>Your cart is empty</p>
      </div>`;
    if (footer) footer.classList.add('is-hidden');
  } else {
    list.innerHTML = items.map(cartPreviewItemTemplate).join('');
    if (footer) {
      footer.classList.remove('is-hidden');
      footer.querySelector('.cart-preview-total').textContent = `KSh ${getTotal().toLocaleString('en-KE')}`;
    }
  }

  if (window.lucide) lucide.createIcons();

  panel.querySelectorAll('[data-remove-item]').forEach(btn => {
    btn.addEventListener('click', () => removeItem(Number(btn.dataset.removeItem)));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartPreview();
});

window.cartModule = { addItem, removeItem, updateQuantity, getTotal, getItemCount, readCart };