const token = document.currentScript?.dataset.token;
const btn   = document.querySelector('#reset-btn');

const showAlert = (type, msg) => {
  const box = document.querySelector('#alert-box');
  if (box) box.innerHTML = `<div class="alert alert--${type}">${msg}</div>`;
};

const setLoading = (loading) => {
  if (!btn) return;
  btn.disabled = loading;
  const label   = btn.querySelector('span:first-child');
  const spinner = btn.querySelector('.btn__spinner');
  if (label)   label.hidden   = loading;
  if (spinner) spinner.hidden = !loading;
};

btn?.addEventListener('click', async () => {
  const password        = document.querySelector('#password')?.value;
  const passwordConfirm = document.querySelector('#passwordConfirm')?.value;

  if (!password || !passwordConfirm)
    return showAlert('error', 'Please fill in both fields.');
  if (password.length < 8)
    return showAlert('error', 'Password must be at least 8 characters.');
  if (password !== passwordConfirm)
    return showAlert('error', 'Passwords do not match.');
  if (!token)
    return showAlert('error', 'Invalid or missing reset token. Please request a new link.');

  setLoading(true);
  try {
    const res  = await fetch(`/api/v1/auth/reset-password/${token}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password, passwordConfirm }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Reset failed.');
    showAlert('success', 'Password reset! Redirecting to login…');
    setTimeout(() => window.location.assign('/login'), 1500);
  } catch (err) {
    showAlert('error', err.message);
  } finally {
    setLoading(false);
  }
});
