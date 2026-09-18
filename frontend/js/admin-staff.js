/**
 * admin-staff.js
 * Staff management — admin only. Staff no longer sign up with a
 * company email; they pick a username + password themselves on
 * admin-login.html, which creates a `pending` row here. An admin
 * approves (or removes) the request — that's the only step admins
 * have to do, keeping their workload light.
 * Once the backend exists:
 *   - GET    /api/admin/staff
 *   - POST   /api/admin/staff              (admin-created accounts)
 *   - PATCH  /api/admin/staff/:id          (edit / approve)
 *   - DELETE /api/admin/staff/:id
 */

const ROLES = ['admin', 'online_manager', 'staff'];
const ROLE_LABELS = { admin: 'Admin', online_manager: 'Manager', staff: 'Staff' };
const STATUS_LABELS = { pending: 'Pending approval', active: 'Active', inactive: 'Inactive' };

let adminStaff = [
  { staff_id: 1, name: 'Jane Kamau', username: 'admin', role: 'admin', status: 'active', last_login: '2026-09-12 09:14' },
  { staff_id: 2, name: 'Peter Otieno', username: 'manager', role: 'online_manager', status: 'active', last_login: '2026-09-11 16:40' },
  { staff_id: 3, name: 'Mercy Wambui', username: 'staff', role: 'staff', status: 'active', last_login: '2026-09-10 08:02' },
  { staff_id: 4, name: 'Samuel Kiptoo', username: 'samkip', role: 'staff', status: 'inactive', last_login: '2026-08-29 12:11' },
  { staff_id: 5, name: 'Lucy Nyambura', username: 'lucyn', role: 'staff', status: 'pending', last_login: null }
];

let editingStaffId = null;

function statusBadgeClass(status) {
  if (status === 'active') return 'status-badge--active';
  if (status === 'pending') return 'status-badge--pending';
  return 'status-badge--out_of_stock';
}

function staffRowTemplate(s) {
  return `
    <tr>
      <td>${s.name}</td>
      <td>${s.username}</td>
      <td>${ROLE_LABELS[s.role] || s.role}</td>
      <td><span class="status-badge ${statusBadgeClass(s.status)}">${STATUS_LABELS[s.status] || s.status}</span></td>
      <td>${s.last_login || '—'}</td>
      <td>
        <div class="table-actions">
          ${s.status === 'pending' ? `<button data-approve-staff="${s.staff_id}" aria-label="Approve ${s.name}"><i data-lucide="check"></i></button>` : ''}
          <button data-edit-staff="${s.staff_id}" aria-label="Edit ${s.name}"><i data-lucide="pencil"></i></button>
          <button data-delete-staff="${s.staff_id}" aria-label="Remove ${s.name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

function renderAdminStaff() {
  const tbody = document.getElementById('admin-staff-body');
  if (!tbody) return;

  // Pending requests first, so they don't get missed.
  const sorted = [...adminStaff].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0));
  tbody.innerHTML = sorted.map(staffRowTemplate).join('');
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-approve-staff]').forEach(btn => {
    btn.addEventListener('click', () => {
      const staff = adminStaff.find(s => s.staff_id === Number(btn.dataset.approveStaff));
      if (!staff) return;
      staff.status = 'active';
      renderAdminStaff();
      window.showToast(`${staff.name} approved — they can now log in`, 'success');
    });
  });

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
    document.getElementById('staff-username').value = staff.username;
  }

  window.markFormClean(form);
  overlay.classList.add('is-open');
}

function closeStaffModal() {
  document.getElementById('staff-modal').classList.remove('is-open');
  editingStaffId = null;
}

function initStaffModal() {
  const overlay = document.getElementById('staff-modal');
  const form = document.getElementById('staff-form');

  window.initDirtyTracking(form);
  document.getElementById('add-staff-btn').addEventListener('click', () => openStaffModal(null));
  document.getElementById('staff-modal-close').addEventListener('click', () => window.confirmDiscard(form, closeStaffModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeStaffModal);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const values = {
      name: document.getElementById('staff-name').value,
      username: document.getElementById('staff-username').value,
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
    window.markFormClean(form);
    closeStaffModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('staff')) return;
  window.adminShared.renderAdminNav('staff');
  initStaffModal();
  renderAdminStaff();
});