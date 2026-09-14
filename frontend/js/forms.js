/**
 * forms.js
 * Shared validation used by every form on the site (login, register,
 * staff login, checkout, add-product, etc). Call validateForm(formEl)
 * on submit before doing anything else — it returns true only if every
 * required field has a value, and otherwise shows an inline message
 * under each blank field plus focuses the first one.
 *
 * Expects each required input to sit inside a `.field` wrapper that
 * has a <label> and, ideally, a <span class="field-error"></span>
 * (added automatically if missing).
 */

function fieldLabelText(field, input) {
  const label = field.querySelector('label');
  if (label) return label.textContent.replace('*', '').trim();
  return input.placeholder || input.name || 'This field';
}

function clearFieldError(field) {
  field.classList.remove('has-error');
}

function setFieldError(field, message) {
  field.classList.add('has-error');
  let errorEl = field.querySelector('.field-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    field.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

function validateForm(formEl) {
  if (!formEl) return true;

  const requiredInputs = formEl.querySelectorAll('[required]');
  let firstInvalid = null;
  let isValid = true;

  requiredInputs.forEach(input => {
    const field = input.closest('.field') || input.parentElement;
    const value = (input.value || '').trim();

    if (!value) {
      isValid = false;
      setFieldError(field, `${fieldLabelText(field, input)} is required — please fill this in before submitting.`);
      if (!firstInvalid) firstInvalid = input;
    } else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      isValid = false;
      setFieldError(field, 'Enter a valid email address.');
      if (!firstInvalid) firstInvalid = input;
    } else {
      clearFieldError(field);
    }
  });

  if (!isValid) {
    firstInvalid.focus();
    if (window.showToast) window.showToast('Please fill in the highlighted fields before submitting.', 'error');
  }

  return isValid;
}

// Clear a field's error state as soon as the person starts fixing it.
document.addEventListener('input', (e) => {
  const field = e.target.closest?.('.field');
  if (field && field.classList.contains('has-error') && e.target.value.trim()) {
    clearFieldError(field);
  }
});

window.validateForm = validateForm;
