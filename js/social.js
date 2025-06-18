class SocialManager {
    constructor() {
        this.currentUserId = null;
        this.socials = [];
        this.init();
    }

    init() {
        const socialForm = document.getElementById('social-form');
        if (socialForm) {
            socialForm.addEventListener('submit', (e) => this.handleAddSocial(e));
        }

        // Initialize for the logged-in user
        this.initializeForCurrentUser();
    }

    async initializeForCurrentUser() {
        try {
            const storedUser = JSON.parse(localStorage.getItem('current_user'));
            if (!storedUser || !storedUser.id) return;

            this.currentUserId = storedUser.id;
            await this.loadSocials();
        } catch (error) {
            console.error('Error initializing social manager:', error);
        }
    }

    async loadSocials() {
        try {
            if (!this.currentUserId) return;

            const response = await window.apiClient.getCandidateSocials(this.currentUserId);
            
            if (response && response.socials) {
                this.socials = response.socials;
                this.displaySocials();
                this.displaySocialsInModal();
            }
        } catch (error) {
            console.error('Error loading socials:', error);
            // Show empty state
            this.displaySocials();
            this.displaySocialsInModal();
        }
    }

    async handleAddSocial(e) {
        e.preventDefault();

        const platform = document.getElementById('social-platform').value;
        const url = document.getElementById('social-url').value;

        if (!platform || !url) return;

        try {
            const socialData = {
                platform: platform,
                url: url,
                candidateId: this.currentUserId
            };

            const response = await window.apiClient.addCandidateSocial(socialData);
            
            if (response && response.success) {
                // Reset form
                document.getElementById('social-form').reset();
                
                // Reload socials
                await this.loadSocials();
                
                // Show success message
                this.showMessage('Social media added successfully!', 'success');
            } else {
                throw new Error(response?.message || 'Failed to add social media');
            }
            
        } catch (error) {
            console.error('Error adding social media:', error);
            this.showMessage('Error adding social media. Please try again.', 'error');
        }
    }

    async deleteSocial(socialId) {
        if (!confirm('Are you sure you want to delete this social media link?')) {
            return;
        }

        try {
            const response = await window.apiClient.deleteCandidateSocial(socialId);
            
            if (response && response.success) {
                await this.loadSocials();
                this.showMessage('Social media deleted successfully!', 'success');
            } else {
                throw new Error(response?.message || 'Failed to delete social media');
            }
        } catch (error) {
            console.error('Error deleting social media:', error);
            this.showMessage('Error deleting social media. Please try again.', 'error');
        }
    }

    displaySocials() {
        const socialsContainer = document.getElementById('current-socials-list');
        if (!socialsContainer) return;

        if (!this.socials || this.socials.length === 0) {
            const noSocialText = window.currentLanguage === 'id' ? 'Belum ada tautan media sosial yang ditambahkan' : 'No social media links added yet';
            const socialIconText = window.currentLanguage === 'id' ? 'Bagikan' : 'Share';
            
            socialsContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-share-alt text-2xl mb-2" aria-label="${socialIconText}"></i>
                    <p data-i18n="social.no_links">${noSocialText}</p>
                </div>
            `;
            return;
        }

        socialsContainer.innerHTML = this.socials.map(social => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center">
                    <i class="${this.getPlatformIcon(social.platform)} mr-3 text-lilac-400"></i>
                    <div>
                        <span class="text-gray-600 dark:text-gray-300 capitalize font-medium">${social.platform}</span>
                        <a href="${social.url}" target="_blank" class="block text-sm text-blue-500 hover:underline truncate max-w-[200px]">
                            ${social.url}
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displaySocialsInModal() {
        const modalSocialsContainer = document.getElementById('modal-socials-list');
        if (!modalSocialsContainer) return;

        if (!this.socials || this.socials.length === 0) {
            modalSocialsContainer.innerHTML = `
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    <p>No social media links added yet</p>
                </div>
            `;
            return;
        }

        modalSocialsContainer.innerHTML = this.socials.map(social => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center flex-1">
                    <i class="${this.getPlatformIcon(social.platform)} mr-3 text-lilac-400"></i>
                    <div class="flex-1">
                        <span class="text-gray-600 dark:text-gray-300 capitalize font-medium">${social.platform}</span>
                        <a href="${social.url}" target="_blank" class="block text-sm text-blue-500 hover:underline truncate">
                            ${social.url}
                        </a>
                    </div>
                </div>
                <button onclick="window.socialManager.deleteSocial(${social.id})" 
                        class="text-red-500 hover:text-red-700 p-1">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    getPlatformIcon(platform) {
        const icons = {
            instagram: 'fab fa-instagram',
            facebook: 'fab fa-facebook-f',
            twitter: 'fab fa-twitter',
            linkedin: 'fab fa-linkedin-in',
            github: 'fab fa-github',
            youtube: 'fab fa-youtube',
            tiktok: 'fab fa-tiktok',
            website: 'fas fa-globe'
        };
        return icons[platform.toLowerCase()] || 'fas fa-link';
    }

    showMessage(message, type) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-20 right-4 z-50 p-4 rounded-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } transition-all duration-300 transform translate-x-full`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize social manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.socialManager = new SocialManager();
});

// Function to initialize socials for a specific candidate (for viewing other profiles)
window.initializeCandidateSocials = function(candidateId) {
    if (window.socialManager) {
        window.socialManager.currentUserId = candidateId;
        window.socialManager.loadSocials();
    }
};