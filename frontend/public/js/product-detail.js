
function stockInfo(product) {
  if (product.stock_quantity === 0) {
    return { label: 'Out of stock', className: 'out-of-stock', disabled: true };
  }
  if (product.stock_quantity <= 15) {
    return { label: `Only ${product.stock_quantity} left in stock`, className: 'low-stock', disabled: false };
  }
  return { label: 'In stock', className: 'in-stock', disabled: false };
}

function renderProductDetail(product) {
  const root = document.getElementById('product-detail-root');
  if (!root || !product) return;

  const stock = stockInfo(product);

  root.innerHTML = `
    <div class="product-detail-media">
      <img src="${api.assetUrl(product.photo_url) || `https://placehold.co/700x700/E1F1FB/0074BD?text=${encodeURIComponent(product.name)}`}" alt="${product.name}">
    </div>
    <div>
      <span class="product-detail-category">${product.category}</span>
      <h1>${product.name}</h1>
      <span class="product-detail-brand">${product.brand || ''}</span>
      <p class="product-detail-price">${window.productsModule.formatPrice(product.price)}</p>
      <span class="product-detail-stock ${stock.className}">
        <i data-lucide="${stock.disabled ? 'x-circle' : 'check-circle'}"></i> ${stock.label}
      </span>

      <div class="product-detail-actions">
        <div class="quantity-stepper">
          <button type="button" id="qty-decrease" aria-label="Decrease quantity">&minus;</button>
          <input type="text" id="qty-value" value="1" inputmode="numeric" aria-label="Quantity">
          <button type="button" id="qty-increase" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn btn--primary" id="add-to-cart-btn" ${stock.disabled ? 'disabled' : ''}>
          <i data-lucide="shopping-cart"></i> Add to cart
        </button>
      </div>

      <div class="product-detail-description">
        <h3>Product details</h3>
        <p>${product.name} from ${product.brand || 'our'} range, formulated for everyday ${product.category.toLowerCase()} routines. Suitable for all skin and hair types unless stated otherwise on the packaging.</p>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  attachDetailHandlers(product);
}

function attachDetailHandlers(product) {
  const qtyInput = document.getElementById('qty-value');
  const decreaseBtn = document.getElementById('qty-decrease');
  const increaseBtn = document.getElementById('qty-increase');
  const addBtn = document.getElementById('add-to-cart-btn');

  const clampQty = (value) => Math.min(Math.max(1, value), product.stock_quantity || 1);

  decreaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(Number(qtyInput.value) - 1);
  });
  increaseBtn.addEventListener('click', () => {
    qtyInput.value = clampQty(Number(qtyInput.value) + 1);
  });
  qtyInput.addEventListener('change', () => {
    qtyInput.value = clampQty(Number(qtyInput.value) || 1);
  });

  addBtn.addEventListener('click', async () => {
    if (addBtn.disabled || product.stock_quantity === 0) {
      window.showToast(`${product.name} is out of stock.`, 'error');
      return;
    }
    addBtn.disabled = true;
    try {
      await window.cartModule.addItem(product, Number(qtyInput.value));
      window.showToast(`Added ${product.name} to cart`, 'success');
    } catch (err) {
      window.showToast(err.message, 'error');
    } finally {
      addBtn.disabled = false;
    }
  });
}

async function initProductDetail() {
  const root = document.getElementById('product-detail-root');
  if (!root) return;

  const id = window.location.pathname.split('/').pop();
  if (!id) {
    root.innerHTML = '<p>No product specified.</p>';
    return;
  }

  try {
    const p = await api.get(`/products/${id}`);
    renderProductDetail({
      product_id: p.product_id,
      name: p.name,
      category: p.category_name,
      brand: p.brand_name,
      price: Number(p.price),
      stock_quantity: p.stock_quantity,
      photo_url: p.photo_url
    });
  } catch (err) {
    root.innerHTML = `<p>${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', initProductDetail);