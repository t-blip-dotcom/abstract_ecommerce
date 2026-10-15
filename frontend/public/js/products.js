
const DEFAULT_PRODUCTS_PER_PAGE = 8;

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
  try {
    const { products } = await api.get('/products?per_page=500');
    return products.map(p => ({
      product_id: p.product_id,
      name: p.name,
      category: p.category_name,
      brand: p.brand_name,
      price: Number(p.price),
      stock_quantity: p.stock_quantity,
      photo_url: p.photo_url
    }));
  } catch (err) {
    window.showToast?.(err.message, 'error');
    return [];
  }
}

function productCardTemplate(product) {
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 15;
  const outOfStock = product.stock_quantity === 0;

  return `
    <article class="product-card" data-product-id="${product.product_id}">
      <div class="product-card-media">
        ${outOfStock ? '<span class="product-card-stock-flag">Out of stock</span>' : ''}
        ${!outOfStock && lowStock ? '<span class="product-card-stock-flag">Low stock</span>' : ''}
        <a href="/products/${product.product_id}"">
          <img src="${api.assetUrl(product.photo_url) || `https://placehold.co/400x400/E1F1FB/0074BD?text=${encodeURIComponent(product.name)}`}" alt="${product.name}" loading="lazy">
        </a>
      </div>
      <div class="product-card-body">
        <span class="product-card-category">${product.category}</span>
        <h3 class="product-card-name"><a href="/products/${product.product_id}">${product.name}</a></h3>
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
    const hasActiveFilters = state.category !== 'all' || state.brands.length > 0 || state.searchTerm !== '';
    grid.innerHTML = hasActiveFilters
      ? `<div class="empty-state product-grid-empty-state">
          <i data-lucide="search-x"></i>
          <h3>No products match that search</h3>
          <p>Try a different category or search term.</p>
        </div>`
      : `<div class="empty-state product-grid-empty-state">
          <i data-lucide="package"></i>
          <h3>No products yet</h3>
          <p>Check back soon — we're still adding things.</p>
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
    btn.addEventListener('click', async (e) => {
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
        await window.cartModule.addItem(product, 1);
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


window.productsModule = { applyFilters, state, loadProducts, formatPrice };