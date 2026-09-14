/**
 * admin-categories.js
 * Category management — admin & manager only.
 * Fields mirror the category table: category_name, description.
 */

let adminCategories = [
  { category_id: 1, category_name: 'Hair Care', description: 'Shampoos, conditioners, treatments' },
  { category_id: 2, category_name: 'Skin Care', description: 'Facial and skin treatment products' },
  { category_id: 3, category_name: 'Body Care', description: 'Body lotions, creams, scrubs' },
  { category_id: 4, category_name: 'Hair Oils', description: 'Oils for hair growth and moisture' },
  { category_id: 5, category_name: 'Lotions', description: 'Everyday moisturizing lotions' },
  { category_id: 6, category_name: 'Leave-In', description: 'Leave-in hair conditioners and sprays' }
];

let editingCategoryId = null;

function categoryRowTemplate(c) {
  return `
    <tr>
      <td>${c.category_name}</td>
      <td>${c.description || '—'}</td>
      <td>
        <div class="table-actions">
          <button data-edit-category="${c.category_id}" aria-label="Edit ${c.category_name}"><i data-lucide="pencil"></i></button>
          <button data-delete-category="${c.category_id}" aria-label="Delete ${c.category_name}"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>`;
}

function renderAdminCategories() {
  const tbody = document.getElementById('admin-categories-body');
  if (!tbody) return;

  tbody.innerHTML = adminCategories.map(categoryRowTemplate).join('');
  if (window.lucide) lucide.createIcons();

  tbody.querySelectorAll('[data-delete-category]').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = adminCategories.find(c => c.category_id === Number(btn.dataset.deleteCategory));
      adminCategories = adminCategories.filter(c => c.category_id !== Number(btn.dataset.deleteCategory));
      renderAdminCategories();
      window.showToast(`${category?.category_name || 'Category'} removed`, 'success');
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

  overlay.classList.add('is-open');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.remove('is-open');
  editingCategoryId = null;
}

function initCategoryModal() {
  const overlay = document.getElementById('category-modal');
  const form = document.getElementById('category-form');

  document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal(null));
  document.getElementById('category-modal-close').addEventListener('click', closeCategoryModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCategoryModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!window.validateForm(form)) return;

    const values = {
      category_name: document.getElementById('category-name').value,
      description: document.getElementById('category-description').value
    };

    if (editingCategoryId) {
      Object.assign(adminCategories.find(c => c.category_id === editingCategoryId), values);
      window.showToast('Category updated', 'success');
    } else {
      adminCategories.unshift({ category_id: Date.now(), ...values });
      window.showToast('Category added', 'success');
    }

    renderAdminCategories();
    closeCategoryModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.adminShared.requirePageAccess('categories')) return;
  window.adminShared.renderAdminNav('categories');
  initCategoryModal();
  renderAdminCategories();
});
