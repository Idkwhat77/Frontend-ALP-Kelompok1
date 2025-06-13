window.addEventListener('DOMContentLoaded', async () => {
  const storedUser = JSON.parse(localStorage.getItem('current_user'));

  if (!storedUser || !storedUser.id) return;

  const userId = storedUser.id;

  try {
    const response = await fetch(`http://localhost:8080/api/auth/me?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user data');

    const data = await response.json();
    const currentUser = data.user;

    document.getElementById('user-name').textContent = currentUser.fullName || '';
    document.getElementById('user-name2').textContent = currentUser.fullName || '';
    document.getElementById('user-email').textContent = currentUser.email || '';

  } catch (err) {
    console.error('Error loading profile:', err);
  }
});