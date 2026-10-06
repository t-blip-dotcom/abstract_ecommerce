/**
 * admin-customers.js
 * Admin only, view + edit (no add/delete — customers register
 * themselves). Same api.get/patch pattern as the other admin pages.
 */

let adminCustomers = [];
let editingCustomerId = null;

function customerRowTemplate(c) {
  return `
    <tr>
      <td>${c.name}</td>
      <td>${c.primary_phone}</td>
      <td>${c.alternative_phone || '—'}</td>
      <td>${c.address || '—'}</td>
      <td>${c.email_address || '—'}</td>
      <td>
        <div class="table-actions">
          <button data-edit-customer="${c.customer_id}" aria-label="Edit ${c.name}"><i data-lucide="pencil"></i></button>
        </div>
      </td>
    </tr>`;
}

async function loadCustomers() {
  try {
    adminCustomers = await api.get('/customers');
  } catch (err) {
    window.showToast(err.message, 'error');
    adminCustomers = [];
  }
  renderAdminCustomers();
}

function renderAdminCustomers() {
  const tbody = document.getElementById('admin-customers-body');
  if (!tbody) return;

  tbody.innerHTML = adminCustomers.length
    ? adminCustomers.map(customerRowTemplate).join('')
    : `<tr><td colspan="6"><div class="empty-state"><i data-lucide="users-round"></i><h3>No customers yet</h3></div></td></tr>`;
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-edit-customer]').forEach(btn => {
    btn.addEventListener('click', () => openCustomerModal(btn.dataset.editCustomer));
  });
}

function openCustomerModal(customerId) {
  const overlay = document.getElementById('customer-modal');
  const form = document.getElementById('customer-form');
  form.reset();

  editingCustomerId = customerId;
  const customer = adminCustomers.find(c => String(c.customer_id) === customerId);
  if (!customer) return;

  document.getElementById('customer-name').value = customer.name;
  document.getElementById('customer-primary-phone').value = customer.primary_phone;
  document.getElementById('customer-alt-phone').value = customer.alternative_phone || '';
  document.getElementById('customer-address').value = customer.address || '';
  document.getElementById('customer-email').value = customer.email_address || '';

  window.markFormClean(form);
  overlay.classList.add('is-open');
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.remove('is-open');
  editingCustomerId = null;
}

function initCustomerModal() {
  const overlay = document.getElementById('customer-modal');
  const form = document.getElementById('customer-form');

  window.initDirtyTracking(form);
  document.getElementById('customer-modal-close').addEventListener('click', () => window.confirmDiscard(form, closeCustomerModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeCustomerModal);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;
    if (!editingCustomerId) return;

    const body = {
      name: document.getElementById('customer-name').value,
      primary_phone: document.getElementById('customer-primary-phone').value,
      alternative_phone: document.getElementById('customer-alt-phone').value,
      address: document.getElementById('customer-address').value,
      email_address: document.getElementById('customer-email').value
    };
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await api.patch(`/customers/${editingCustomerId}`, body);
      window.markFormClean(form);
      closeCustomerModal();
      loadCustomers();
      window.showToast('Customer details updated', 'success');
    } catch (err) {
      window.applyServerFieldErrors(form, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('customers'))) return;
  window.adminShared.renderAdminNav('customers');
  initCustomerModal();
  loadCustomers();
});