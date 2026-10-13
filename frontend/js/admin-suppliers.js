
let adminSuppliers = [];
let editingSupplierId = null;

function supplierRowTemplate(s) {
  return `
    <tr>
      <td>${s.supplier_name}</td>
      <td>${s.phone || '—'}</td>
      <td>
        <div class="table-actions">
          <button data-edit-supplier="${s.supplier_id}" aria-label="Edit ${s.supplier_name}"><i data-lucide="pencil"></i></button>
          <button data-delete-supplier="${s.supplier_id}" aria-label="Delete ${s.supplier_name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

async function loadSuppliers() {
  try {
    adminSuppliers = await api.get('/suppliers');
  } catch (err) {
    window.showToast(err.message, 'error');
    adminSuppliers = [];
  }
  renderAdminSuppliers();
}

function renderAdminSuppliers() {
  const tbody = document.getElementById('admin-suppliers-body');
  if (!tbody) return;

  tbody.innerHTML = adminSuppliers.length
    ? adminSuppliers.map(supplierRowTemplate).join('')
    : `<tr><td colspan="3"><div class="empty-state"><i data-lucide="truck"></i><h3>No suppliers yet</h3><p>Add one before you can create products.</p></div></td></tr>`;
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-delete-supplier]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.deleteSupplier);
      const supplier = adminSuppliers.find(s => s.supplier_id === id);
      try {
        await api.delete(`/suppliers/${id}`);
        window.showToast(`${supplier?.supplier_name || 'Supplier'} removed`, 'success');
        loadSuppliers();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-edit-supplier]').forEach(btn => {
    btn.addEventListener('click', () => openSupplierModal(Number(btn.dataset.editSupplier)));
  });
}

function openSupplierModal(supplierId) {
  const overlay = document.getElementById('supplier-modal');
  const form = document.getElementById('supplier-form');
  form.reset();

  editingSupplierId = supplierId || null;
  const supplier = editingSupplierId ? adminSuppliers.find(s => s.supplier_id === editingSupplierId) : null;

  document.getElementById('supplier-modal-title').textContent = supplier ? 'Edit supplier' : 'Add supplier';
  document.getElementById('supplier-form-submit').textContent = supplier ? 'Save changes' : 'Save supplier';

  if (supplier) {
    document.getElementById('supplier-name').value = supplier.supplier_name;
    document.getElementById('supplier-phone').value = supplier.phone || '';
  }

  window.markFormClean(form);
  overlay.classList.add('is-open');
}

function closeSupplierModal() {
  document.getElementById('supplier-modal').classList.remove('is-open');
  editingSupplierId = null;
}

function initSupplierModal() {
  const overlay = document.getElementById('supplier-modal');
  const form = document.getElementById('supplier-form');

  window.initDirtyTracking(form);
  document.getElementById('add-supplier-btn').addEventListener('click', () => openSupplierModal(null));
  document.getElementById('supplier-modal-close').addEventListener('click', () => window.confirmDiscard(form, closeSupplierModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeSupplierModal);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const body = {
      supplier_name: document.getElementById('supplier-name').value,
      phone: document.getElementById('supplier-phone').value
    };
    const submitBtn = document.getElementById('supplier-form-submit');
    submitBtn.disabled = true;

    try {
      if (editingSupplierId) {
        await api.patch(`/suppliers/${editingSupplierId}`, body);
        window.showToast('Supplier updated', 'success');
      } else {
        await api.post('/suppliers', body);
        window.showToast('Supplier added', 'success');
      }
      window.markFormClean(form);
      closeSupplierModal();
      loadSuppliers();
    } catch (err) {
      window.applyServerFieldErrors(form, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('suppliers'))) return;
  window.adminShared.renderAdminNav('suppliers');
  initSupplierModal();
  loadSuppliers();
});