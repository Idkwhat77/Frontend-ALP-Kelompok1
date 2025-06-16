// Company Profile Management Script - Similar to profile.js

class CompanyProfileManager {
    constructor() {
        this.currentCompany = null;
        this.isOwnProfile = false;
        this.init();
    }

    async init() {
        try {
            await this.loadCompanyProfile();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize company profile:', error);
            this.showError('Failed to load company profile');
        }
    }

    async loadCompanyProfile() {
        const user = window.apiClient?.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Check if we're viewing a specific company (from URL params)
            const urlParams = new URLSearchParams(window.location.search);
            const companyId = urlParams.get('id');

            let response;
            if (companyId) {
                // Viewing specific company profile
                response = await window.apiClient.getCompanyById(companyId);
                this.isOwnProfile = false;
            } else {
                // Load current user's company profile
                response = await window.apiClient.getCompanyByUserId(user.id);
                this.isOwnProfile = true;
            }

            if (response && response.success && response.company) {
                this.currentCompany = response.company;
                this.displayCompanyProfile(response.company);
                
                // Set context for image upload
                if (typeof setCompanyContext === 'function') {
                    setCompanyContext(response.company.id, this.isOwnProfile);
                }
            } else {
                throw new Error('Company profile not found');
            }
        } catch (error) {
            console.error('Error loading company profile:', error);
            this.showError('Company profile not found. Please create a company profile first.');
        }
    }

    displayCompanyProfile(company) {
        // Update company name and basic info
        this.updateElement('company-name', company.companyName);
        this.updateElement('company-name-header', company.companyName);
        this.updateElement('company-industry', company.industry);
        // Display company size as integer with "employees" text
        this.updateElement('company-size', `${company.companySize} Employees`);
        this.updateElement('company-foundation-date', this.formatDate(company.foundationDate));
        this.updateElement('company-hq', company.hq);
        this.updateElement('company-email', company.email);
        
        // Update company description
        const descriptionElement = document.getElementById('company-description');
        if (descriptionElement) {
            if (company.description && company.description.trim()) {
                descriptionElement.textContent = company.description;
            } else {
                descriptionElement.innerHTML = `
                    <span class="text-gray-400 dark:text-gray-500 italic">
                        <i class="fas fa-info-circle mr-2"></i>
                        No company description provided
                    </span>
                `;
            }
        }

        // Update company profile image
        this.updateCompanyImage(company);

        // Update page title
        document.title = `${company.companyName} - RuangKerja`;
    }

    updateCompanyImage(company) {
        const profileImageElement = document.getElementById('company-profile-image');
        const imageUrl = company.profileImageUrl 
            ? `http://localhost:8080${company.profileImageUrl}`
            : 'img/default-profile.png';

        if (profileImageElement) {
            profileImageElement.style.backgroundImage = `url('${imageUrl}')`;
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && value) {
            element.textContent = value;
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (error) {
            return dateString;
        }
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    }

    setupEventListeners() {
        // Settings form handling
        const settingsForm = document.getElementById('company-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
            
            // Load current profile data when settings modal opens
            const settingsModal = document.getElementById('modal-settings');
            if (settingsModal) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            if (!settingsModal.classList.contains('hidden')) {
                                this.loadCurrentCompanyData();
                            }
                        }
                    });
                });
                observer.observe(settingsModal, { attributes: true });
            }
        }
    }

    // Load current company data into the settings form
    loadCurrentCompanyData() {
        if (!this.currentCompany) return;

        // Populate form fields
        document.getElementById('settings-company-name').value = this.currentCompany.companyName || '';
        document.getElementById('settings-company-email').value = this.currentCompany.email || '';
        document.getElementById('settings-company-industry').value = this.currentCompany.industry || '';
        // Set company size as integer value
        document.getElementById('settings-company-size').value = this.currentCompany.companySize || '';
        document.getElementById('settings-company-hq').value = this.currentCompany.hq || '';
        document.getElementById('settings-foundation-date').value = this.formatDateForInput(this.currentCompany.foundationDate);
        document.getElementById('settings-company-description').value = this.currentCompany.description || '';
    }

    async handleSettingsSubmit(event) {
        event.preventDefault();

        if (!this.currentCompany || !this.isOwnProfile) {
            alert('You can only edit your own company profile');
            return;
        }

        const submitButton = event.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        try {
            // Disable submit button and show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

            // Collect form data
            const formData = {
                companyName: document.getElementById('settings-company-name').value.trim(),
                email: document.getElementById('settings-company-email').value.trim(),
                industry: document.getElementById('settings-company-industry').value,
                companySize: parseInt(document.getElementById('settings-company-size').value, 10),
                hq: document.getElementById('settings-company-hq').value.trim(),
                foundationDate: document.getElementById('settings-foundation-date').value,
                description: document.getElementById('settings-company-description').value.trim()
            };

            // Validate required fields
            if (!formData.companyName || !formData.email) {
                throw new Error('Company name and email are required');
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                throw new Error('Please enter a valid email address');
            }

            // Validate company size
            if (!formData.companySize || isNaN(formData.companySize) || formData.companySize < 1) {
                throw new Error('Please enter a valid company size (number of employees)');
            }

            // Update company via API
            if (window.apiClient && window.apiClient.updateCompany) {
                const response = await window.apiClient.updateCompany(this.currentCompany.id, formData);
                
                if (response && response.success) {
                    alert('✅ Company profile updated successfully!');
                    
                    // Update the current company data
                    this.currentCompany = { ...this.currentCompany, ...formData };
                    
                    // Update the profile display
                    this.displayCompanyProfile(this.currentCompany);
                    
                    // Refresh navbar profile
                    if (window.navbarProfileManager) {
                        window.navbarProfileManager.refreshNavbar();
                    }
                    
                    // Close the modal
                    closeModal('modal-settings');
                } else {
                    throw new Error(response?.message || 'Update failed');
                }
            } else {
                // Fallback: simulate update for demo
                setTimeout(() => {
                    alert('✅ Company profile updated successfully! (Demo mode)');
                    this.currentCompany = { ...this.currentCompany, ...formData };
                    this.displayCompanyProfile(this.currentCompany);
                    
                    // Refresh navbar profile
                    if (window.navbarProfileManager) {
                        window.navbarProfileManager.refreshNavbar();
                    }
                    
                    closeModal('modal-settings');
                }, 1000);
            }
            
        } catch (error) {
            console.error('Settings update error:', error);
            alert(`❌ Error updating company profile: ${error.message}`);
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 p-4 rounded-md text-white bg-red-500';
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
}

// Global modal functions - similar to profile.html
function openModal(id) {
    const modal = document.getElementById(id);
    const content = modal.querySelector('div');
    const main = document.getElementById('main-container');

    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-0', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
        if (main) main.classList.add('opacity-50');
    }, 10);

    // Close modal if clicked outside the box
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(id);
    };
}

function closeModal(id) {
    const modal = document.getElementById(id);
    const content = modal.querySelector('div');
    const main = document.getElementById('main-container');

    setTimeout(() => {
        content.classList.remove('scale-100');
        content.classList.add('scale-0');
        if (main) main.classList.remove('opacity-50');
    }, 10);
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be ready
    if (typeof window.apiClient === 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Initialize company profile manager
    window.companyProfileManager = new CompanyProfileManager();
});