const btn = document.querySelector('#forgot-btn');


btn?.addEventListener('click', async () => {
  const email = document.querySelector('#email')?.value.trim();

  if (!email) return showAlert('error', 'Please enter your email address.');

  setLoading(btn, true);

  try {
    const res = await fetch('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Something went wrong.');

    showAlert('success', data.message);
  } catch (err) {
    showAlert('error', err.message);
  } finally {
    setLoading(btn, false);
  }
});
