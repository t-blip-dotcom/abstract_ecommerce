
const PRODUCT_STATUSES = ['active', 'inactive', 'out_of_stock'];

let categories = [];
let brands = [];
let suppliers = [];
let currentProducts = [];
let editingProductId = null;

const filterState = { category_id: '', brand_id: '', status: '', search: '' };

function placeholderPhoto(name) {
  return `https://placehold.co/64x64/E1F1FB/0074BD?text=${encodeURIComponent((name || 'P').charAt(0))}`;
}

async function loadLookups() {
  [categories, brands, suppliers] = await Promise.all([
    api.get('/categories'),
    api.get('/brands'),
    api.get('/suppliers').catch(() => []) // suppliers list is manage-only; staff just won't see it, which is fine since they can't add/edit anyway
  ]);
}

function populateSelect(selectEl, options, valueKey, labelKey, selectedValue, placeholder) {
  const optionTags = options.map(opt =>
    `<option value="${opt[valueKey]}" ${String(opt[valueKey]) === String(selectedValue) ? 'selected' : ''}>${opt[labelKey]}</option>`
  ).join('');
  selectEl.innerHTML = placeholder ? `<option value="">${placeholder}</option>${optionTags}` : optionTags;
}

function populateFilterOptions() {
  populateSelect(document.getElementById('filter-category'), categories, 'category_id', 'category_name', '', 'All categories');
  populateSelect(document.getElementById('filter-brand'), brands, 'brand_id', 'brand_name', '', 'All brands');

  const statusSelect = document.getElementById('filter-status');
  statusSelect.innerHTML = '<option value="">All statuses</option>' +
    PRODUCT_STATUSES.map(s => `<option value="${s}">${s.replace('_', ' ')}</option>`).join('');
}

function buildQuery() {
  const params = new URLSearchParams();
  if (filterState.category_id) params.set('category_id', filterState.category_id);
  if (filterState.brand_id) params.set('brand_id', filterState.brand_id);
  if (filterState.status) params.set('status', filterState.status);
  if (filterState.search) params.set('search', filterState.search);
  params.set('per_page', 60); // admin view — show more per page than the storefront grid
  return params.toString();
}

