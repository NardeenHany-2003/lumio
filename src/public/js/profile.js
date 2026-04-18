document.addEventListener('DOMContentLoaded', () => {
  // Inline alert (validation errors only)
  const showFormAlert = (boxId, type, msg) => {
    const box = document.querySelector(`#${boxId}`);
    if (!box) return;
    box.innerHTML = `<div class="alert alert--${type}" style="margin-bottom:1.25rem;">${msg}</div>`;
    if (type === 'error')
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success')
      setTimeout(() => {
        box.innerHTML = '';
      }, 4000);
  };

  const setLoading = (btn, loading, defaultText, defaultIcon) => {
    btn.disabled = loading;
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');
    if (span) span.textContent = loading ? ' Saving…' : defaultText;
    if (icon) icon.className = loading ? 'bi bi-hourglass-split' : defaultIcon;
  };

  // Photo preview
  const photoInput = document.querySelector('#photo-input');
  const photoPreview = document.querySelector('#photo-preview');
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Image must be under 2MB.');
        photoInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Save Account Settings
  const saveAccountBtn = document.querySelector('#save-account-btn');
  if (saveAccountBtn) {
    saveAccountBtn.addEventListener('click', async () => {
      const name = document.querySelector('#name').value.trim();
      const email = document.querySelector('#email').value.trim();
      const bio = document.querySelector('#bio').value.trim();

      if (!name || !email) {
        return showFormAlert(
          'account-alert',
          'error',
          'Name and email are required.',
        );
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('bio', bio);
      if (photoInput && photoInput.files[0]) {
        formData.append('photo', photoInput.files[0]);
      }

      setLoading(saveAccountBtn, true, ' Save Changes', 'bi bi-check-lg');
      try {
        const res = await fetch('/api/v1/users/update-me', {
          method: 'PATCH',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const updatedUser = data.data.user;
        showToast('success', 'Account updated successfully.');

        // Update avatars and name across the page
        if (updatedUser.photo) {
          const newSrc = `/img/${updatedUser.photo}`;
          document
            .querySelectorAll(
              '.navbar__avatar, .dashboard__avatar, .profile-photo-preview',
            )
            .forEach((img) => {
              img.src = newSrc;
            });
        }
        document
          .querySelectorAll('.navbar__user-name, .dashboard__profile h3')
          .forEach((el) => {
            el.textContent = updatedUser.name;
          });
      } catch (err) {
        showFormAlert('account-alert', 'error', err.message);
      } finally {
        setLoading(saveAccountBtn, false, ' Save Changes', 'bi bi-check-lg');
      }
    });
  }

  // Save Password
  const savePasswordBtn = document.querySelector('#save-password-btn');
  if (savePasswordBtn) {
    savePasswordBtn.addEventListener('click', async () => {
      const passwordCurrent = document.querySelector('#passwordCurrent').value;
      const password = document.querySelector('#password').value;
      const passwordConfirm = document.querySelector('#passwordConfirm').value;

      if (!passwordCurrent || !password || !passwordConfirm) {
        return showFormAlert(
          'password-alert',
          'error',
          'Please fill in all password fields.',
        );
      }
      if (password.length < 8) {
        return showFormAlert(
          'password-alert',
          'error',
          'New password must be at least 8 characters.',
        );
      }
      if (password !== passwordConfirm) {
        return showFormAlert(
          'password-alert',
          'error',
          'New passwords do not match.',
        );
      }

      setLoading(savePasswordBtn, true, ' Update Password', 'bi bi-lock');
      try {
        const res = await fetch('/api/v1/auth/update-password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passwordCurrent, password, passwordConfirm }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        showToast('success', 'Password updated successfully.');
        document.querySelector('#passwordCurrent').value = '';
        document.querySelector('#password').value = '';
        document.querySelector('#passwordConfirm').value = '';
      } catch (err) {
        showFormAlert('password-alert', 'error', err.message);
      } finally {
        setLoading(savePasswordBtn, false, ' Update Password', 'bi bi-lock');
      }
    });
  }
}); 

// Deactivate account
const deleteAccountBtn = document.querySelector('#delete-account-btn');
if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener('click', async () => {
    const confirmed = await lumioConfirm({
      title: 'Deactivate your account?',
      message:
        'Your account will be deactivated immediately. You can contact support to reactivate it.',
      confirmLabel: 'Yes, deactivate',
      confirmClass: 'btn--danger',
      cancelLabel: 'Cancel',
      icon: '⚠️',
    });
    if (!confirmed) return;

    setLoading(deleteAccountBtn, true);
    try {
      const res = await fetch('/api/v1/users/delete-me', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Could not deactivate account.');
      }
      showToast('success', 'Account deactivated. Goodbye!');
      setTimeout(() => window.location.assign('/'), 1500);
    } catch (err) {
      showToast('error', err.message);
      setLoading(deleteAccountBtn, false);
    }
  });
}
