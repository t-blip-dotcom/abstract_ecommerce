/**
 * products.js
 * Renders the "Popular Products" grid on the home page:
 * - fetches the catalog (mocked for now, shaped like the `products` table)
 * - applies category / brand filters against the FULL list (not just the
 *   current page), then paginates the filtered result
 * - draws each product_card and wires up its "Add to cart" button,
 *   which opens the shared quantity sheet (see quantity-sheet.js)
 */

const DEFAULT_PRODUCTS_PER_PAGE = 8;

// Shaped like the `products` table joined with `category` and a future
// `brand` table. Swap `loadProducts()` for `api.get('/products')` once
// the backend endpoint exists.
const MOCK_PRODUCTS = [
  { product_id: 1, name: 'Mega Growth Leave-In', category: 'Hair Care', brand: 'Cantu', price: 850, stock_quantity: 24, photo_url: null },
  { product_id: 2, name: 'Coconut Hair Oil', category: 'Hair Oils', brand: 'Palmers', price: 620, stock_quantity: 3, photo_url: null },
  { product_id: 3, name: 'Nourishing Body Lotion', category: 'Body Care', brand: 'Nivea', price: 990, stock_quantity: 40, photo_url: null },
  { product_id: 4, name: 'Moisturizing Cream', category: 'Skin Care', brand: 'Vaseline', price: 450, stock_quantity: 18, photo_url: null },
  { product_id: 5, name: 'Argan Oil Leave-In Spray', category: 'Leave-In', brand: 'Cantu', price: 780, stock_quantity: 12, photo_url: null },
  { product_id: 6, name: 'Shea Butter Lotion', category: 'Lotions', brand: 'Nivea', price: 700, stock_quantity: 0, photo_url: null },
  { product_id: 7, name: 'Rosewater Facial Toner', category: 'Skin Care', brand: 'Simple', price: 550, stock_quantity: 27, photo_url: null },
  { product_id: 8, name: 'Castor Oil Blend', category: 'Hair Oils', brand: 'Palmers', price: 640, stock_quantity: 9, photo_url: null },
  { product_id: 9, name: 'Curl Defining Cream', category: 'Hair Care', brand: 'Cantu', price: 920, stock_quantity: 15, photo_url: null },
  { product_id: 10, name: 'Cocoa Butter Body Cream', category: 'Body Care', brand: 'Palmers', price: 810, stock_quantity: 22, photo_url: null },
  { product_id: 11, name: 'Aloe Vera Gel Moisturizer', category: 'Skin Care', brand: 'Simple', price: 480, stock_quantity: 30, photo_url: null },
  { product_id: 12, name: 'Deep Conditioning Mask', category: 'Hair Care', brand: 'Cantu', price: 1050, stock_quantity: 6, photo_url: null }
];

const state = {
  all: [],
  filtered: [],
  page: 1,
  perPage: DEFAULT_PRODUCTS_PER_PAGE,
  category: 'all',
  brands: [],       // empty array = all brands
  searchTerm: ''
};

function formatPrice(amount) {
  return `KSh ${Number(amount).toLocaleString('en-KE')}`;
}

async function loadProducts() {
  if (api.useMockData) {
    return Promise.resolve(MOCK_PRODUCTS);
  }
  return api.get('/products');
}

