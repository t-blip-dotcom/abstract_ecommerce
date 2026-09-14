/**
 * admin-shared.js
 * Loaded on every admin page. Reads the logged-in staff member's
 * role from localStorage (set at admin-login.html — mocked until
 * the backend exists), builds the sidebar nav to match what that
 * role is allowed to do, and blocks pages the role can't reach.
 *
 * Role rights, per the ROLE / STAFF tables:
 *   admin           -> staff, products, brands, categories, orders, customers, reports
 *   online_manager  -> products, brands, categories, orders, reports
 *   staff           -> products (view only), orders (view + update status only)
 */

const STAFF_ROLE_KEY = 'cosmeticshop_staff_role';
const STAFF_NAME_KEY = 'cosmeticshop_staff_name';

const ADMIN_NAV_ITEMS = [
  { key: 'products', href: 'admin-products.html', icon: 'package', label: 'Products' },
  { key: 'orders', href: 'admin-orders.html', icon: 'clipboard-list', label: 'Orders' },
  { key: 'brands', href: 'admin-brands.html', icon: 'tag', label: 'Brands' },
  { key: 'categories', href: 'admin-categories.html', icon: 'layout-grid', label: 'Categories' },
  { key: 'customers', href: 'admin-customers.html', icon: 'users-round', label: 'Customers' },
  { key: 'staff', href: 'admin-staff.html', icon: 'user-cog', label: 'Staff' },
  { key: 'reports', href: 'admin-reports.html', icon: 'bar-chart-3', label: 'Reports' }
];

// Which roles can reach each page at all.
const PAGE_ACCESS = {
  products: ['admin', 'online_manager', 'staff'],
  orders: ['admin', 'online_manager', 'staff'],
  brands: ['admin', 'online_manager'],
  categories: ['admin', 'online_manager'],
  customers: ['admin'],
  staff: ['admin'],
  reports: ['admin', 'online_manager']
};

// Within a page a role can reach, can they only VIEW or also MANAGE
// (add / edit / delete)? Staff can view products but only update
// order status, per your spec.
const PAGE_CAPABILITY = {
  admin: { products: 'manage', orders: 'manage', brands: 'manage', categories: 'manage', customers: 'manage', staff: 'manage', reports: 'view' },
  online_manager: { products: 'manage', orders: 'manage', brands: 'manage', categories: 'manage', reports: 'view' },
  staff: { products: 'view', orders: 'update-status' }
};

const ROLE_LABELS = { admin: 'Admin', online_manager: 'Manager', staff: 'Staff' };

function getStaffRole() {
  return localStorage.getItem(STAFF_ROLE_KEY);
}

function getStaffName() {
  return localStorage.getItem(STAFF_NAME_KEY) || 'Staff member';
}

function getCapability(pageKey) {
  const role = getStaffRole();
  return (PAGE_CAPABILITY[role] || {})[pageKey] || 'none';
}

function canManage(pageKey) {
  return getCapability(pageKey) === 'manage';
}

/**
 * Call at the top of every admin page's own script with that page's
 * key (e.g. 'orders'). Redirects to login if nobody's logged in, or
 * to the first page the role IS allowed if they hit a locked page.
 */
function requirePageAccess(pageKey) {
  const role = getStaffRole();

  if (!role) {
    window.location.href = 'admin-login.html';
    return false;
  }

  const allowedRoles = PAGE_ACCESS[pageKey] || [];
  if (!allowedRoles.includes(role)) {
    const fallback = ADMIN_NAV_ITEMS.find(item => (PAGE_ACCESS[item.key] || []).includes(role));
    window.location.href = fallback ? fallback.href : 'admin-login.html';
    return false;
  }

  return true;
}

function renderAdminNav(activeKey) {
  const nav = document.getElementById('admin-nav');
  if (!nav) return;

  const role = getStaffRole();
  const items = ADMIN_NAV_ITEMS.filter(item => (PAGE_ACCESS[item.key] || []).includes(role));

  nav.innerHTML = items.map(item => `
    <a href="${item.href}" class="${item.key === activeKey ? 'is-active' : ''}">
      <i data-lucide="${item.icon}"></i> ${item.label}
    </a>`).join('');

  const roleLabel = document.getElementById('admin-role-label');
  if (roleLabel) roleLabel.textContent = `${getStaffName()} · ${ROLE_LABELS[role] || role}`;

  if (window.lucide) lucide.createIcons();
}

function initAdminLogout() {
  const logoutBtn = document.getElementById('admin-logout');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(STAFF_ROLE_KEY);
    localStorage.removeItem(STAFF_NAME_KEY);
    window.location.href = 'admin-login.html';
  });
}

document.addEventListener('DOMContentLoaded', initAdminLogout);

window.adminShared = {
  STAFF_ROLE_KEY,
  STAFF_NAME_KEY,
  getStaffRole,
  getStaffName,
  canManage,
  getCapability,
  requirePageAccess,
  renderAdminNav
};
