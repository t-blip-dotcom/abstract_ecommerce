/**
 * admin-staff.js
 * Admin only. Same api.get/post/patch/delete pattern as
 * admin-categories.js — see that file's comments for the full
 * explanation. The one extra action here is Approve, which is just
 * a PATCH to a dedicated endpoint since that's the one thing an
 * admin has to do per new hire.
 */

const STATUS_LABELS = { pending: 'Pending approval', active: 'Active', inactive: 'Inactive' };
const ROLES = ['admin', 'online_manager', 'staff'];

let adminStaff = [];
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
      <td>${ROLE_LABELS[s.role_name] || s.role_name}</td>
      <td><span class="status-badge ${statusBadgeClass(s.status)}">${STATUS_LABELS[s.status] || s.status}</span></td>
      <td>${s.last_login ? new Date(s.last_login).toLocaleString('en-KE') : '—'}</td>
      <td>
        <div class="table-actions">
          ${s.status === 'pending' ? `<button data-approve-staff="${s.staff_id}" aria-label="Approve ${s.name}"><i data-lucide="check"></i></button>` : ''}
          <button data-edit-staff="${s.staff_id}" aria-label="Edit ${s.name}"><i data-lucide="pencil"></i></button>
          <button data-delete-staff="${s.staff_id}" aria-label="Remove ${s.name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

async function loadStaff() {
  try {
    adminStaff = await api.get('/staff'); // backend already sorts pending-first
  } catch (err) {
    window.showToast(err.message, 'error');
    adminStaff = [];
  }
  renderAdminStaff();
}

function renderAdminStaff() {
  const tbody = document.getElementById('admin-staff-body');
  if (!tbody) return;

  tbody.innerHTML = adminStaff.length
    ? adminStaff.map(staffRowTemplate).join('')
    : `<tr><td colspan="6"><div class="empty-state"><i data-lucide="user-cog"></i><h3>No staff yet</h3></div></td></tr>`;
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-approve-staff]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.approveStaff;
      try {
        const staff = await api.patch(`/staff/${id}/approve`);
        window.showToast(`${staff.name} approved — they can now log in`, 'success');
        loadStaff();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-delete-staff]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteStaff;
      const staff = adminStaff.find(s => String(s.staff_id) === id);
      try {
        await api.delete(`/staff/${id}`);
        window.showToast(`${staff?.name || 'Staff member'} removed`, 'success');
        loadStaff();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-edit-staff]').forEach(btn => {
    btn.addEventListener('click', () => openStaffModal(btn.dataset.editStaff));
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
  const staff = editingStaffId ? adminStaff.find(s => String(s.staff_id) === editingStaffId) : null;

  document.getElementById('staff-modal-title').textContent = staff ? 'Edit staff member' : 'Add staff member';
  document.getElementById('staff-form-submit').textContent = staff ? 'Save changes' : 'Save staff member';
  populateRoleSelect(staff?.role_name || 'staff');
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

  // Admins edit existing staff here (role/status); new staff always
  // sign themselves up via admin-login.html's "Request access" tab,
  // so there's no "Add staff member" button on this page.
  document.getElementById('staff-modal-close').addEventListener('click', () => window.confirmDiscard(form, closeStaffModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeStaffModal);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;
    if (!editingStaffId) return;

    const body = {
      name: document.getElementById('staff-name').value,
      role: document.getElementById('staff-role').value,
      status: document.getElementById('staff-status').value
    };
    const submitBtn = document.getElementById('staff-form-submit');
    submitBtn.disabled = true;

    try {
      await api.patch(`/staff/${editingStaffId}`, body);
      window.showToast('Staff member updated', 'success');
      window.markFormClean(form);
      closeStaffModal();
      loadStaff();
    } catch (err) {
      window.applyServerFieldErrors(form, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('staff'))) return;
  window.adminShared.renderAdminNav('staff');
  initStaffModal();
  loadStaff();
});