function productCardTemplate(product) {
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 15;
  const outOfStock = product.stock_quantity === 0;

  return `
    <article class="product-card" data-product-id="${product.product_id}">
      <div class="product-card-media">
        ${outOfStock ? '<span class="product-card-stock-flag">Out of stock</span>' : ''}
        ${!outOfStock && lowStock ? '<span class="product-card-stock-flag">Low stock</span>' : ''}
        <a href="product-detail.html?id=${product.product_id}">
          <img src="${product.photo_url || `https://placehold.co/400x400/E1F1FB/0074BD?text=${encodeURIComponent(product.name)}`}" alt="${product.name}" loading="lazy">
        </a>
      </div>
      <div class="product-card-body">
        <span class="product-card-category">${product.category}</span>
        <h3 class="product-card-name"><a href="product-detail.html?id=${product.product_id}">${product.name}</a></h3>
        <div class="product-card-footer">
          <span class="product-card-price">${formatPrice(product.price)}</span>
          <button class="product-card-add-btn" data-add-to-cart="${product.product_id}" ${outOfStock ? 'disabled' : ''}>
            <i data-lucide="${outOfStock ? 'ban' : 'shopping-cart'}"></i>
            ${outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderGrid() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const start = (state.page - 1) * state.perPage;
  const pageItems = state.filtered.slice(start, start + state.perPage);

  if (pageItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state product-grid-empty-state">
        <i data-lucide="search-x"></i>
        <h3>No products match that search</h3>
        <p>Try a different category or search term.</p>
      </div>`;
  } else {
    grid.innerHTML = pageItems.map(productCardTemplate).join('');
  }

  if (window.lucide) lucide.createIcons();
  renderPagination();
  attachAddToCartHandlers();

  const countEl = document.getElementById('results-count');
  if (countEl) {
    countEl.textContent = `${state.filtered.length} product${state.filtered.length === 1 ? '' : 's'}`;
  }
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.perPage));
  state.page = Math.min(state.page, totalPages);

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-page ${i === state.page ? 'is-active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="pagination-next" data-page="${state.page + 1}" ${state.page >= totalPages ? 'disabled' : ''}>
      Next <i data-lucide="chevron-right"></i>
    </button>`;

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();

  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = Number(btn.dataset.page);
      renderGrid();
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function applyFilters() {
  state.filtered = state.all.filter(p => {
    const matchesCategory = state.category === 'all' || p.category === state.category;
    const matchesBrand = state.brands.length === 0 || state.brands.includes(p.brand);
    const matchesSearch = !state.searchTerm ||
      p.name.toLowerCase().includes(state.searchTerm) ||
      p.category.toLowerCase().includes(state.searchTerm) ||
      (p.brand && p.brand.toLowerCase().includes(state.searchTerm));
    return matchesCategory && matchesBrand && matchesSearch;
  });
  state.page = 1;
  renderGrid();
}

function attachAddToCartHandlers() {
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (btn.disabled) return;

      const productId = Number(btn.dataset.addToCart);
      const product = state.all.find(p => p.product_id === productId);

      if (!product) return;

      if (product.stock_quantity === 0) {
        window.showToast(`${product.name} is out of stock.`, 'error');
        return;
      }

      if (window.quantitySheet) {
        window.quantitySheet.open(product);
      } else if (window.cartModule) {
        // Fallback if the sheet markup isn't on this page.
        window.cartModule.addItem(product, 1);
        window.showToast(`Added ${product.name} to cart`, 'success');
      }
    });
  });
}

function attachCategoryHandlers() {
  document.querySelectorAll('.category-pill[data-category]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.category-pill[data-category]').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      state.category = pill.dataset.category;
      applyFilters();
    });
  });
}

function attachBrandHandlers() {
  const boxes = document.querySelectorAll('[data-brand-filter]');
  if (!boxes.length) return;

  boxes.forEach(box => {
    box.addEventListener('change', () => {
      state.brands = Array.from(boxes)
        .filter(b => b.checked)
        .map(b => b.dataset.brandFilter);
      applyFilters();
    });
  });
}

async function initProducts() {
  const grid = document.getElementById('product-grid');
  if (grid && grid.dataset.perPage) {
    state.perPage = Number(grid.dataset.perPage);
  }

  state.all = await loadProducts();
  attachCategoryHandlers();
  attachBrandHandlers();
  applyFilters();
}

document.addEventListener('DOMContentLoaded', initProducts);

// Exposed so search.js and filters.js can update state and re-filter,
// and so product-detail.js can look up a single product by id.
window.productsModule = { applyFilters, state, loadProducts, formatPrice };