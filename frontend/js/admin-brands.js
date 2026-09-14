/**
 * admin-brands.js
 * Brand management — admin & manager only, per the role spec.
 * Fields mirror the BRAND table: brand_name, description, logo_url.
 * Once the backend exists:
 *   - GET/POST/PATCH/DELETE /api/admin/brands
 */

let adminBrands = [
  { brand_id: 1, brand_name: 'Cantu', description: 'Curl and coily hair care', logo_url: '' },
  { brand_id: 2, brand_name: 'Palmers', description: 'Cocoa and shea butter skin care', logo_url: '' },
  { brand_id: 3, brand_name: 'Nivea', description: 'Everyday skin and body care', logo_url: '' },
  { brand_id: 4, brand_name: 'Vaseline', description: 'Petroleum jelly and lotions', logo_url: '' },
  { brand_id: 5, brand_name: 'Simple', description: 'Gentle, fragrance-free skin care', logo_url: '' }
];

let editingBrandId = null;

function brandRowTemplate(b) {
  return `
    <tr>
      <td><img class="admin-table-thumb" src="${b.logo_url || `https://placehold.co/64x64/D1FAE5/059669?text=${encodeURIComponent(b.brand_name.charAt(0))}`}" alt=""></td>
      <td>${b.brand_name}</td>
      <td>${b.description || '—'}</td>
      <td>
        <div class="table-actions">
          <button data-edit-brand="${b.brand_id}" aria-label="Edit ${b.brand_name}"><i data-lucide="pencil"></i></button>
          <button data-delete-brand="${b.brand_id}" aria-label="Delete ${b.brand_name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

function renderAdminBrands() {
  const tbody = document.getElementById('admin-brands-body');
  if (!tbody) return;

  tbody.innerHTML = adminBrands.map(brandRowTemplate).join('');
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-delete-brand]').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = adminBrands.find(b => b.brand_id === Number(btn.dataset.deleteBrand));
      adminBrands = adminBrands.filter(b => b.brand_id !== Number(btn.dataset.deleteBrand));
      renderAdminBrands();
      window.showToast(`${brand?.brand_name || 'Brand'} removed`, 'success');
    });
  });

  tbody.querySelectorAll('[data-edit-brand]').forEach(btn => {
    btn.addEventListener('click', () => openBrandModal(Number(btn.dataset.editBrand)));
  });
}

function openBrandModal(brandId) {
  const overlay = document.getElementById('brand-modal');
  const form = document.getElementById('brand-form');
  form.reset();

  editingBrandId = brandId || null;
  const brand = editingBrandId ? adminBrands.find(b => b.brand_id === editingBrandId) : null;

  document.getElementById('brand-modal-title').textContent = brand ? 'Edit brand' : 'Add brand';
  document.getElementById('brand-form-submit').textContent = brand ? 'Save changes' : 'Save brand';

  if (brand) {
    document.getElementById('brand-name').value = brand.brand_name;
    document.getElementById('brand-description').value = brand.description || '';
    document.getElementById('brand-logo-url').value = brand.logo_url || '';
  }

  overlay.classList.add('is-open');
}

function closeBrandModal() {
  document.getElementById('brand-modal').classList.remove('is-open');
  editingBrandId = null;
}

function initBrandModal() {
  const overlay = document.getElementById('brand-modal');
  const form = document.getElementById('brand-form');

  document.getElementById('add-brand-btn').addEventListener('click', () => openBrandModal(null));
  document.getElementById('brand-modal-close').addEventListener('click', closeBrandModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeBrandModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const values = {
      brand_name: document.getElementById('brand-name').value,
      description: document.getElementById('brand-description').value,
      logo_url: document.getElementById('brand-logo-url').value
    };

    if (editingBrandId) {
      Object.assign(adminBrands.find(b => b.brand_id === editingBrandId), values);
      window.showToast('Brand updated', 'success');
    } else {
      adminBrands.unshift({ brand_id: Date.now(), ...values });
      window.showToast('Brand added', 'success');
    }

    renderAdminBrands();
    closeBrandModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('brands')) return;
  window.adminShared.renderAdminNav('brands');
  initBrandModal();
  renderAdminBrands();
});
