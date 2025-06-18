// Company Profile View Script - For viewing other companies' profiles

class CompanyProfileViewer {
    constructor() {
        this.currentCompany = null;
        this.companyId = null;
        this.employeesManager = null;
        this.init();
    }

    async init() {
        try {
            // Get company ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            this.companyId = urlParams.get('id');

            if (!this.companyId) {
                this.showError('No company ID provided in URL');
                return;
            }

            await this.loadCompanyProfile();
            this.initializeEmployeesManager();
        } catch (error) {
            console.error('Failed to initialize company profile viewer:', error);
            this.showError('Failed to load company profile');
        }
    }

    async loadCompanyProfile() {
        try {
            // Load current user's navbar profile first
            if (window.navbarProfileManager) {
                await window.navbarProfileManager.loadCurrentUserProfile();
            }

            // Load specific company profile by ID
            const response = await window.apiClient.getCompanyById(this.companyId);

            if (response && response.success && response.company) {
                this.currentCompany = response.company;
                window.currentViewedCompany = response.company; // Make available globally for chat
                this.displayCompanyProfile(response.company);
            } else {
                throw new Error('Company profile not found');
            }
        } catch (error) {
            console.error('Error loading company profile:', error);
            this.showError('Company profile not found.');
        }
    }

    displayCompanyProfile(company) {
        // Format province name helper
        const formatProvinceName = (province) => {
            if (!province) return '';
            return province
                .split('-')
                .map(word => {
                    if (word === 'dki') return 'DKI';
                    if (word === 'di') return 'DI';
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');
        };

        // Format location for display
        const formatLocation = (city, province) => {
            const formattedProvince = formatProvinceName(province);
            if (city && formattedProvince) {
                return `${city}, ${formattedProvince}`;
            } else if (city) {
                return city;
            } else if (formattedProvince) {
                return formattedProvince;
            }
            return 'Not specified';
        };

        // Update company name and basic info
        this.updateElement('company-name', company.companyName);
        this.updateElement('company-name-header', company.companyName);
        this.updateElement('company-industry', company.industry);
        this.updateElement('company-size', company.companySize ? `${company.companySize} Employees` : 'Not specified');
        this.updateElement('company-size2', company.companySize ? `${company.companySize} employees` : 'Not specified');
        this.updateElement('company-foundation-date', this.formatDate(company.foundationDate));
        this.updateElement('company-hq', company.hq || 'Not specified');
        this.updateElement('company-email', company.email);
        
        // Add formatted location display
        this.updateElement('company-location', formatLocation(company.city, company.province));
        
        // Update website with proper link
        const websiteElement = document.getElementById('company-website');
        if (websiteElement) {
            if (company.websiteUrl) {
                websiteElement.href = company.websiteUrl.startsWith('http') ? company.websiteUrl : `https://${company.websiteUrl}`;
                websiteElement.textContent = company.websiteUrl;
                websiteElement.target = '_blank';
            } else {
                websiteElement.href = '#';
                websiteElement.textContent = 'Not specified';
                websiteElement.onclick = (e) => e.preventDefault();
            }
        }
        
        // Update company description
        const descriptionElement = document.getElementById('company-description');
        if (descriptionElement) {
            if (company.description && company.description.trim()) {
                descriptionElement.textContent = company.description;
            } else {
                descriptionElement.innerHTML = `
                    <span class="text-gray-400 dark:text-gray-500 italic">
                        <i class="fas fa-info-circle mr-2"></i>
                        No company description available
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
        if (element) {
            element.textContent = value || 'Not specified';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Not specified';
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

    initializeEmployeesManager() {
        // Make sure company data is available globally
        window.currentCompanyData = this.currentCompany;
        
        // Initialize employees manager with company data
        if (typeof CompanyEmployeesViewManager !== 'undefined' && this.currentCompany) {
            this.employeesManager = new CompanyEmployeesViewManager(this.currentCompany.id);
            window.companyEmployeesViewManager = this.employeesManager;
            console.log('Employees view manager initialized with company data');
        }
    }

    showError(message) {
        document.getElementById('company-name').textContent = 'Error';
        document.getElementById('company-industry').textContent = message;
        
        // Show error in other elements
        const elements = ['company-foundation-date', 'company-hq', 'company-size', 'company-email'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Error loading data';
            }
        });

        const descriptionElement = document.getElementById('company-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = `
                <span class="text-red-500 dark:text-red-400">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    ${message}
                </span>
            `;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for API client to be ready
    if (typeof window.apiClient === 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Initialize company profile viewer
    setTimeout(() => {
        window.companyProfileViewer = new CompanyProfileViewer();
    }, 100);
});