function productRowTemplate(p, canManageProducts) {
  return `
    <tr>
      <td><img class="admin-table-thumb" src="${api.assetUrl(p.photo_url) || placeholderPhoto(p.name)}" alt=""></td>
      <td>${p.name}</td>
      <td class="hide-on-mobile">${p.category_name}</td>
      <td class="hide-on-mobile">${p.brand_name}</td>
      <td class="hide-on-mobile">${p.supplier_name}</td>
      <td>KSh ${Number(p.price).toLocaleString('en-KE')}</td>
      <td>${p.stock_quantity}</td>
      <td class="hide-on-mobile"><span class="status-badge status-badge--${p.status}">${p.status.replace('_', ' ')}</span></td>
      ${canManageProducts ? `
      <td>
        <div class="table-actions">
          <button data-edit-product="${p.product_id}" aria-label="Edit ${p.name}"><i data-lucide="pencil"></i></button>
          <button data-delete-product="${p.product_id}" aria-label="Delete ${p.name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>` : ''}
    </tr>`;
}

async function loadProducts() {
  try {
    const result = await api.get(`/products?${buildQuery()}`);
    currentProducts = result.products;
  } catch (err) {
    window.showToast(err.message, 'error');
    currentProducts = [];
  }
  renderAdminProducts();
}

function renderAdminProducts() {
  const tbody = document.getElementById('admin-products-body');
  if (!tbody) return;

  const canManageProducts = window.adminShared.canManage('products');
  const hasActiveFilters = Object.values(filterState).some(v => v !== '');
  const emptyMessage = hasActiveFilters
    ? '<h3>No products match those filters</h3><p>Try clearing them to see everything.</p>'
    : `<h3>No products yet</h3><p>${canManageProducts ? "Click \"Add product\" above to create your first one." : 'Nothing has been added to the catalog yet.'}</p>`;

  tbody.innerHTML = currentProducts.length
    ? currentProducts.map(p => productRowTemplate(p, canManageProducts)).join('')
    : `<tr><td colspan="9"><div class="empty-state"><i data-lucide="search-x"></i>${emptyMessage}</div></td></tr>`;

  if (window.lucide) lucide.createIcons();
  if (!canManageProducts) return;

  tbody.querySelectorAll('[data-delete-product]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteProduct;
      const product = currentProducts.find(p => String(p.product_id) === id);
      try {
        await api.delete(`/products/${id}`);
        window.showToast(`${product?.name || 'Product'} removed`, 'success');
        loadProducts();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-edit-product]').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(btn.dataset.editProduct));
  });
}

function initFilters() {
  document.getElementById('filter-category').addEventListener('change', (e) => {
    filterState.category_id = e.target.value;
    loadProducts();
  });
  document.getElementById('filter-brand').addEventListener('change', (e) => {
    filterState.brand_id = e.target.value;
    loadProducts();
  });
  document.getElementById('filter-status').addEventListener('change', (e) => {
    filterState.status = e.target.value;
    loadProducts();
  });

  let debounceTimer;
  document.getElementById('filter-search').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterState.search = e.target.value.trim();
      loadProducts();
    }, 300);
  });

  document.getElementById('filter-clear').addEventListener('click', () => {
    filterState.category_id = '';
    filterState.brand_id = '';
    filterState.status = '';
    filterState.search = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-brand').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-search').value = '';
    loadProducts();
  });
}

function openProductModal(productId) {
  const overlay = document.getElementById('product-modal');
  const form = document.getElementById('product-form');
  const preview = document.getElementById('product-photo-preview');
  form.reset();
  preview.src = placeholderPhoto('');

  editingProductId = productId || null;
  const product = editingProductId ? currentProducts.find(p => String(p.product_id) === editingProductId) : null;

  document.getElementById('product-modal-title').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('product-form-submit').textContent = product ? 'Save changes' : 'Save product';

  populateSelect(document.getElementById('product-category'), categories, 'category_id', 'category_name', product?.category_id);
  populateSelect(document.getElementById('product-brand'), brands, 'brand_id', 'brand_name', product?.brand_id);
  populateSelect(document.getElementById('product-supplier'), suppliers, 'supplier_id', 'supplier_name', product?.supplier_id);

  const statusSelect = document.getElementById('product-status');
  statusSelect.innerHTML = PRODUCT_STATUSES.map(s =>
    `<option value="${s}" ${s === (product?.status || 'active') ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
  ).join('');

  if (product) {
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock_quantity;
    preview.src = api.assetUrl(product.photo_url) || placeholderPhoto(product.name);
  }

  window.markFormClean(form);
  overlay.classList.add('is-open');
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

  window.initDirtyTracking(form);
  openBtn?.addEventListener('click', () => openProductModal(null));
  closeBtn.addEventListener('click', () => window.confirmDiscard(form, closeProductModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeProductModal);
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { preview.src = reader.result; };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('category_id', document.getElementById('product-category').value);
    formData.append('brand_id', document.getElementById('product-brand').value);
    formData.append('supplier_id', document.getElementById('product-supplier').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('stock_quantity', document.getElementById('product-stock').value);
    formData.append('status', document.getElementById('product-status').value);
    if (photoInput.files[0]) formData.append('photo', photoInput.files[0]);

    const submitBtn = document.getElementById('product-form-submit');
    submitBtn.disabled = true;

    try {
      if (editingProductId) {
        await api.patchForm(`/products/${editingProductId}`, formData);
        window.showToast('Product updated', 'success');
      } else {
        await api.postForm('/products', formData);
        window.showToast('Product added', 'success');
      }
      window.markFormClean(form);
      closeProductModal();
      loadProducts();
    } catch (err) {
      window.applyServerFieldErrors(form, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function applyViewOnlyMode() {
  if (window.adminShared.canManage('products')) return;
  document.getElementById('add-product-btn')?.remove();
  document.getElementById('products-actions-col')?.remove();
  document.getElementById('products-view-only-banner')?.classList.remove('is-hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('products'))) return;
  window.adminShared.renderAdminNav('products');

  try {
    await loadLookups();
  } catch (err) {
    window.showToast(err.message, 'error');
  }

  populateFilterOptions();
  initFilters();
  applyViewOnlyMode();
  initProductModal();
  loadProducts();
});