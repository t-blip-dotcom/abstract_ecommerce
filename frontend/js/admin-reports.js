/**
 * admin-reports.js
 * Admin & manager. One GET /api/reports call returns sales stats
 * plus the low-stock list in a single response (see
 * reports.routes.js) — the "all orders" table below it is a second,
 * separate call to the same orders listing admin-orders.js uses.
 */

function renderStats(stats) {
  const grid = document.getElementById('stat-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <p class="stat-card-label">Sales today</p>
      <p class="stat-card-value">KSh ${Number(stats.sales_today).toLocaleString('en-KE')}</p>
      <span class="stat-card-delta is-up">This week: KSh ${Number(stats.sales_week).toLocaleString('en-KE')}</span>
    </div>
    <div class="stat-card">
      <p class="stat-card-label">Orders today</p>
      <p class="stat-card-value">${stats.orders_today}</p>
    </div>
    <div class="stat-card">
      <p class="stat-card-label">Active products</p>
      <p class="stat-card-value">${stats.active_products}</p>
    </div>
    <div class="stat-card">
      <p class="stat-card-label">Low stock alerts</p>
      <p class="stat-card-value stat-card-value-danger">${stats.low_stock.length}</p>
    </div>`;
}

function renderLowStock(lowStock) {
  const tbody = document.getElementById('low-stock-body');
  if (!tbody) return;

  tbody.innerHTML = lowStock.length
    ? lowStock.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.category_name}</td>
          <td><span class="status-badge ${p.stock_quantity === 0 ? 'status-badge--out_of_stock' : 'status-badge--pending'}">${p.stock_quantity} left</span></td>
        </tr>`).join('')
    : `<tr><td colspan="3">Nothing running low right now.</td></tr>`;
}

async function renderAllOrders() {
  const tbody = document.getElementById('all-orders-body');
  if (!tbody) return;

  try {
    const { orders } = await api.get('/orders');
    tbody.innerHTML = orders.length
      ? orders.map(o => `
          <tr>
            <td>#${o.order_id}</td>
            <td>${o.customer_name}</td>
            <td>${o.order_date}</td>
            <td>${o.amount_paid ? `KSh ${Number(o.amount_paid).toLocaleString('en-KE')}` : '—'}</td>
            <td><span class="status-badge status-badge--${o.order_status}">${o.order_status.replace('_', ' ')}</span></td>
          </tr>`).join('')
      : `<tr><td colspan="5">No orders yet.</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5">${err.message}</td></tr>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('reports'))) return;
  window.adminShared.renderAdminNav('reports');

  try {
    const stats = await api.get('/reports');
    renderStats(stats);
    renderLowStock(stats.low_stock);
  } catch (err) {
    window.showToast(err.message, 'error');
  }

  renderAllOrders();
});