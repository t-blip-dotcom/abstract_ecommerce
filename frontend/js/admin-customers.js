/**
 * admin-customers.js
 * Customer directory — admin only. Fields mirror the customers
 * table. Customers register themselves on the storefront, so
 * there's no "add customer" here — just viewing, and editing
 * contact details for support purposes.
 * Once the backend exists: GET /api/admin/customers, PATCH /api/admin/customers/:id
 */

let adminCustomers = [
  { customer_id: 1, name: 'Amina Wanjiru', primary_phone: '0711 222 333', alternative_phone: '', address: 'Kilimani, Nairobi', email_address: 'amina.w@example.com' },
  { customer_id: 2, name: 'Brian Otieno', primary_phone: '0722 333 444', alternative_phone: '0733 444 555', address: 'South B, Nairobi', email_address: 'brian.o@example.com' },
  { customer_id: 3, name: 'Faith Nekesa', primary_phone: '0700 111 222', alternative_phone: '', address: 'Ruaka, Kiambu', email_address: 'faith.n@example.com' },
  { customer_id: 4, name: 'Kevin Mwangi', primary_phone: '0733 555 666', alternative_phone: '', address: 'Westlands, Nairobi', email_address: 'kevin.m@example.com' }
];

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

function renderAdminCustomers() {
  const tbody = document.getElementById('admin-customers-body');
  if (!tbody) return;

  tbody.innerHTML = adminCustomers.map(customerRowTemplate).join('');
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-edit-customer]').forEach(btn => {
    btn.addEventListener('click', () => openCustomerModal(Number(btn.dataset.editCustomer)));
  });
}

function openCustomerModal(customerId) {
  const overlay = document.getElementById('customer-modal');
  const form = document.getElementById('customer-form');
  form.reset();

  editingCustomerId = customerId;
  const customer = adminCustomers.find(c => c.customer_id === customerId);
  if (!customer) return;

  document.getElementById('customer-name').value = customer.name;
  document.getElementById('customer-primary-phone').value = customer.primary_phone;
  document.getElementById('customer-alt-phone').value = customer.alternative_phone || '';
  document.getElementById('customer-address').value = customer.address || '';
  document.getElementById('customer-email').value = customer.email_address || '';

  overlay.classList.add('is-open');
}

function closeCustomerModal() {
  document.getElementById('customer-modal').classList.remove('is-open');
  editingCustomerId = null;
}

function initCustomerModal() {
  const overlay = document.getElementById('customer-modal');
  const form = document.getElementById('customer-form');

  document.getElementById('customer-modal-close').addEventListener('click', closeCustomerModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomerModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;
    if (!editingCustomerId) return;

    Object.assign(adminCustomers.find(c => c.customer_id === editingCustomerId), {
      name: document.getElementById('customer-name').value,
      primary_phone: document.getElementById('customer-primary-phone').value,
      alternative_phone: document.getElementById('customer-alt-phone').value,
      address: document.getElementById('customer-address').value,
      email_address: document.getElementById('customer-email').value
    });

    renderAdminCustomers();
    closeCustomerModal();
    window.showToast('Customer details updated', 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('customers')) return;
  window.adminShared.renderAdminNav('customers');
  initCustomerModal();
  renderAdminCustomers();
});
