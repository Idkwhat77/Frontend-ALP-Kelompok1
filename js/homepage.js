async function loadHomepageCandidates() {
    try {
        const loadingText = window.currentLanguage === 'id' ? 'Memuat...' : 'Loading...';
        
        // Show loading state
        const candidatesContainer = document.querySelector('#candidates-container');
        candidatesContainer.innerHTML = `
            <div class="col-span-full flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-lilac-400" aria-label="${loadingText}" data-i18n-aria="common.loading"></div>
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

    // Helper function to format province name
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

    // Helper function to format location
    const formatLocation = (city, province) => {
        const formattedProvince = formatProvinceName(province);
        if (city && formattedProvince) {
            return `${formattedProvince}, ${city}`;
        } else if (city) {
            return city;
        } else if (formattedProvince) {
            return formattedProvince;
        }
        return 'Location not specified';
    };

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
                    <p class="text-gray-500 dark:text-gray-300 mb-1">${candidate.jobType || 'Professional'}</p>
                    <div class="flex items-center justify-center mb-2">
                        <i class="fas fa-map-marker-alt text-xs text-gray-400 dark:text-gray-500 mr-1"></i>
                        <span class="text-gray-500 dark:text-gray-400 text-xs">${formatLocation(candidate.city, candidate.province)}</span>
                    </div>
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

function renderGlobalSearchResults(results) {
    const container = document.getElementById('global-search-results');
    container.innerHTML = '';
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-8">Tidak ada hasil ditemukan.</div>';
        return;
    }

    container.innerHTML = `
        <div class="flex gap-3 overflow-x-auto py-2 px-1">
            ${results.map(item => {
                const isCandidate = item.type === 'candidate';
                const name = isCandidate ? (item.fullName || 'Unknown') : (item.name || 'Unknown');
                // Ambil kota dari city untuk kandidat, location untuk company
                const location = isCandidate
                    ? (item.city || '-') 
                    : (item.location || item.hq || '-');
                const icon = isCandidate
                    ? '<i class="fas fa-user text-lilac-400 text-lg"></i>'
                    : '<i class="fas fa-building text-lilac-500 text-lg"></i>';
                const jenis = isCandidate ? 'Kandidat' : 'Perusahaan';
                const jenisColor = isCandidate
                    ? 'bg-lilac-100 text-lilac-700'
                    : 'bg-lilac-50 text-lilac-500';
                const id = item.id;
                return `
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow text-xs flex flex-col items-center min-w-[180px] max-w-[200px] p-3 cursor-pointer hover:ring-2 hover:ring-lilac-400 transition"
                        onclick="${isCandidate
                            ? `viewCandidateProfile('${id}')`
                            : `viewCompanyProfile('${id}')`
                        }">
                        <div class="mb-2">${icon}</div>
                        <div class="font-semibold text-gray-900 dark:text-white truncate w-full text-center">${name}</div>
                        <div class="text-[11px] text-gray-500 dark:text-gray-400 truncate w-full text-center mb-1">
                            <i class="fas fa-map-marker-alt mr-1"></i>${location}
                        </div>
                        <span class="mt-1 px-2 py-1 text-xs rounded-full ${jenisColor}">${jenis}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function viewCandidateProfile(candidateId) {
    if (candidateId) window.location.href = `employee_profile.html?id=${candidateId}`;
}
function viewCompanyProfile(companyId) {
    if (companyId) window.location.href = `company_profile_view.html?id=${companyId}`;
}

async function globalSearch(query) {
    try {
        const response = await fetch(`http://localhost:8080/api/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        renderGlobalSearchResults(data);
    } catch (err) {
        renderGlobalSearchResults([]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search-input');
    const searchBtn = document.getElementById('global-search-btn');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) globalSearch(query);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) globalSearch(query);
            }
        });
    }
});

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

