/**
 * admin-staff.js
 * Staff management — admin only. Fields mirror the STAFF/ROLE
 * tables: name, email_address, role_id (shown as role name),
 * status, plus read-only created_at/last_login.
 * Once the backend exists:
 *   - GET/POST/PATCH/DELETE /api/admin/staff
 */

const ROLES = ['admin', 'online_manager', 'staff'];
const ROLE_LABELS = { admin: 'Admin', online_manager: 'Manager', staff: 'Staff' };

let adminStaff = [
  { staff_id: 1, name: 'Jane Kamau', email_address: 'jane@abstractcosmetics.co.ke', role: 'admin', status: 'active', last_login: '2026-09-12 09:14' },
  { staff_id: 2, name: 'Peter Otieno', email_address: 'peter.manager@abstractcosmetics.co.ke', role: 'online_manager', status: 'active', last_login: '2026-09-11 16:40' },
  { staff_id: 3, name: 'Mercy Wambui', email_address: 'mercy@abstractcosmetics.co.ke', role: 'staff', status: 'active', last_login: '2026-09-10 08:02' },
  { staff_id: 4, name: 'Samuel Kiptoo', email_address: 'samuel@abstractcosmetics.co.ke', role: 'staff', status: 'inactive', last_login: '2026-08-29 12:11' }
];

let editingStaffId = null;

function staffRowTemplate(s) {
  return `
    <tr>
      <td>${s.name}</td>
      <td>${s.email_address}</td>
      <td>${ROLE_LABELS[s.role] || s.role}</td>
      <td><span class="status-badge status-badge--${s.status === 'active' ? 'active' : 'out_of_stock'}">${s.status}</span></td>
      <td>${s.last_login || '—'}</td>
      <td>
        <div class="table-actions">
          <button data-edit-staff="${s.staff_id}" aria-label="Edit ${s.name}"><i data-lucide="pencil"></i></button>
          <button data-delete-staff="${s.staff_id}" aria-label="Remove ${s.name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

function renderAdminStaff() {
  const tbody = document.getElementById('admin-staff-body');
  if (!tbody) return;

  tbody.innerHTML = adminStaff.map(staffRowTemplate).join('');
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-delete-staff]').forEach(btn => {
    btn.addEventListener('click', () => {
      const staff = adminStaff.find(s => s.staff_id === Number(btn.dataset.deleteStaff));
      adminStaff = adminStaff.filter(s => s.staff_id !== Number(btn.dataset.deleteStaff));
      renderAdminStaff();
      window.showToast(`${staff?.name || 'Staff member'} removed`, 'success');
    });
  });

  tbody.querySelectorAll('[data-edit-staff]').forEach(btn => {
    btn.addEventListener('click', () => openStaffModal(Number(btn.dataset.editStaff)));
  });
}

function populateRoleSelect(selectedValue) {
  const select = document.getElementById('staff-role');
  select.innerHTML = ROLES.map(r =>
    `<option value="${r}" ${r === selectedValue ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`
  ).join('');
}

function openStaffModal(staffId) {
  const overlay = document.getElementById('staff-modal');
  const form = document.getElementById('staff-form');
  form.reset();

  editingStaffId = staffId || null;
  const staff = editingStaffId ? adminStaff.find(s => s.staff_id === editingStaffId) : null;

  document.getElementById('staff-modal-title').textContent = staff ? 'Edit staff member' : 'Add staff member';
  document.getElementById('staff-form-submit').textContent = staff ? 'Save changes' : 'Save staff member';
  populateRoleSelect(staff?.role || 'staff');
  document.getElementById('staff-status').value = staff?.status || 'active';

  if (staff) {
    document.getElementById('staff-name').value = staff.name;
    document.getElementById('staff-email').value = staff.email_address;
  }

  overlay.classList.add('is-open');
}

function closeStaffModal() {
  document.getElementById('staff-modal').classList.remove('is-open');
  editingStaffId = null;
}

function initStaffModal() {
  const overlay = document.getElementById('staff-modal');
  const form = document.getElementById('staff-form');

  document.getElementById('add-staff-btn').addEventListener('click', () => openStaffModal(null));
  document.getElementById('staff-modal-close').addEventListener('click', closeStaffModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeStaffModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const values = {
      name: document.getElementById('staff-name').value,
      email_address: document.getElementById('staff-email').value,
      role: document.getElementById('staff-role').value,
      status: document.getElementById('staff-status').value
    };

    if (editingStaffId) {
      Object.assign(adminStaff.find(s => s.staff_id === editingStaffId), values);
      window.showToast('Staff member updated', 'success');
    } else {
      adminStaff.unshift({ staff_id: Date.now(), last_login: null, ...values });
      window.showToast('Staff member added', 'success');
    }

    renderAdminStaff();
    closeStaffModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('staff')) return;
  window.adminShared.renderAdminNav('staff');
  initStaffModal();
  renderAdminStaff();
});
