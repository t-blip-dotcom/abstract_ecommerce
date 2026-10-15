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


document.addEventListener('input', (e) => {
  const field = e.target.closest?.('.field');
  if (field && field.classList.contains('has-error') && e.target.value.trim()) {
    clearFieldError(field);
  }
});

window.validateForm = validateForm;


function applyServerFieldErrors(form, fieldErrors) {
  if (!form || !fieldErrors) return;
  Object.entries(fieldErrors).forEach(([fieldName, message]) => {
    const input = form.querySelector(`[name="${fieldName}"], #${fieldName}`);
    const field = input?.closest('.field');
    if (field) setFieldError(field, message);
  });
}

window.applyServerFieldErrors = applyServerFieldErrors;


function initDirtyTracking(form) {
  if (!form) return;
  form.dataset.dirty = 'false';
  form.addEventListener('input', () => { form.dataset.dirty = 'true'; });
  form.addEventListener('change', () => { form.dataset.dirty = 'true'; });
}

function markFormClean(form) {
  if (form) form.dataset.dirty = 'false';
}

function confirmDiscard(form, onConfirmedClose) {
  if (!form || form.dataset.dirty !== 'true') {
    onConfirmedClose();
    return;
  }
  showConfirmDialog({
    message: 'You have unsaved changes. Leave without saving?',
    confirmLabel: 'Leave without saving',
    cancelLabel: 'Keep editing'
  }).then((confirmed) => {
    if (confirmed) onConfirmedClose();
  });
}


function showConfirmDialog({ message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }) {
  return new Promise((resolve) => {
    let overlay = document.getElementById('confirm-dialog');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'confirm-dialog';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <p class="confirm-dialog-message" id="confirm-dialog-message"></p>
          <div class="confirm-dialog-actions">
            <button type="button" class="btn btn--outline" id="confirm-dialog-cancel"></button>
            <button type="button" class="btn btn--primary" id="confirm-dialog-confirm"></button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }

    overlay.querySelector('#confirm-dialog-message').textContent = message;
    const cancelBtn = overlay.querySelector('#confirm-dialog-cancel');
    const confirmBtn = overlay.querySelector('#confirm-dialog-confirm');
    cancelBtn.textContent = cancelLabel;
    confirmBtn.textContent = confirmLabel;

    function finish(result) {
      overlay.classList.remove('is-open');
      cancelBtn.onclick = null;
      confirmBtn.onclick = null;
      resolve(result);
    }

    cancelBtn.onclick = () => finish(false);
    confirmBtn.onclick = () => finish(true);
    overlay.classList.add('is-open');
  });
}

window.initDirtyTracking = initDirtyTracking;
window.markFormClean = markFormClean;
window.confirmDiscard = confirmDiscard;
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
      }
      
      
      if (window.lucide) lucide.createIcons();
    });
  });
}

document.addEventListener('DOMContentLoaded', initPasswordToggles);