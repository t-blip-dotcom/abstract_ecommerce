/**
 * admin-products.js
 * Product management for admin & manager (full manage rights) and
 * staff (view only — add/edit/delete controls are hidden for them).
 * Fields mirror the products/category/brand/supplier/product_status
 * tables. All data is mocked in-memory; once the backend exists:
 *   - GET    /api/admin/products
 *   - POST   /api/admin/products         (multipart, for the photo)
 *   - PATCH  /api/admin/products/:id
 *   - DELETE /api/admin/products/:id
 */

const CATEGORIES = ['Hair Care', 'Skin Care', 'Body Care', 'Hair Oils', 'Lotions', 'Leave-In'];
const BRANDS = ['Cantu', 'Palmers', 'Nivea', 'Vaseline', 'Simple'];
const SUPPLIERS = ['Nairobi Beauty Distributors', 'Coastal Cosmetics Ltd', 'Highlands Supply Co.'];
const PRODUCT_STATUSES = ['active', 'inactive', 'out_of_stock'];

let adminProducts = [
  { product_id: 1, name: 'Mega Growth Leave-In', category: 'Hair Care', brand: 'Cantu', supplier: 'Nairobi Beauty Distributors', price: 850, stock_quantity: 24, status: 'active', photo_url: '' },
  { product_id: 2, name: 'Coconut Hair Oil', category: 'Hair Oils', brand: 'Palmers', supplier: 'Coastal Cosmetics Ltd', price: 620, stock_quantity: 3, status: 'active', photo_url: '' },
  { product_id: 6, name: 'Shea Butter Lotion', category: 'Lotions', brand: 'Nivea', supplier: 'Highlands Supply Co.', price: 700, stock_quantity: 0, status: 'out_of_stock', photo_url: '' },
  { product_id: 9, name: 'Curl Defining Cream', category: 'Hair Care', brand: 'Cantu', supplier: 'Nairobi Beauty Distributors', price: 920, stock_quantity: 15, status: 'active', photo_url: '' }
];

const filterState = { category: 'all', brand: 'all', status: 'all', search: '' };
let editingProductId = null;

function placeholderPhoto(name) {
  return `https://placehold.co/64x64/E1F1FB/0074BD?text=${encodeURIComponent((name || 'P').charAt(0))}`;
}

function filteredProducts() {
  return adminProducts.filter(p => {
    const matchesCategory = filterState.category === 'all' || p.category === filterState.category;
    const matchesBrand = filterState.brand === 'all' || p.brand === filterState.brand;
    const matchesStatus = filterState.status === 'all' || p.status === filterState.status;
    const matchesSearch = !filterState.search || p.name.toLowerCase().includes(filterState.search);
    return matchesCategory && matchesBrand && matchesStatus && matchesSearch;
  });
}

