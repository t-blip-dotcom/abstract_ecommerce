    const tabs = document.querySelectorAll('[data-auth-tab]');
    const forms = document.querySelectorAll('[data-auth-form]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('is-active'));
        forms.forEach(f => f.classList.remove('is-active'));
        tab.classList.add('is-active');
        document.querySelector(`[data-auth-form="${tab.dataset.authTab}"]`).classList.add('is-active');
      });
    });

    document.getElementById('staff-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if (!window.validateForm(form)) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        await api.post('/auth/staff-login', {
          username: document.getElementById('staff-username').value.trim(),
          password: document.getElementById('staff-password').value
        });
        window.showToast('Logged in successfully.', 'success');
        window.location.href = '/admin/products';
      } catch (err) {
        //displaying the not approved yet error
        window.showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });

    document.getElementById('staff-request-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      if (!window.validateForm(form)) return;

      const password = document.getElementById('request-password');
      const confirm = document.getElementById('request-password-confirm');
      const confirmField = confirm.closest('.field');

      if (password.value !== confirm.value) {
        confirmField.classList.add('has-error');
        let errorEl = confirmField.querySelector('.field-error');
        if (!errorEl) {
          errorEl = document.createElement('span');
          errorEl.className = 'field-error';
          confirmField.appendChild(errorEl);
        }
        errorEl.textContent = "Passwords don't match — please re-enter them.";
        window.showToast("Those passwords don't match.", 'error');
        confirm.focus();
        return;
      }
      confirmField.classList.remove('has-error');

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        await api.post('/auth/staff-request', {
          name: document.getElementById('request-name').value,
          username: document.getElementById('request-username').value,
          password: password.value
        });
        window.showToast('Request submitted! An admin will review and approve your account.', 'success');
        form.reset();
        document.querySelector('[data-auth-tab="login"]').click();
      } catch (err) {
        window.applyServerFieldErrors(form, err.fieldErrors);
        window.showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });