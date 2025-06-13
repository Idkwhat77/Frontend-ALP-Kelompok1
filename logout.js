document.addEventListener('DOMContentLoaded', () => {
const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
    if (typeof apiClient !== 'undefined') {
        apiClient.logout(); // Clears current user and redirects to login.html
    } else {
        localStorage.removeItem('current_user');
        window.location.href = 'login.html';
    }
    });
}
});