async function loadHomepageJobs() {
    try {
        // Show loading state
        const oprecContainer = document.querySelector('#oprec-container');
        oprecContainer.innerHTML = `
            <div class="col-span-full flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-lilac-400"></div>
            </div>
        `;

        // Fetch jobs from API
        const response = await fetch('http://localhost:8080/api/jobs?limit=3');
        const data = await response.json();
        
        if (response.ok && data.success && data.jobs) {
            // Limit to first 3 jobs for homepage
            const jobs = data.jobs.slice(0, 3);
            displayJobCards(jobs);
        } else {
            throw new Error('No jobs data received');
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        displayJobErrorState();
    }
}

function displayJobCards(jobs) {
    const oprecContainer = document.querySelector('#oprec-container');
    
    if (!jobs || jobs.length === 0) {
        oprecContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-gray-400 mb-4">
                    <i class="fas fa-briefcase text-4xl"></i>
                </div>
                <p class="text-gray-500 dark:text-gray-400">No job openings available at the moment.</p>
            </div>
        `;
        return;
    }

    oprecContainer.innerHTML = jobs.map(job => {
        // Format location
        const location = formatJobLocation(job.city, job.province);
        
        // Format posted date
        const postedDate = formatRealDate(job.createdAt);
        
        // Get company logo
        const companyLogo = job.company?.profileImageUrl 
            ? `http://localhost:8080${job.company.profileImageUrl}` 
            : 'img/default-company.png';
        
        // Get company name
        const companyName = job.company?.name || job.company?.companyName || 'Company';
        
        // Format skills array
        const skillsArray = Array.isArray(job.skills) ? job.skills : 
            (typeof job.skills === 'string' ? job.skills.split(',').map(s => s.trim()) : []);
        
        // Format job type
        const jobTypeDisplay = formatJobType(job.type);

        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div class="p-5">
                    <div class="flex items-start mb-4">
                        <img class="h-12 w-12 rounded-full object-cover mr-4" 
                             src="${companyLogo}" 
                             alt="${companyName} Logo"
                             onerror="this.src='img/default-company.png'">
                        <div>
                            <h3 class="font-semibold text-gray-900 dark:text-white">${job.title || 'Job Title'}</h3>
                            <p class="text-lilac-500 text-sm">${companyName}</p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-4">
                        <span class="bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-300 px-3 py-1 rounded-full text-xs">${jobTypeDisplay}</span>
                        ${location ? `<span class="bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-300 px-3 py-1 rounded-full text-xs">${location}</span>` : ''}
                        ${skillsArray.slice(0, 1).map(skill => 
                            `<span class="bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-300 px-3 py-1 rounded-full text-xs">${skill}</span>`
                        ).join('')}
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                        ${job.description ? stripHtmlAndTruncate(job.description, 120) : 'No description available'}
                    </p>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500 dark:text-gray-400">${postedDate}</span>
                        <a href="job-detail.html?id=${job.id}" class="text-lilac-500 hover:text-lilac-600 font-medium">Apply Now</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayJobErrorState() {
    const oprecContainer = document.querySelector('#oprec-container');
    oprecContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <div class="text-gray-400 mb-4">
                <i class="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <p class="text-gray-500 dark:text-gray-400">Unable to load job openings. Please try again later.</p>
        </div>
    `;
}

// Helper functions (add these if they don't exist)
function formatJobLocation(city, province) {
    if (city && province) {
        return `${city}, ${province}`;
    } else if (city) {
        return city;
    } else if (province) {
        return province;
    }
    return 'Location TBD';
}

function formatJobType(type) {
    const typeMap = {
        'fulltime': 'Full-time',
        'parttime': 'Part-time',
        'contract': 'Contract',
        'internship': 'Internship',
        'freelance': 'Freelance',
        'remote': 'Remote',
        'hybrid': 'Hybrid',
        'temporary': 'Temporary'
    };
    return typeMap[type] || type || 'Full-time';
}

function formatRealDate(dateString) {
    if (!dateString) return 'Recently posted';
    
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Recently posted';
        }
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        
        if (diffMinutes < 60) {
            return diffMinutes <= 1 ? 'Just posted' : `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
            return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
        } else if (diffDays === 1) {
            return '1 day ago';
        } else if (diffDays <= 7) {
            return `${diffDays} days ago`;
        } else if (diffDays <= 30) {
            const weeks = Math.ceil(diffDays / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else {
            const months = Math.ceil(diffDays / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Recently posted';
    }
}

function stripHtmlAndTruncate(html, maxLength) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    
    if (text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength) + '...';
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

    setTimeout(() => {
        console.log('Loading homepage jobs...');
        loadHomepageJobs();
    }, 200);
});