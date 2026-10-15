

const CART_STORAGE_KEY = 'cosmeticshop_cart';
let cachedIsLoggedIn = null;
let lastLoadedItems = [];
let cartWritePromise = null;

async function isLoggedInCustomer() {
  if (cachedIsLoggedIn !== null) return cachedIsLoggedIn;
  try {
    const { user } = await api.get('/auth/me');
    cachedIsLoggedIn = user?.type === 'customer';
  } catch {
    cachedIsLoggedIn = false;
  }
  return cachedIsLoggedIn;
}

function readLocalCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function normalizeServerItem(item) {
  return {
    cart_item_id: item.cart_item_id,
    product_id: item.product_id,
    name: item.name,
    price: Number(item.price),
    photo_url: item.photo_url,
    quantity: item.quantity,
    stock_quantity: item.stock_quantity,
    is_available: item.is_available
  };
}

async function readCart() {
  if (cartWritePromise) await cartWritePromise;

  if (await isLoggedInCustomer()) {
    try {
      const { items } = await api.get('/cart');
      lastLoadedItems = items.map(normalizeServerItem);
    } catch {
      lastLoadedItems = [];
    }
  } else {
    lastLoadedItems = readLocalCart();
  }
  return lastLoadedItems;
}

async function addItem(product, quantity = 1) {
  cartWritePromise = (async () => {
    if (await isLoggedInCustomer()) {
      await api.post('/cart/items', { product_id: product.product_id, quantity });
    } else {
      const items = readLocalCart();
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
      writeLocalCart(items);
    }
  })();
  
  await cartWritePromise; 
  await updateCartBadge();
}

async function removeItem(item) {
  cartWritePromise = (async () => {

  if (await isLoggedInCustomer()) {
    await api.delete(`/cart/items/${item.cart_item_id}`);
  } else {
    writeLocalCart(readLocalCart().filter(i => i.product_id !== item.product_id));
  }
  
})();
  await cartWritePromise;
  await updateCartBadge();
}

async function updateQuantity(item, quantity) {
  cartWritePromise = (async () => {
  if (quantity <= 0) return removeItem(item);

  if (await isLoggedInCustomer()) {
    await api.patch(`/cart/items/${item.cart_item_id}`, { quantity });
  } else {
    const items = readLocalCart();
    const existing = items.find(i => i.product_id === item.product_id);
    if (existing) existing.quantity = quantity;
    writeLocalCart(items);
  }
  
})();
  await cartWritePromise;
  await updateCartBadge();
}

async function getTotal() {
  const items = await readCart();
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

async function getItemCount() {
  // Distinct products in the cart, not summed quantity.
  const items = await readCart();
  return items.length;
}

async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = await getItemCount();
  badge.textContent = count;
  badge.dataset.count = count;
}

async function syncLocalCartToServer() {
  const localItems = readLocalCart();
  if (!localItems.length) return;

  localStorage.removeItem(CART_STORAGE_KEY);
  cachedIsLoggedIn = true; 

  for (const item of localItems) {
    await api.post('/cart/items', { product_id: item.product_id, quantity: item.quantity }).catch(() => {});
  }
}

function cartPreviewItemTemplate(item) {
  const thumb = api.assetUrl(item.photo_url) || `https://placehold.co/80x80/E1F1FB/0074BD?text=${encodeURIComponent(item.name.charAt(0))}`;
  return `
    <li class="cart-preview-item">
      <img src="${thumb}" alt="${item.name}">
      <div class="cart-preview-details">
        <p class="cart-preview-name">${item.name}</p>
        <span class="cart-preview-meta">${item.quantity} × KSh ${item.price.toLocaleString('en-KE')}</span>
      </div>
      <button class="cart-preview-remove" data-remove-item="${item.product_id}" aria-label="Remove ${item.name}">
        <i data-lucide="x"></i>
      </button>
    </li>`;
}

async function renderCartPreview() {
  const panel = document.getElementById('cart-panel');
  if (!panel) return;

  const items = await readCart();
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
      const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      footer.querySelector('.cart-preview-total').textContent = `KSh ${total.toLocaleString('en-KE')}`;
    }
  }

  if (window.lucide) lucide.createIcons();

  panel.querySelectorAll('[data-remove-item]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const item = lastLoadedItems.find(i => i.product_id === Number(btn.dataset.removeItem));
      if (item) {
        await removeItem(item);
        renderCartPreview();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCartPreview();
});

window.cartModule = {
  addItem, removeItem, updateQuantity, getTotal, getItemCount, readCart,
  syncLocalCartToServer, isLoggedInCustomer, renderCartPreview
};