function productRowTemplate(p, canManageProducts) {
  return `
    <tr data-product-row="${p.product_id}">
      <td><img class="admin-table-thumb" src="${p.photo_url || placeholderPhoto(p.name)}" alt=""></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.brand}</td>
      <td>${p.supplier}</td>
      <td>KSh ${p.price.toLocaleString('en-KE')}</td>
      <td>${p.stock_quantity}</td>
      <td><span class="status-badge status-badge--${p.status}">${p.status.replace('_', ' ')}</span></td>
      ${canManageProducts ? `
      <td>
        <div class="table-actions">
          <button data-edit-product="${p.product_id}" aria-label="Edit ${p.name}"><i data-lucide="pencil"></i></button>
          <button data-delete-product="${p.product_id}" aria-label="Delete ${p.name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>` : ''}
    </tr>`;
}

function renderAdminProducts() {
  const tbody = document.getElementById('admin-products-body');
  if (!tbody) return;

  const canManageProducts = window.adminShared.canManage('products');
  const rows = filteredProducts();

  tbody.innerHTML = rows.length
    ? rows.map(p => productRowTemplate(p, canManageProducts)).join('')
    : `<tr><td colspan="9"><div class="empty-state"><i data-lucide="search-x"></i><h3>No products match those filters</h3></div></td></tr>`;

  if (window.lucide) lucide.createIcons();

  if (canManageProducts) {
    tbody.querySelectorAll('[data-delete-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = adminProducts.find(p => p.product_id === Number(btn.dataset.deleteProduct));
        adminProducts = adminProducts.filter(p => p.product_id !== Number(btn.dataset.deleteProduct));
        renderAdminProducts();
        window.showToast(`${product?.name || 'Product'} removed`, 'success');
      });
    });

    tbody.querySelectorAll('[data-edit-product]').forEach(btn => {
      btn.addEventListener('click', () => openProductModal(Number(btn.dataset.editProduct)));
    });
  }
}

function populateSelect(selectEl, options, selectedValue) {
  selectEl.innerHTML = options.map(opt =>
    `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`
  ).join('');
}

function populateFilterOptions() {
  const categorySelect = document.getElementById('filter-category');
  const brandSelect = document.getElementById('filter-brand');
  const statusSelect = document.getElementById('filter-status');

  categorySelect.innerHTML = '<option value="all">All categories</option>' +
    CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  brandSelect.innerHTML = '<option value="all">All brands</option>' +
    BRANDS.map(b => `<option value="${b}">${b}</option>`).join('');
  statusSelect.innerHTML = '<option value="all">All statuses</option>' +
    PRODUCT_STATUSES.map(s => `<option value="${s}">${s.replace('_', ' ')}</option>`).join('');
}

function initFilters() {
  document.getElementById('filter-category').addEventListener('change', (e) => {
    filterState.category = e.target.value;
    renderAdminProducts();
  });
  document.getElementById('filter-brand').addEventListener('change', (e) => {
    filterState.brand = e.target.value;
    renderAdminProducts();
  });
  document.getElementById('filter-status').addEventListener('change', (e) => {
    filterState.status = e.target.value;
    renderAdminProducts();
  });
  document.getElementById('filter-search').addEventListener('input', (e) => {
    filterState.search = e.target.value.trim().toLowerCase();
    renderAdminProducts();
  });
  document.getElementById('filter-clear').addEventListener('click', () => {
    filterState.category = 'all';
    filterState.brand = 'all';
    filterState.status = 'all';
    filterState.search = '';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-brand').value = 'all';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-search').value = '';
    renderAdminProducts();
  });
}

function openProductModal(productId) {
  const overlay = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  const title = document.getElementById('product-modal-title');
  const preview = document.getElementById('product-photo-preview');
  form.reset();
  preview.src = placeholderPhoto('');

  editingProductId = productId || null;
  const product = editingProductId ? adminProducts.find(p => p.product_id === editingProductId) : null;

  title.textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('product-form-submit').textContent = product ? 'Save changes' : 'Save product';

  populateSelect(document.getElementById('product-category'), CATEGORIES, product?.category);
  populateSelect(document.getElementById('product-brand'), BRANDS, product?.brand);
  populateSelect(document.getElementById('product-supplier'), SUPPLIERS, product?.supplier);
  populateSelect(document.getElementById('product-status'), PRODUCT_STATUSES, product?.status || 'active');

  if (product) {
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock_quantity;
    preview.src = product.photo_url || placeholderPhoto(product.name);
  }

  overlay.classList.add('is-open');
  window.markFormClean(form);
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('is-open');
  editingProductId = null;
}

function initProductModal() {
  const overlay = document.getElementById('product-modal');
  const openBtn = document.getElementById('add-product-btn');
  const closeBtn = document.getElementById('product-modal-close');
  const form = document.getElementById('product-form');
  const photoInput = document.getElementById('product-photo');
  const preview = document.getElementById('product-photo-preview');

  openBtn?.addEventListener('click', () => openProductModal(null));
  closeBtn.addEventListener('click', () => window.confirmDiscard(form, closeProductModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeProductModal);
  });

  window.initDirtyTracking(form);

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { preview.src = reader.result; };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const values = {
      name: document.getElementById('product-name').value,
      category: document.getElementById('product-category').value,
      brand: document.getElementById('product-brand').value,
      supplier: document.getElementById('product-supplier').value,
      price: Number(document.getElementById('product-price').value),
      stock_quantity: Number(document.getElementById('product-stock').value),
      status: document.getElementById('product-status').value,
      photo_url: preview.src.startsWith('data:') ? preview.src : ''
    };

    if (editingProductId) {
      const product = adminProducts.find(p => p.product_id === editingProductId);
      Object.assign(product, values);
      window.showToast('Product updated', 'success');
    } else {
      adminProducts.unshift({ product_id: Date.now(), ...values });
      window.showToast('Product added', 'success');
    }

    renderAdminProducts();
    window.markFormClean(form);
    closeProductModal();
  });
}

function applyViewOnlyMode() {
  if (window.adminShared.canManage('products')) return;

  document.getElementById('add-product-btn')?.remove();
  document.getElementById('products-actions-col')?.remove();
  const banner = document.getElementById('products-view-only-banner');
  if (banner) banner.classList.remove('is-hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('products')) return;
  window.adminShared.renderAdminNav('products');

  populateFilterOptions();
  initFilters();
  applyViewOnlyMode();
  initProductModal();
  renderAdminProducts();
});