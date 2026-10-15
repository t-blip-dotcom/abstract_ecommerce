

let adminBrands = [];
let editingBrandId = null;

function brandRowTemplate(b) {
  return `
    <tr>
      <td><img class="admin-table-thumb" src="${api.assetUrl(b.logo_url) || placeholderLogo(b.brand_name)}" alt=""></td>
      <td>${b.brand_name}</td>
      <td class="hide-on-mobile">${b.description || ' '}</td>
      <td>
        <div class="table-actions">
          <button data-edit-brand="${b.brand_id}" aria-label="Edit ${b.brand_name}"><i data-lucide="pencil"></i></button>
          <button data-delete-brand="${b.brand_id}" aria-label="Delete ${b.brand_name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

function placeholderLogo(name) {
  return `https://placehold.co/64x64/E1F1FB/0074BD?text=${encodeURIComponent((name || 'B').charAt(0))}`;
}

async function loadBrands() {
  try {
    adminBrands = await api.get('/brands');
  } catch (err) {
    window.showToast(err.message, 'error');
    adminBrands = [];
  }
  renderAdminBrands();
}

function renderAdminBrands() {
  const tbody = document.getElementById('admin-brands-body');
  if (!tbody) return;

  tbody.innerHTML = adminBrands.length
    ? adminBrands.map(brandRowTemplate).join('')
    : `<tr><td colspan="4"><div class="empty-state"><i data-lucide="tag"></i><h3>No brands yet</h3></div></td></tr>`;
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-delete-brand]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.deleteBrand);
      const brand = adminBrands.find(b => b.brand_id === id);
      try {
        await api.delete(`/brands/${id}`);
        window.showToast(`${brand?.brand_name || 'Brand'} removed`, 'success');
        loadBrands();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-edit-brand]').forEach(btn => {
    btn.addEventListener('click', () => openBrandModal(Number(btn.dataset.editBrand)));
  });
}

function openBrandModal(brandId) {
  const overlay = document.getElementById('brand-modal');
  const form = document.getElementById('brand-form');
  const preview = document.getElementById('brand-logo-preview');
  form.reset();

  editingBrandId = brandId || null;
  const brand = editingBrandId ? adminBrands.find(b => b.brand_id === editingBrandId) : null;

  document.getElementById('brand-modal-title').textContent = brand ? 'Edit brand' : 'Add brand';
  document.getElementById('brand-form-submit').textContent = brand ? 'Save changes' : 'Save brand';
  preview.src = brand?.logo_url || placeholderLogo(brand?.brand_name);

  if (brand) {
    document.getElementById('brand-name').value = brand.brand_name;
    document.getElementById('brand-description').value = brand.description || '';
  }

  window.markFormClean(form);
  overlay.classList.add('is-open');
}

function closeBrandModal() {
  document.getElementById('brand-modal').classList.remove('is-open');
  editingBrandId = null;
}

function initBrandModal() {
  const overlay = document.getElementById('brand-modal');
  const form = document.getElementById('brand-form');
  const logoInput = document.getElementById('brand-logo');
  const preview = document.getElementById('brand-logo-preview');

  window.initDirtyTracking(form);
  document.getElementById('add-brand-btn').addEventListener('click', () => openBrandModal(null));
  document.getElementById('brand-modal-close').addEventListener('click', () => window.confirmDiscard(form, closeBrandModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeBrandModal);
  });

  logoInput.addEventListener('change', () => {
    const file = logoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { preview.src = reader.result; };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    
    const formData = new FormData();
    formData.append('brand_name', document.getElementById('brand-name').value);
    formData.append('description', document.getElementById('brand-description').value);
    if (logoInput.files[0]) formData.append('logo', logoInput.files[0]);

    const submitBtn = document.getElementById('brand-form-submit');
    submitBtn.disabled = true;

    try {
      if (editingBrandId) {
        await api.patchForm(`/brands/${editingBrandId}`, formData);
        window.showToast('Brand updated', 'success');
      } else {
        await api.postForm('/brands', formData);
        window.showToast('Brand added', 'success');
      }
      window.markFormClean(form);
      closeBrandModal();
      loadBrands();
    } catch (err) {
      window.applyServerFieldErrors(form, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('brands'))) return;
  window.adminShared.renderAdminNav('brands');
  initBrandModal();
  loadBrands();
});