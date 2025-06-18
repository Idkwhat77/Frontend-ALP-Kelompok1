// This file is responsible for loading all candidates from the API
let allCandidates = []; // Store all candidates globally
let filteredCandidates = []; // Store filtered candidates
let currentPage = 1;
const itemsPerPage = 12;

async function loadFilterCandidates() {
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
            allCandidates = response.candidates; // Store all candidates
            filteredCandidates = [...allCandidates]; // Initialize filtered candidates
            displayCandidateCards(getCurrentPageCandidates()); // Display first page
            updateCandidateCount(getCurrentPageCandidates().length, filteredCandidates.length);
            updatePagination();
            initializeFilterEvents(); // Initialize filter event listeners
        } else {
            throw new Error('No candidates data received');
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        displayErrorState();
    }
}

function getCurrentPageCandidates() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCandidates.slice(startIndex, endIndex);
}

function initializeFilterEvents() {
    // Search functionality
    const searchInput = document.querySelector('#candidate-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
            }
        });
    }

    // Search button
    const searchButton = document.querySelector('.bg-lilac-400');
    if (searchButton && searchButton.querySelector('.fa-search')) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    // Filter dropdowns
    const filterSelects = ['#province', '#city', '#job-type', '#industry'];
    filterSelects.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });

    // Filter buttons
    const applyButton = document.querySelector('button[data-i18n="button.apply_filters"]');
    const resetButton = document.querySelector('button[data-i18n="button.reset"]');

    if (applyButton) {
        applyButton.addEventListener('click', applyFilters);
    }

    if (resetButton) {
        resetButton.addEventListener('click', resetFilters);
    }

    console.log('Filter events initialized');
}

function applyFilters() {
    if (!allCandidates || allCandidates.length === 0) {
        console.log('No candidates data available for filtering');
        return;
    }

    const filters = getFilterValues();
    console.log('Applying filters:', filters);
    
    filteredCandidates = allCandidates.filter(candidate => {
        return matchesSearchCriteria(candidate, filters);
    });

    console.log(`Filtered ${filteredCandidates.length} candidates from ${allCandidates.length} total`);

    currentPage = 1; // Reset to first page
    displayCandidateCards(getCurrentPageCandidates());
    updateCandidateCount(getCurrentPageCandidates().length, filteredCandidates.length);
    updatePagination();
    showFilterMessage(filters);
}

function getFilterValues() {
    const searchInput = document.querySelector('#candidate-search');
    
    return {
        search: searchInput ? searchInput.value.toLowerCase().trim() : '',
        province: document.querySelector('#province')?.value || '',
        city: document.querySelector('#city')?.value || '',
        jobType: document.querySelector('#job-type')?.value || '',
        industry: document.querySelector('#industry')?.value || ''
    };
}

function matchesSearchCriteria(candidate, filters) {
    // Search filter (name, email, industry, job type, city, biodata)
    if (filters.search) {
        const searchableText = [
            candidate.fullName,
            candidate.email,
            candidate.industry,
            candidate.jobType,
            candidate.city,
            candidate.province,
            candidate.biodata,
            candidate.employmentStatus
        ].filter(Boolean).join(' ').toLowerCase();

        const searchTerms = filters.search.split(' ').filter(term => term.length > 0);
        const matchesAllTerms = searchTerms.every(term => 
            searchableText.includes(term)
        );
        
        if (!matchesAllTerms) {
            return false;
        }
    }

    // Province filter
    if (filters.province) {
        const candidateProvince = candidate.province?.toLowerCase() || '';
        if (!candidateProvince.includes(filters.province.toLowerCase())) {
            return false;
        }
    }

    // City filter
    if (filters.city) {
        const candidateCity = candidate.city?.toLowerCase() || '';
        if (!candidateCity.includes(filters.city.toLowerCase())) {
            return false;
        }
    }

    // Job Type filter
    if (filters.jobType) {
        const candidateJobType = candidate.jobType?.toLowerCase() || '';
        if (!candidateJobType.includes(filters.jobType.toLowerCase())) {
            return false;
        }
    }

    // Industry filter
    if (filters.industry) {
        const candidateIndustry = candidate.industry?.toLowerCase() || '';
        if (!candidateIndustry.includes(filters.industry.toLowerCase())) {
            return false;
        }
    }

    return true;
}

