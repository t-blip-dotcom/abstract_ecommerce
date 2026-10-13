
let adminCategories = [];
let editingCategoryId = null;

function categoryRowTemplate(c) {
  return `
    <tr>
      <td>${c.category_name}</td>
      <td class="hide-on-mobile">${c.description || '—'}</td>
      <td>
        <div class="table-actions">
          <button data-edit-category="${c.category_id}" aria-label="Edit ${c.category_name}"><i data-lucide="pencil"></i></button>
          <button data-delete-category="${c.category_id}" aria-label="Delete ${c.category_name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

async function loadCategories() {
  try {
    adminCategories = await api.get('/categories');
  } catch (err) {
    window.showToast(err.message, 'error');
    adminCategories = [];
  }
  renderAdminCategories();
}

function renderAdminCategories() {
  const tbody = document.getElementById('admin-categories-body');
  if (!tbody) return;

  tbody.innerHTML = adminCategories.length
    ? adminCategories.map(categoryRowTemplate).join('')
    : `<tr><td colspan="3"><div class="empty-state"><i data-lucide="layout-grid"></i><h3>No categories yet</h3></div></td></tr>`;
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-delete-category]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.deleteCategory);
      const category = adminCategories.find(c => c.category_id === id);
      try {
        await api.delete(`/categories/${id}`);
        window.showToast(`${category?.category_name || 'Category'} removed`, 'success');
        loadCategories();
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-edit-category]').forEach(btn => {
    btn.addEventListener('click', () => openCategoryModal(Number(btn.dataset.editCategory)));
  });
}

function openCategoryModal(categoryId) {
  const overlay = document.getElementById('category-modal');
  const form = document.getElementById('category-form');
  form.reset();

  editingCategoryId = categoryId || null;
  const category = editingCategoryId ? adminCategories.find(c => c.category_id === editingCategoryId) : null;

  document.getElementById('category-modal-title').textContent = category ? 'Edit category' : 'Add category';
  document.getElementById('category-form-submit').textContent = category ? 'Save changes' : 'Save category';

  if (category) {
    document.getElementById('category-name').value = category.category_name;
    document.getElementById('category-description').value = category.description || '';
  }

  window.markFormClean(form);
  overlay.classList.add('is-open');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('is-open');
  editingCategoryId = null;
}

function initCategoryModal() {
  const overlay = document.getElementById('category-modal');
  const form = document.getElementById('category-form');

  window.initDirtyTracking(form);
  document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal(null));
  document.getElementById('category-modal-close').addEventListener('click', () => window.confirmDiscard(form, closeCategoryModal));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.confirmDiscard(form, closeCategoryModal);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const body = {
      category_name: document.getElementById('category-name').value,
      description: document.getElementById('category-description').value
    };
    const submitBtn = document.getElementById('category-form-submit');
    submitBtn.disabled = true;

    try {
      if (editingCategoryId) {
        await api.patch(`/categories/${editingCategoryId}`, body);
        window.showToast('Category updated', 'success');
      } else {
        await api.post('/categories', body);
        window.showToast('Category added', 'success');
      }
      window.markFormClean(form);
      closeCategoryModal();
      loadCategories();
    } catch (err) {
      window.applyServerFieldErrors(form, err.fieldErrors);
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!(await window.adminShared.requirePageAccess('categories'))) return;
  window.adminShared.renderAdminNav('categories');
  initCategoryModal();
  loadCategories();
});