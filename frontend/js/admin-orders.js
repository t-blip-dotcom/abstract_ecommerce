/**
 * admin-orders.js
 * Wired to the real backend. Filters are sent as query params to
 * GET /api/orders; changing a status PATCHes /api/orders/:id/status
 * (the backend records who made the change and notifies the
 * customer itself — nothing extra to do here for that). "Items"
 * opens a modal fetching GET /api/orders/:id/items so you can see
 * exactly what was ordered, not just the order total.
 */

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'payment_failed'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'];

const filterState = { status: '', paymentStatus: '', from: '', to: '', search: '' };
let currentOrders = [];

function buildQuery() {
  const params = new URLSearchParams();
  if (filterState.status) params.set('status', filterState.status);
  if (filterState.paymentStatus) params.set('payment_status', filterState.paymentStatus);
  if (filterState.from) params.set('from', filterState.from);
  if (filterState.to) params.set('to', filterState.to);
  if (filterState.search) params.set('search', filterState.search);
  return params.toString();
}

function orderRowTemplate(o) {
  const statusOptions = ORDER_STATUSES.map(s =>
    `<option value="${s}" ${s === o.order_status ? 'selected' : ''}>${s.replace('_', ' ')}</option>`
  ).join('');

  return `
    <tr>
      <td>#${o.order_id}</td>
      <td>${o.customer_name}</td>
      <td>${o.order_date}</td>
      <td>${(o.payment_method_name || '—').replace('_', ' ')}</td>
      <td><span class="status-badge status-badge--${o.payment_status === 'completed' ? 'paid' : o.payment_status}">${o.payment_status}</span></td>
      <td>${o.amount_paid ? `KSh ${Number(o.amount_paid).toLocaleString('en-KE')}` : '—'}</td>
      <td>${o.processed_by_name || '—'}</td>
      <td>
        <select class="status-select" data-order-status="${o.order_id}">
          ${statusOptions}
        </select>
      </td>
      <td>
        <button class="table-actions" data-view-items="${o.order_id}" aria-label="View items for order ${o.order_id}">
          <i data-lucide="list"></i>
        </button>
      </td>
    </tr>`;
}

async function loadOrders() {
  const tbody = document.getElementById('admin-orders-body');
  try {
    const result = await api.get(`/orders?${buildQuery()}`);
    currentOrders = result.orders;
  } catch (err) {
    window.showToast(err.message, 'error');
    currentOrders = [];
  }
  renderAdminOrders();
}

function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-body');
  if (!tbody) return;

  const hasActiveFilters = Object.values(filterState).some(v => v !== '');
  const emptyMessage = hasActiveFilters
    ? '<h3>No orders match those filters</h3><p>Try clearing them to see everything.</p>'
    : '<h3>No orders yet</h3><p>Orders will show up here once customers start checking out.</p>';

  tbody.innerHTML = currentOrders.length
    ? currentOrders.map(orderRowTemplate).join('')
    : `<tr><td colspan="9"><div class="empty-state"><i data-lucide="search-x"></i>${emptyMessage}</div></td></tr>`;

  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-order-status]').forEach(select => {
    select.addEventListener('change', async () => {
      const orderId = select.dataset.orderStatus;
      const newStatus = select.value;
      select.disabled = true;
      try {
        await api.patch(`/orders/${orderId}/status`, { status: newStatus });
        window.showToast(`Order #${orderId} marked ${newStatus.replace('_', ' ')}`, 'success');
        loadOrders(); // refresh so "Processed by" picks up the change
      } catch (err) {
        window.showToast(err.message, 'error');
        select.disabled = false;
      }
    });
  });

  tbody.querySelectorAll('[data-view-items]').forEach(btn => {
    btn.addEventListener('click', () => openOrderItemsModal(Number(btn.dataset.viewItems)));
  });
}

async function openOrderItemsModal(orderId) {
  const overlay = document.getElementById('order-items-modal');
  const tbody = document.getElementById('order-items-body');
  document.getElementById('order-items-title').textContent = `Order #${orderId} items`;
  tbody.innerHTML = `<tr><td colspan="4">Loading…</td></tr>`;
  overlay.classList.add('is-open');

  try {
    const items = await api.get(`/orders/${orderId}/items`);
    tbody.innerHTML = items.length
      ? items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td>${i.quantity}</td>
            <td>KSh ${Number(i.price).toLocaleString('en-KE')}</td>
            <td>KSh ${Number(i.subtotal).toLocaleString('en-KE')}</td>
          </tr>`).join('')
      : `<tr><td colspan="4">No items found for this order.</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">${err.message}</td></tr>`;
  }
}

function initOrderItemsModal() {
  const overlay = document.getElementById('order-items-modal');
  document.getElementById('order-items-modal-close').addEventListener('click', () => overlay.classList.remove('is-open'));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('is-open');
  });
}

function populateFilterOptions() {
  const statusSelect = document.getElementById('filter-order-status');
  const paymentSelect = document.getElementById('filter-payment-status');

  statusSelect.innerHTML = '<option value="">All statuses</option>' +
    ORDER_STATUSES.map(s => `<option value="${s}">${s.replace('_', ' ')}</option>`).join('');
  paymentSelect.innerHTML = '<option value="">All payment statuses</option>' +
    PAYMENT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('');
}

function initFilters() {
  document.getElementById('filter-order-status').addEventListener('change', (e) => {
    filterState.status = e.target.value;
    loadOrders();
  });
  document.getElementById('filter-payment-status').addEventListener('change', (e) => {
    filterState.paymentStatus = e.target.value;
    loadOrders();
  });
  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    filterState.from = e.target.value;
    loadOrders();
  });
  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    filterState.to = e.target.value;
    loadOrders();
  });

  let debounceTimer;
  document.getElementById('filter-order-search').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      filterState.search = e.target.value.trim();
      loadOrders();
    }, 300);
  });

  document.getElementById('filter-order-clear').addEventListener('click', () => {
    filterState.status = '';
    filterState.paymentStatus = '';
    filterState.from = '';
    filterState.to = '';
    filterState.search = '';
    document.getElementById('filter-order-status').value = '';
    document.getElementById('filter-payment-status').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('filter-order-search').value = '';
    loadOrders();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('orders'))) return;
  window.adminShared.renderAdminNav('orders');

  if (window.adminShared.getCapability('orders') === 'update-status') {
    document.getElementById('orders-view-only-banner')?.classList.remove('is-hidden');
  }

  populateFilterOptions();
  initFilters();
  initOrderItemsModal();
  loadOrders();
});