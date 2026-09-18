/**
 * admin-reports.js
 * Reports — admin & manager. Sales overview, low-stock alerts, and
 * a read-only view of every order. Once the backend exists, these
 * come from aggregate queries, e.g.:
 *   - SELECT SUM(amount_paid) ... GROUP BY DATE(order_date)
 *   - SELECT * FROM products WHERE stock_quantity < 15 (0 = out of stock)
 *   - SELECT * FROM orders JOIN customers ...
 */

const MOCK_SALES_STATS = {
  totalSalesToday: 8420,
  totalSalesWeek: 54200,
  ordersToday: 6,
  activeProducts: 34
};

const MOCK_LOW_STOCK = [
  { product_id: 2, name: 'Coconut Hair Oil', category: 'Hair Oils', stock_quantity: 3 },
  { product_id: 9, name: 'Curl Defining Cream', category: 'Hair Care', stock_quantity: 4 },
  { product_id: 6, name: 'Shea Butter Lotion', category: 'Lotions', stock_quantity: 0 }
];

const MOCK_ALL_ORDERS = [
  { order_id: 1042, customer: 'Amina Wanjiru', date: '2026-09-10', total: 1850, status: 'shipped' },
  { order_id: 1041, customer: 'Brian Otieno', date: '2026-09-10', total: 920, status: 'processing' },
  { order_id: 1040, customer: 'Faith Nekesa', date: '2026-09-09', total: 640, status: 'pending' },
  { order_id: 1039, customer: 'Kevin Mwangi', date: '2026-09-08', total: 2260, status: 'delivered' },
  { order_id: 1038, customer: 'Grace Achieng', date: '2026-09-07', total: 480, status: 'cancelled' }
];

function renderStats() {
  const grid = document.getElementById('stat-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <p class="stat-card-label">Sales today</p>
      <p class="stat-card-value">KSh ${MOCK_SALES_STATS.totalSalesToday.toLocaleString('en-KE')}</p>
      <span class="stat-card-delta is-up">This week: KSh ${MOCK_SALES_STATS.totalSalesWeek.toLocaleString('en-KE')}</span>
    </div>
    <div class="stat-card">
      <p class="stat-card-label">Orders today</p>
      <p class="stat-card-value">${MOCK_SALES_STATS.ordersToday}</p>
    </div>
    <div class="stat-card">
      <p class="stat-card-label">Active products</p>
      <p class="stat-card-value">${MOCK_SALES_STATS.activeProducts}</p>
    </div>
    <div class="stat-card">
      <p class="stat-card-label">Low stock alerts</p>
      <p class="stat-card-value stat-card-value-danger">${MOCK_LOW_STOCK.length}</p>
    </div>`;
}

function renderLowStock() {
  const tbody = document.getElementById('low-stock-body');
  if (!tbody) return;

  tbody.innerHTML = MOCK_LOW_STOCK.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td><span class="status-badge ${p.stock_quantity === 0 ? 'status-badge--out_of_stock' : 'status-badge--pending'}">${p.stock_quantity} left</span></td>
    </tr>`).join('');
}

function renderAllOrders() {
  const tbody = document.getElementById('all-orders-body');
  if (!tbody) return;

  tbody.innerHTML = MOCK_ALL_ORDERS.map(o => `
    <tr>
      <td>#${o.order_id}</td>
      <td>${o.customer}</td>
      <td>${o.date}</td>
      <td>KSh ${o.total.toLocaleString('en-KE')}</td>
      <td><span class="status-badge status-badge--${o.status}">${o.status.replace('_', ' ')}</span></td>
    </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('reports')) return;
  window.adminShared.renderAdminNav('reports');

  renderStats();
  renderLowStock();
  renderAllOrders();
});