function showFilterMessage(filters) {
    // Remove existing message
    const existingMessage = document.querySelector('.search-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Add search results message if there's an active search
    if (filters.search || filters.province || filters.city || filters.jobType || filters.industry) {
        const candidatesSection = document.querySelector('#candidates-container').parentElement;
        const message = document.createElement('div');
        message.className = 'search-results-message bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4';
        
        let messageText = '';
        if (filters.search) {
            messageText += `Search: "${filters.search}"`;
        }
        if (filters.province) {
            messageText += messageText ? ` | Province: ${filters.province}` : `Province: ${filters.province}`;
        }
        if (filters.city) {
            messageText += messageText ? ` | City: ${filters.city}` : `City: ${filters.city}`;
        }
        if (filters.jobType) {
            messageText += messageText ? ` | Job Type: ${filters.jobType}` : `Job Type: ${filters.jobType}`;
        }
        if (filters.industry) {
            messageText += messageText ? ` | Industry: ${filters.industry}` : `Industry: ${filters.industry}`;
        }
        
        const activeFiltersText = window.currentLanguage === 'id' ? 'Filter aktif' : 'Active filters';
        const clearAllText = window.currentLanguage === 'id' ? 'Hapus semua' : 'Clear all';
        
        message.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-blue-800 dark:text-blue-200 text-sm">
                    <i class="fas fa-filter mr-2"></i>${activeFiltersText}: ${messageText}
                </span>
                <button onclick="resetFilters()" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm">
                    <i class="fas fa-times mr-1"></i>${clearAllText}
                </button>
            </div>
        `;
        
        candidatesSection.insertBefore(message, candidatesSection.firstChild);
    }
}

function resetFilters() {
    // Clear search input
    const searchInput = document.querySelector('#candidate-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // Reset all select elements
    const selects = ['#province', '#city', '#job-type', '#industry'];
    selects.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.value = '';
        }
    });

    // Remove search results message
    const messageContainer = document.querySelector('.search-results-message');
    if (messageContainer) {
        messageContainer.remove();
    }

    // Show all candidates
    filteredCandidates = [...allCandidates];
    currentPage = 1;
    displayCandidateCards(getCurrentPageCandidates());
    updateCandidateCount(getCurrentPageCandidates().length, filteredCandidates.length);
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    const paginationContainer = document.querySelector('nav[aria-label="Pagination"]');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }

    paginationContainer.style.display = 'flex';
    renderPaginationControls(totalPages, paginationContainer);
}

function renderPaginationControls(totalPages, container) {
    // Generate pagination HTML
    let paginationHTML = `
        <button class="pagination-btn pagination-prev relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <span class="sr-only">Previous</span>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // Add page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
        paginationHTML += createPageButton(1);
        if (startPage > 2) {
            paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-400">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += createPageButton(i);
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-400">...</span>`;
        }
        paginationHTML += createPageButton(totalPages);
    }

    // Next button
    paginationHTML += `
        <button class="pagination-btn pagination-next relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                ${currentPage === totalPages ? 'disabled' : ''}>
            <span class="sr-only">Next</span>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHTML;

    // Add event listeners
    addPaginationEventListeners(totalPages);
}

function createPageButton(pageNumber) {
    const isActive = pageNumber === currentPage;
    return `
        <button class="pagination-btn page-number ${isActive ? 'z-10 bg-lilac-400 border-lilac-400 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'} relative inline-flex items-center px-4 py-2 border text-sm font-medium" 
                data-page="${pageNumber}">
            ${pageNumber}
        </button>
    `;
}

function addPaginationEventListeners(totalPages) {
    // Previous button
    const prevBtn = document.querySelector('.pagination-prev');
    if (prevBtn && !prevBtn.disabled) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayCandidateCards(getCurrentPageCandidates());
                updateCandidateCount(getCurrentPageCandidates().length, filteredCandidates.length);
                updatePagination();
            }
        });
    }

    // Next button
    const nextBtn = document.querySelector('.pagination-next');
    if (nextBtn && !nextBtn.disabled) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayCandidateCards(getCurrentPageCandidates());
                updateCandidateCount(getCurrentPageCandidates().length, filteredCandidates.length);
                updatePagination();
            }
        });
    }

    // Page number buttons
    const pageButtons = document.querySelectorAll('.page-number');
    pageButtons.forEach(button => {
        button.addEventListener('click', () => {
            const page = parseInt(button.dataset.page);
            if (page !== currentPage) {
                currentPage = page;
                displayCandidateCards(getCurrentPageCandidates());
                updateCandidateCount(getCurrentPageCandidates().length, filteredCandidates.length);
                updatePagination();
            }
        });
    });
}

function displayCandidateCards(candidates) {
    const candidatesContainer = document.querySelector('#candidates-container');
    
    if (candidates.length === 0) {
        candidatesContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-users text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p class="text-gray-500 dark:text-gray-400 text-lg">No candidates found matching your criteria.</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or search terms.</p>
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
            <div class="p-4">
                <div class="flex items-start mb-3">
                    <img class="h-14 w-14 rounded-full object-cover mr-3" 
                         src="${candidate.profileImageUrl ? `http://localhost:8080${candidate.profileImageUrl}` : 'img/default-profile.png'}" 
                         alt="${candidate.fullName || 'Unknown'}"
                         onerror="this.src='img/default-profile.png'">
                    <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">${candidate.fullName || 'Unknown'}</h3>
                        <p class="text-gray-500 dark:text-gray-300 text-xs">${candidate.jobType || 'Professional'}</p>
                        <div class="flex items-center mt-1">
                            <i class="fas fa-map-marker-alt text-xs text-gray-400 dark:text-gray-500 mr-1"></i>
                            <span class="text-gray-500 dark:text-gray-400 text-xs">${formatLocation(candidate.city, candidate.province)}</span>
                        </div>
                    </div>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-2">
                    ${candidate.biodata || 'Professional with experience in their field, ready for new opportunities.'}
                </p>
                <div class="flex flex-wrap gap-1 mb-3">
                    <span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${candidate.industry || 'General'}</span>
                    <span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${candidate.jobType || 'Professional'}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">${candidate.employmentStatus || 'Available'}</span>
                    <button onclick="viewCandidateProfile(${candidate.id})" 
                            data-i18n="view_profile" 
                            class="px-3 py-1 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md transition-colors">
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

function updateCandidateCount(showing, total) {
    const countElement = document.getElementById('showing-candidates');
    if (countElement) {
        countElement.innerHTML = `
            <span data-i18n="candidates.showing">Showing</span> 
            <span class="font-medium text-lilac-500 dark:text-lilac-400">${showing}</span> 
            <span data-i18n="candidates.of">of</span> 
            <span class="font-medium">${total}</span> 
            <span data-i18n="candidates.found">candidates</span>
        `;
    }
}

function displayErrorState() {
    const candidatesContainer = document.querySelector('#candidates-container');
    candidatesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <p class="text-red-500 dark:text-red-400 mb-2">Failed to load candidates</p>
            <button onclick="loadFilterCandidates()" 
                    class="px-4 py-2 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md">
                <i class="fas fa-redo mr-2"></i>Retry
            </button>
        </div>
    `;
}

// Utility function to debounce search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load API client first
    if (typeof window.apiClient === 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Load candidates after a short delay to ensure API client is ready
    setTimeout(() => {
        console.log('Loading candidates...');
        loadFilterCandidates();
    }, 100);
});