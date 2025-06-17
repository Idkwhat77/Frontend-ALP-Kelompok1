async function loadHomepageCandidates() {
    try {
        // Show loading state
        const candidatesContainer = document.querySelector('#candidates-container');
        candidatesContainer.innerHTML = `
            <div class="col-span-full flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-lilac-400"></div>
            </div>
        `;

        // Fetch candidates from API
        const response = await window.apiClient.getAllCandidates();
        
        if (response && response.success && response.candidates) {
            // Limit to first 4 candidates for homepage
            const candidates = response.candidates.slice(0, 4);
            displayCandidateCards(candidates);
        } else {
            throw new Error('No candidates data received');
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        displayErrorState();
    }
}

function displayCandidateCards(candidates) {
    const candidatesContainer = document.querySelector('#candidates-container');
    
    if (candidates.length === 0) {
        candidatesContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">No candidates available at the moment.</p>
            </div>
        `;
        return;
    }

    candidatesContainer.innerHTML = candidates.map(candidate => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover-scale transition-transform duration-300 text-sm">
            <div class="p-3">
                <div class="flex justify-center mb-2">
                    <img class="h-16 w-16 rounded-full object-cover" 
                         src="${candidate.profileImageUrl ? `http://localhost:8080${candidate.profileImageUrl}` : 'img/default-profile.png'}" 
                         alt="${candidate.fullName}"
                         onerror="this.src='img/default-profile.png'">
                </div>
                <div class="text-center">
                    <h3 class="font-semibold text-gray-900 dark:text-white">${candidate.fullName || 'Unknown'}</h3>
                    <p class="text-gray-500 dark:text-gray-300 mb-2">${candidate.jobType || 'Professional'}</p>
                    <div class="flex justify-center space-x-1 mb-2">
                        ${generateSkillTags(candidate.industry)}
                    </div>
                    <button onclick="viewCandidateProfile(${candidate.id})" 
                            data-i18n-html="view_profile" 
                            class="mt-1 px-3 py-1 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md transition-colors w-full">
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function generateSkillTags(industry) {
    // Map industries to relevant skill tags
    const skillMap = {
        'Technology': ['JavaScript', 'React'],
        'Information Technology': ['JavaScript', 'React'],
        'Marketing': ['Digital', 'SEO'],
        'Design': ['Figma', 'UI'],
        'Finance': ['Excel', 'Analysis'],
        'Healthcare': ['Medical', 'Care'],
        'Education': ['Teaching', 'Training']
    };
    
    const skills = skillMap[industry] || ['Professional', 'Skilled'];
    
    return skills.map(skill => 
        `<span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${skill}</span>`
    ).join('');
}

function viewCandidateProfile(candidateId) {
    // Navigate to employee profile page with candidate ID
    window.location.href = `employee_profile.html?id=${candidateId}`;
}

function displayErrorState() {
    const candidatesContainer = document.querySelector('#candidates-container');
    candidatesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <p class="text-red-500 dark:text-red-400 mb-2">Failed to load candidates</p>
            <button onclick="loadHomepageCandidates()" 
                    class="px-4 py-2 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md">
                Retry
            </button>
        </div>
    `;
}

async function loadHomepageCompanies() {
    try {
        // Show loading state
        const companiesContainer = document.querySelector('#companies-container');
        companiesContainer.innerHTML = `
            <div class="col-span-full flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-lilac-400"></div>
            </div>
        `;

        // Fetch companies from API
        const response = await window.apiClient.getAllCompanies();
        
        if (response && response.success && response.companies) {
            // Limit to first 4 companies for homepage
            const companies = response.companies.slice(0, 4);
            displayCompanyCards(companies);
        } else {
            throw new Error('No companies data received');
        }
    } catch (error) {
        console.error('Error loading companies:', error);
        displayCompanyErrorState();
    }
}

function displayCompanyCards(companies) {
    const companiesContainer = document.querySelector('#companies-container');
    
    if (companies.length === 0) {
        companiesContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">No companies available at the moment.</p>
            </div>
        `;
        return;
    }

    companiesContainer.innerHTML = companies.map(company => {
        // Format province name
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

        // Format location string
        let locationText = '';
        const formattedProvince = formatProvinceName(company.province);
        
        if (company.city && formattedProvince) {
            locationText = `${company.city}, ${formattedProvince}`;
        } else if (company.city) {
            locationText = company.city;
        } else if (formattedProvince) {
            locationText = formattedProvince;
        } else if (company.hq) {
            locationText = company.hq;
        } else {
            locationText = 'Location not specified';
        }

        return `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover-scale transition-transform duration-300 text-sm">
                <div class="h-24 bg-lilac-50 dark:bg-gray-700 flex items-center justify-center p-3">
                    <img class="h-12 object-contain" 
                         src="${company.profileImageUrl ? `http://localhost:8080${company.profileImageUrl}` : 'img/default-profile.png'}" 
                         alt="${company.companyName} Logo"
                         onerror="this.src='img/default-profile.png'">
                </div>
                <div class="p-3">
                    <h3 class="font-semibold text-gray-900 dark:text-white text-center mb-1 line-clamp-1">${company.companyName || 'Unknown Company'}</h3>
                    <p class="text-gray-500 dark:text-gray-300 text-center mb-2 text-xs">${company.industry || 'Various Industries'}</p>
                    
                    <!-- Location Information -->
                    <div class="flex items-center justify-center mb-2">
                        <i class="fas fa-map-marker-alt text-xs text-gray-400 dark:text-gray-500 mr-1"></i>
                        <span class="text-gray-500 dark:text-gray-400 text-xs text-center line-clamp-1" title="${locationText}">${locationText}</span>
                    </div>
                    
                    <div class="flex justify-center mb-2">
                        <span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">
                            ${company.companySize ? `${company.companySize} employees` : 'Company'}
                        </span>
                    </div>
                    <button onclick="viewCompanyProfile(${company.id})" 
                            data-i18n-html="view_company" 
                            class="mt-1 px-3 py-1 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md transition-colors w-full">
                        View Company
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function viewCompanyProfile(companyId) {
    // Navigate to company profile page with company ID
    window.location.href = `company_profile_view.html?id=${companyId}`;
}

function displayCompanyErrorState() {
    const companiesContainer = document.querySelector('#companies-container');
    companiesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <p class="text-red-500 dark:text-red-400 mb-2">Failed to load companies</p>
            <button onclick="loadHomepageCompanies()" 
                    class="px-4 py-2 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md">
                Retry
            </button>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load API client first
    if (typeof window.apiClient === 'undefined') {
        // Initialize API client if not already done
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Load candidates and companies after a short delay to ensure API client is ready
    setTimeout(() => {
        console.log('Loading homepage candidates...');
        loadHomepageCandidates();
        
        console.log('Loading homepage companies...');
        loadHomepageCompanies();
    }, 100);
    
    const viewProfileLink = document.querySelector('a[href="profile.html"][data-i18n="view_profile"]');
    if (viewProfileLink) {
        viewProfileLink.addEventListener('click', function (e) {
            e.preventDefault();
            const userType = window.apiClient.getUserType();
            if (userType === 'employee') {
                window.location.href = 'profile.html';
            } else if (userType === 'company') {
                window.location.href = 'company_profile.html';
            } else {
                window.location.href = 'profile.html'; // fallback
            }
        });
    }
});