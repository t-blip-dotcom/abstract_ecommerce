

const ADMIN_NAV_ITEMS = [
  { key: 'products', href: 'admin-products.html', icon: 'package', label: 'Products' },
  { key: 'orders', href: 'admin-orders.html', icon: 'clipboard-list', label: 'Orders' },
  { key: 'brands', href: 'admin-brands.html', icon: 'tag', label: 'Brands' },
  { key: 'categories', href: 'admin-categories.html', icon: 'layout-grid', label: 'Categories' },
  { key: 'suppliers', href: 'admin-suppliers.html', icon: 'truck', label: 'Suppliers' },
  { key: 'customers', href: 'admin-customers.html', icon: 'users-round', label: 'Customers' },
  { key: 'staff', href: 'admin-staff.html', icon: 'user-cog', label: 'Staff' },
  { key: 'reports', href: 'admin-reports.html', icon: 'bar-chart-3', label: 'Reports' }
];

const PAGE_ACCESS = {
  products: ['admin', 'online_manager', 'staff'],
  orders: ['admin', 'online_manager', 'staff'],
  brands: ['admin', 'online_manager'],
  categories: ['admin', 'online_manager'],
  suppliers: ['admin', 'online_manager'],
  customers: ['admin'],
  staff: ['admin'],
  reports: ['admin', 'online_manager']
};

const PAGE_CAPABILITY = {
  admin: { products: 'manage', orders: 'manage', brands: 'manage', categories: 'manage', suppliers: 'manage', customers: 'manage', staff: 'manage', reports: 'view' },
  online_manager: { products: 'manage', orders: 'manage', brands: 'manage', categories: 'manage', suppliers: 'manage', reports: 'view' },
  staff: { products: 'view', orders: 'update-status' }
};

const ROLE_LABELS = { admin: 'Admin', online_manager: 'Manager', staff: 'Staff' };

let cachedUser = null;

async function fetchCurrentUser() {
  if (cachedUser !== null) return cachedUser;
  try {
    const { user } = await api.get('/auth/me');
    cachedUser = user?.type === 'staff' ? user : null;
  } catch (err) {

    if (err.status === 401) {
      cachedUser = null;
    } else {
      throw err;
    }
  }
  return cachedUser;
}

function getCapability(pageKey) {
  const role = cachedUser?.role;
  return (PAGE_CAPABILITY[role] || {})[pageKey] || 'none';
}

function canManage(pageKey) {
  return getCapability(pageKey) === 'manage';
}

/** Call at the top of every admin page's script, e.g. await requirePageAccess('orders'). */
async function requirePageAccess(pageKey) {
  let user;
  try {
    user = await fetchCurrentUser();
  } catch (err) {
    window.showToast("Can't reach the server right now — check that the backend is running, then refresh.", 'error');
    return false;
  }

  if (!user) {
    window.location.href = 'admin-login.html';
    return false;
  }

  const allowedRoles = PAGE_ACCESS[pageKey] || [];
  if (!allowedRoles.includes(user.role)) {
    const fallback = ADMIN_NAV_ITEMS.find(item => (PAGE_ACCESS[item.key] || []).includes(user.role));
    window.location.href = fallback ? fallback.href : 'admin-login.html';
    return false;
  }

  return true;
}

function renderAdminNav(activeKey) {
  const nav = document.getElementById('admin-nav');
  if (!nav || !cachedUser) return;

  const items = ADMIN_NAV_ITEMS.filter(item => (PAGE_ACCESS[item.key] || []).includes(cachedUser.role));
  nav.innerHTML = items.map(item => `
    <a href="${item.href}" class="${item.key === activeKey ? 'is-active' : ''}">
      <i data-lucide="${item.icon}"></i> ${item.label}
    </a>`).join('');

  const roleLabel = document.getElementById('admin-role-label');
  if (roleLabel) roleLabel.textContent = ROLE_LABELS[cachedUser.role] || cachedUser.role;

  if (window.lucide) lucide.createIcons();
}

function initAdminLogout() {
  const logoutBtn = document.getElementById('admin-logout');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async () => {
    await api.post('/auth/staff-logout', {}).catch(() => {});
    window.location.href = 'admin-login.html';
  });
}


function initSidebarToggle() {
  const toggleBtn = document.getElementById('admin-sidebar-toggle');
  const panel = document.getElementById('admin-sidebar-panel');
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', () => panel.classList.toggle('is-open'));
  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) panel.classList.remove('is-open');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminLogout();
  initSidebarToggle();
});

window.adminShared = { canManage, getCapability, requirePageAccess, renderAdminNav };