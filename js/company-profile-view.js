// Company Profile View Script - For viewing other companies' profiles

class CompanyProfileViewer {
    constructor() {
        this.currentCompany = null;
        this.companyId = null;
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
        this.updateElement('company-foundation-date', this.formatDate(company.foundationDate));
        this.updateElement('company-hq', company.hq || 'Not specified');
        this.updateElement('company-email', company.email);
        
        // Add formatted location display
        this.updateElement('company-location', formatLocation(company.city, company.province));
        
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

        // Load additional data
        this.loadCompanyServices();
        this.loadCompanyMembers();
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

    async loadCompanyServices() {
        const servicesList = document.getElementById('services-list');
        if (!servicesList) return;

        try {
            // Mock data for now - replace with actual API call when available
            const services = [
                'Software Development',
                'Cloud Services',
                'Digital Transformation',
                'Technical Consulting',
                'Support & Maintenance'
            ];

            if (services.length === 0) {
                servicesList.innerHTML = `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-briefcase text-4xl mb-4"></i>
                        <p>No services listed</p>
                    </div>
                `;
                return;
            }

            servicesList.innerHTML = `
                <ul class="list-disc list-inside text-black dark:text-white space-y-2">
                    ${services.map(service => `<li>${service}</li>`).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('Error loading company services:', error);
            servicesList.innerHTML = `
                <div class="text-center py-8 text-red-500 dark:text-red-400">
                    <p>Failed to load services</p>
                </div>
            `;
        }
    }

    async loadCompanyMembers() {
        const membersList = document.getElementById('members-list');
        if (!membersList) return;

        try {
            // Mock data for now - replace with actual API call when available
            const members = [
                { name: 'Alex Johnson', position: 'Chief Executive Officer', image: 'img/default-profile.png' },
                { name: 'Sarah Davis', position: 'Chief Technology Officer', image: 'img/default-profile.png' },
                { name: 'Michael Chen', position: 'Lead Developer', image: 'img/default-profile.png' },
                { name: 'Emma Wilson', position: 'HR Manager', image: 'img/default-profile.png' }
            ];

            if (members.length === 0) {
                membersList.innerHTML = `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <i class="fas fa-users text-4xl mb-4"></i>
                        <p>No team members listed</p>
                    </div>
                `;
                return;
            }

            membersList.innerHTML = members.map(member => `
                <div class="flex flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img class="rounded-full w-16 h-16 object-cover" 
                         src="${member.image}" 
                         alt="${member.name}"
                         onerror="this.src='img/default-profile.png'">
                    <div class="ml-4">
                        <h4 class="text-lg font-semibold text-[#C69AE6]">${member.name}</h4>
                        <p class="text-gray-600 dark:text-gray-300">${member.position}</p>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading company members:', error);
            membersList.innerHTML = `
                <div class="text-center py-8 text-red-500 dark:text-red-400">
                    <p>Failed to load team members</p>
                </div>
            `;
        }
    }

    showError(message) {
        document.getElementById('company-name-header').textContent = 'Error';
        document.getElementById('company-industry').textContent = message;
        
        // Show error in other elements
        const elements = ['company-name', 'company-foundation-date', 'company-hq', 'company-size', 'company-email'];
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