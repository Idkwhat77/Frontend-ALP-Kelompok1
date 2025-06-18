// Universal Navbar Profile Management for Both Employee and Company Users

class NavbarProfileManager {
    constructor() {
        this.currentUser = null;
        this.userType = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCurrentUserProfile();
            this.setupLogoutHandlers();
        } catch (error) {
            console.error('Failed to initialize navbar profile:', error);
        }
    }

    async loadCurrentUserProfile() {
        // Get current user from API client
        this.currentUser = window.apiClient?.getCurrentUser();
        this.userType = window.apiClient?.getUserType();

        if (!this.currentUser || !this.userType) {
            console.warn('No authenticated user found for navbar');
            return;
        }

        try {
            let profileData = null;
            let imageUrl = 'img/default-profile.png';

            if (this.userType === 'employee') {
                // Load employee profile
                const response = await window.apiClient.getCandidateByUserId(this.currentUser.id);
                if (response && response.candidate) {
                    profileData = response.candidate;
                    if (profileData.profileImageUrl) {
                        imageUrl = `http://localhost:8080${profileData.profileImageUrl}`;
                    }
                }
            } else if (this.userType === 'company') {
                // Load company profile
                const response = await window.apiClient.getCompanyByUserId(this.currentUser.id);
                if (response && response.company) {
                    profileData = response.company;
                    if (profileData.profileImageUrl) {
                        imageUrl = `http://localhost:8080${profileData.profileImageUrl}`;
                    }
                }
            }

            // Update all navbar profile images
            this.updateNavbarImages(imageUrl);

            // Update profile link to correct page
            this.updateProfileLinks();

        } catch (error) {
            console.error('Error loading user profile for navbar:', error);
        }
    }

    updateNavbarImages(imageUrl) {
        // Update desktop navbar profile image
        const profileImageNav = document.getElementById('profile-image-nav');
        if (profileImageNav) {
            profileImageNav.style.backgroundImage = `url('${imageUrl}')`;
        }

        // Update mobile navbar profile image
        const profileImageMobile = document.getElementById('profile-image-mobile');
        if (profileImageMobile) {
            profileImageMobile.style.backgroundImage = `url('${imageUrl}')`;
        }

        // Update any other navbar profile images (but not the main profile image on profile pages)
        const navbarProfileImages = document.querySelectorAll('[id*="profile-image"]:not(#profile-image)');
        navbarProfileImages.forEach(img => {
            if (img.tagName === 'IMG') {
                img.src = imageUrl;
            } else {
                img.style.backgroundImage = `url('${imageUrl}')`;
            }
        });
    }

    updateProfileLinks() {
        // Determine correct profile page based on user type
        const profileUrl = this.userType === 'company' ? 'profilecom.html' : 'profiledesign.html';
        
        // Update all "View Profile" links, but not if we're on employee_profile.html viewing someone else
        const isViewingOtherProfile = window.location.pathname.includes('employee_profile.html') || 
                                    window.location.pathname.includes('companyview.html');
        
        if (!isViewingOtherProfile) {
            // Update links that point to profile.html or profiledesign.html
            const profileLinks = document.querySelectorAll('a[href="profile.html"], a[href="profiledesign.html"]');
            profileLinks.forEach(link => {
                if (link.getAttribute('data-i18n') === 'view_profile' || 
                    link.textContent.includes('Profile') || 
                    link.textContent.includes('Profil')) {
                    link.href = profileUrl;
                }
            });
        }
    }

    setupLogoutHandlers() {
        // Setup logout functionality for all logout buttons/links (desktop and mobile)
        const logoutElements = document.querySelectorAll('#logout, [data-i18n="profile.logout"], #mobile-logout');
        
        logoutElements.forEach(element => {
            // Remove existing event listeners by cloning the element
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Add new event listener
            newElement.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        });

        // Also handle any mobile logout buttons that might be added dynamically
        document.addEventListener('click', (e) => {
            if (e.target.id === 'mobile-logout' || 
                e.target.closest('#mobile-logout') || 
                e.target.classList.contains('mobile-logout-btn')) {
                e.preventDefault();
                this.handleLogout();
            }
        });
    }

    handleLogout() {
        try {
            // Clear user-specific notifications
            if (window.notificationManager) {
                window.notificationManager.clearUserNotifications();
            }
            
            if (window.apiClient && typeof window.apiClient.logout === 'function') {
                window.apiClient.logout();
            } else {
                // Fallback logout
                localStorage.removeItem('current_user');
                localStorage.removeItem('user_type');
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout anyway
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }

    // Public method to refresh navbar when profile is updated
    async refreshNavbar() {
        await this.loadCurrentUserProfile();
    }
}

// Global instance
let navbarProfileManager = null;

// Initialize navbar profile manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for API client to be ready
    setTimeout(() => {
        if (window.apiClient) {
            navbarProfileManager = new NavbarProfileManager();
            window.navbarProfileManager = navbarProfileManager;
        }
    }, 100);
});

// Export for use in other scripts
window.NavbarProfileManager = NavbarProfileManager;