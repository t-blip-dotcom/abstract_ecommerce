/**
 * admin-orders.js
 * Order management. Admin/manager can see everything; staff can see
 * the same table but their only allowed action — per your role
 * spec — is updating the order status, which is also all this table
 * lets anyone do today (there's no other order edit yet). Whoever
 * changes the status is recorded as `processed_by`.
 * Once the backend exists:
 *   - GET   /api/admin/orders
 *   - PATCH /api/admin/orders/:id/status   { order_status, processed_by }
 */

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

let adminOrders = [
  { order_id: 1042, customer: 'Amina Wanjiru', order_date: '2026-09-10', payment_method: 'mpesa', payment_status: 'completed', order_status: 'shipped', amount_paid: 1850, shipping_address: 'Kilimani, Nairobi', processed_by: 'Jane Kamau' },
  { order_id: 1041, customer: 'Brian Otieno', order_date: '2026-09-10', payment_method: 'mpesa', payment_status: 'completed', order_status: 'processing', amount_paid: 920, shipping_address: 'South B, Nairobi', processed_by: 'Jane Kamau' },
  { order_id: 1040, customer: 'Faith Nekesa', order_date: '2026-09-09', payment_method: 'cash_on_delivery', payment_status: 'pending', order_status: 'pending', amount_paid: null, shipping_address: 'Ruaka, Kiambu', processed_by: null },
  { order_id: 1039, customer: 'Kevin Mwangi', order_date: '2026-09-08', payment_method: 'mpesa', payment_status: 'completed', order_status: 'delivered', amount_paid: 2260, shipping_address: 'Westlands, Nairobi', processed_by: 'Peter Otieno' }
];

const filterState = { status: 'all', paymentStatus: 'all', from: '', to: '', search: '' };

function filteredOrders() {
  return adminOrders.filter(o => {
    const matchesStatus = filterState.status === 'all' || o.order_status === filterState.status;
    const matchesPayment = filterState.paymentStatus === 'all' || o.payment_status === filterState.paymentStatus;
    const matchesFrom = !filterState.from || o.order_date >= filterState.from;
    const matchesTo = !filterState.to || o.order_date <= filterState.to;
    const matchesSearch = !filterState.search || o.customer.toLowerCase().includes(filterState.search);
    return matchesStatus && matchesPayment && matchesFrom && matchesTo && matchesSearch;
  });
}

function orderRowTemplate(o) {
  const statusOptions = ORDER_STATUSES.map(s =>
    `<option value="${s}" ${s === o.order_status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
  ).join('');

  return `
    <tr>
      <td>#${o.order_id}</td>
      <td>${o.customer}</td>
      <td>${o.order_date}</td>
      <td>${o.payment_method.replace('_', ' ')}</td>
      <td><span class="status-badge status-badge--${o.payment_status === 'completed' ? 'paid' : o.payment_status}">${o.payment_status}</span></td>
      <td>${o.amount_paid ? `KSh ${o.amount_paid.toLocaleString('en-KE')}` : '—'}</td>
      <td>${o.processed_by || '—'}</td>
      <td>
        <select class="status-select" data-order-status="${o.order_id}">
          ${statusOptions}
        </select>
      </td>
    </tr>`;
}

function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  const rows = filteredOrders();
  tbody.innerHTML = rows.length
    ? rows.map(orderRowTemplate).join('')
    : `<tr><td colspan="8"><div class="empty-state"><i data-lucide="search-x"></i><h3>No orders match those filters</h3></div></td></tr>`;

  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-order-status]').forEach(select => {
    select.addEventListener('change', () => {
      const order = adminOrders.find(o => o.order_id === Number(select.dataset.orderStatus));
      if (!order) return;
      order.order_status = select.value;
      order.processed_by = window.adminShared.getStaffName();
      renderAdminOrders();
      window.showToast(`Order #${order.order_id} marked ${select.value.replace('_', ' ')}`, 'success');
    });
  });
}

function populateFilterOptions() {
  const statusSelect = document.getElementById('filter-order-status');
  const paymentSelect = document.getElementById('filter-payment-status');

  statusSelect.innerHTML = '<option value="all">All statuses</option>' +
    ORDER_STATUSES.map(s => `<option value="${s}">${s.replace('_', ' ')}</option>`).join('');
  paymentSelect.innerHTML = '<option value="all">All payment statuses</option>' +
    PAYMENT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
}

function initFilters() {
  document.getElementById('filter-order-status').addEventListener('change', (e) => {
    filterState.status = e.target.value;
    renderAdminOrders();
  });
  document.getElementById('filter-payment-status').addEventListener('change', (e) => {
    filterState.paymentStatus = e.target.value;
    renderAdminOrders();
  });
  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    filterState.from = e.target.value;
    renderAdminOrders();
  });
  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    filterState.to = e.target.value;
    renderAdminOrders();
  });
  document.getElementById('filter-order-search').addEventListener('input', (e) => {
    filterState.search = e.target.value.trim().toLowerCase();
    renderAdminOrders();
  });
  document.getElementById('filter-order-clear').addEventListener('click', () => {
    filterState.status = 'all';
    filterState.paymentStatus = 'all';
    filterState.from = '';
    filterState.to = '';
    filterState.search = '';
    document.getElementById('filter-order-status').value = 'all';
    document.getElementById('filter-payment-status').value = 'all';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-order-search').value = '';
    renderAdminOrders();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('orders')) return;
  window.adminShared.renderAdminNav('orders');

  if (window.adminShared.getCapability('orders') === 'update-status') {
    document.getElementById('orders-view-only-banner')?.classList.remove('is-hidden');
  }

  populateFilterOptions();
  initFilters();
  renderAdminOrders();
});
