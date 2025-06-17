// This file is responsible for loading and filtering companies
let allCompanies = []; // Store all companies globally

class CompanyFilter {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filteredCompanies = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search input
        const searchInput = document.querySelector('#company-search') || 
                           document.querySelector('input[placeholder*="company"]');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyFilters();
                }
            });
        }

        // Search button
        const searchButton = document.querySelector('.bg-lilac-400');
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }

        // Filter buttons
        const applyButton = document.querySelector('button[data-i18n="button.apply_filters"]');
        const resetButton = document.querySelector('button[data-i18n="button.reset"]');

        if (applyButton) {
            applyButton.addEventListener('click', () => this.applyFilters());
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetFilters());
        }

        // Province-City cascading filter
        const provinceSelect = document.querySelector('#province');
        const citySelect = document.querySelector('#city');

        if (provinceSelect && citySelect) {
            provinceSelect.addEventListener('change', () => {
                this.updateCityOptions();
                this.applyFilters();
            });
        }

        // Other filter dropdowns
        const filterSelects = ['#province', '#city', '#company-size', '#industry'];
        filterSelects.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    updateCityOptions() {
        const companyProvinceCityMap = {
            "aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam"],
            "sumatra-utara": ["Binjai", "Gunungsitoli", "Medan", "Padang Sidempuan", "Pematangsiantar", "Sibolga", "Tanjungbalai", "Tebing Tinggi"],
            "sumatra-barat": ["Bukittinggi", "Padang", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
            "riau": ["Pekanbaru", "Dumai"],
            "jambi": ["Jambi", "Sungai Penuh"],
            "sumatra-selatan": ["Palembang", "Pagar Alam", "Prabumulih", "Lubuklinggau"],
            "bengkulu": ["Bengkulu"],
            "lampung": ["Bandar Lampung", "Metro"],
            "kepulauan-bangka-belitung": ["Pangkal Pinang"],
            "kepulauan-riau": ["Batam", "Tanjung Pinang"],
            "dki-jakarta": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"],
            "jawa-barat": ["Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya"],
            "jawa-tengah": ["Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta", "Tegal"],
            "di-yogyakarta": ["Yogyakarta"],
            "jawa-timur": ["Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya"],
            "banten": ["Cilegon", "Serang", "Tangerang", "Tangerang Selatan"],
            "bali": ["Denpasar"],
            "nusa-tenggara-barat": ["Bima", "Mataram"],
            "nusa-tenggara-timur": ["Kupang"],
            "kalimantan-barat": ["Pontianak", "Singkawang"],
            "kalimantan-tengah": ["Palangka Raya"],
            "kalimantan-selatan": ["Banjarbaru", "Banjarmasin"],
            "kalimantan-timur": ["Balikpapan", "Bontang", "Samarinda"],
            "kalimantan-utara": ["Tarakan"],
            "sulawesi-utara": ["Bitung", "Kotamobagu", "Manado", "Tomohon"],
            "sulawesi-tengah": ["Palu"],
            "sulawesi-selatan": ["Makassar", "Palopo", "Parepare"],
            "sulawesi-tenggara": ["Bau-Bau", "Kendari"],
            "gorontalo": ["Gorontalo"],
            "sulawesi-barat": ["Mamuju"],
            "maluku": ["Ambon", "Tual"],
            "maluku-utara": ["Ternate", "Tidore Kepulauan"],
            "papua-barat": ["Manokwari", "Sorong"],
            "papua-barat-daya": ["Sorong"],
            "papua": ["Jayapura"],
            "papua-selatan": ["Merauke"],
            "papua-tengah": ["Mimika"],
            "papua-pegunungan": ["Jayawijaya"]
        };

        const provinceSelect = document.querySelector('#province');
        const citySelect = document.querySelector('#city');
        
        const selectedProvince = provinceSelect.value;
        const cities = companyProvinceCityMap[selectedProvince] || [];
        
        // Clear previous options
        citySelect.innerHTML = '<option value="" data-i18n="filter.all_cities">All Cities/Districts</option>';
        
        if (selectedProvince) {
            // Enable city select
            citySelect.disabled = false;
            
            // Add cities for selected province
            cities.forEach(city => {
                const option = document.createElement("option");
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        } else {
            // Disable city select if no province selected
            citySelect.disabled = true;
        }
    }

    applyFilters() {
        if (!allCompanies || allCompanies.length === 0) {
            console.log('No companies data available for filtering');
            return;
        }

        const filters = this.getFilterValues();
        console.log('Applying company filters:', filters);
        
        this.filteredCompanies = allCompanies.filter(company => {
            return this.matchesSearchCriteria(company, filters);
        });

        console.log(`Filtered ${this.filteredCompanies.length} companies from ${allCompanies.length} total`);

        this.currentPage = 1; // Reset to first page
        this.displayFilteredResults();
        this.updatePagination();
    }

    getFilterValues() {
        const searchInput = document.querySelector('#company-search') || 
                           document.querySelector('input[placeholder*="company"]');
        
        return {
            search: searchInput ? searchInput.value.toLowerCase().trim() : '',
            province: document.querySelector('#province')?.value || '',
            city: document.querySelector('#city')?.value || '',
            companySize: document.querySelector('#company-size')?.value || '',
            industry: document.querySelector('#industry')?.value || ''
        };
    }

    matchesSearchCriteria(company, filters) {
        // Search filter (company name, industry, location)
        if (filters.search) {
            const searchableText = [
                company.companyName,
                company.industry,
                company.hq,
                company.province,
                company.city,
                company.description
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
            const companyProvince = company.province?.toLowerCase() || '';
            if (!companyProvince.includes(filters.province.toLowerCase())) {
                return false;
            }
        }

        // City filter
        if (filters.city) {
            const companyCity = company.city?.toLowerCase() || '';
            if (!companyCity.includes(filters.city.toLowerCase())) {
                return false;
            }
        }

        // Company Size filter
        if (filters.companySize) {
            const companySize = company.companySize || 0;
            let sizeMatches = false;
            
            switch (filters.companySize) {
                case 'startup':
                    sizeMatches = companySize >= 1 && companySize <= 50;
                    break;
                case 'small':
                    sizeMatches = companySize >= 51 && companySize <= 200;
                    break;
                case 'medium':
                    sizeMatches = companySize >= 201 && companySize <= 1000;
                    break;
                case 'large':
                    sizeMatches = companySize >= 1001 && companySize <= 5000;
                    break;
                case 'enterprise':
                    sizeMatches = companySize > 5000;
                    break;
                default:
                    sizeMatches = true;
            }
            
            if (!sizeMatches) {
                return false;
            }
        }

        // Industry filter
        if (filters.industry) {
            const companyIndustry = company.industry?.toLowerCase() || '';
            if (!companyIndustry.includes(filters.industry.toLowerCase())) {
                return false;
            }
        }

        return true;
    }

    displayFilteredResults() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const companiesToShow = this.filteredCompanies.slice(startIndex, endIndex);

        displayCompanyCards(companiesToShow);
        updateCompanyCount(companiesToShow.length, this.filteredCompanies.length);
        
        // Show search results message
        this.showSearchResultsMessage();
    }

    showSearchResultsMessage() {
        const filters = this.getFilterValues();
        const messageContainer = document.querySelector('.search-results-message');
        
        // Remove existing message
        if (messageContainer) {
            messageContainer.remove();
        }

        // Add search results message if there's an active search
        if (filters.search || filters.province || filters.city || filters.companySize || filters.industry) {
            const companiesSection = document.querySelector('#companies-container').parentElement;
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
            if (filters.companySize) {
                messageText += messageText ? ` | Size: ${filters.companySize}` : `Size: ${filters.companySize}`;
            }
            if (filters.industry) {
                messageText += messageText ? ` | Industry: ${filters.industry}` : `Industry: ${filters.industry}`;
            }
            
            message.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-blue-800 dark:text-blue-200 text-sm">
                        <i class="fas fa-filter mr-2"></i>Active filters: ${messageText}
                    </span>
                    <button onclick="companyFilter.resetFilters()" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm">
                        <i class="fas fa-times mr-1"></i>Clear all
                    </button>
                </div>
            `;
            
            companiesSection.insertBefore(message, companiesSection.firstChild);
        }
    }

    resetFilters() {
        // Clear search input
        const searchInput = document.querySelector('#company-search') || 
                           document.querySelector('input[placeholder*="company"]');
        if (searchInput) {
            searchInput.value = '';
        }

        // Reset all select elements
        const selects = ['#province', '#city', '#company-size', '#industry'];
        selects.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.value = '';
                if (selector === '#city') {
                    element.disabled = true;
                }
            }
        });

        // Remove search results message
        const messageContainer = document.querySelector('.search-results-message');
        if (messageContainer) {
            messageContainer.remove();
        }

        // Show all companies
        this.filteredCompanies = [...allCompanies];
        this.currentPage = 1;
        this.displayFilteredResults();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredCompanies.length / this.itemsPerPage);
        const paginationContainer = document.querySelector('nav[aria-label="Pagination"]');
        
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) {
                paginationContainer.style.display = 'none';
            }
            return;
        }

        paginationContainer.style.display = 'flex';
        this.renderPaginationControls(totalPages);
    }

    renderPaginationControls(totalPages) {
        const paginationContainer = document.querySelector('nav[aria-label="Pagination"]');
        
        // Generate pagination HTML
        let paginationHTML = `
            <button class="pagination-btn pagination-prev relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <span class="sr-only">Previous</span>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Add page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            paginationHTML += this.createPageButton(1);
            if (startPage > 2) {
                paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-400">...</span>`;
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += this.createPageButton(i);
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-400">...</span>`;
            }
            paginationHTML += this.createPageButton(totalPages);
        }

        // Next button
        paginationHTML += `
            <button class="pagination-btn pagination-next relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <span class="sr-only">Next</span>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
        this.addPaginationEventListeners(totalPages);
    }

    createPageButton(pageNumber) {
        const isActive = pageNumber === this.currentPage;
        return `
            <button class="pagination-btn page-number ${isActive ? 'z-10 bg-lilac-400 border-lilac-400 text-white' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'} relative inline-flex items-center px-4 py-2 border text-sm font-medium" 
                    data-page="${pageNumber}">
                ${pageNumber}
            </button>
        `;
    }

    addPaginationEventListeners(totalPages) {
        // Previous button
        const prevBtn = document.querySelector('.pagination-prev');
        if (prevBtn && !prevBtn.disabled) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.displayFilteredResults();
                    this.updatePagination();
                }
            });
        }

        // Next button
        const nextBtn = document.querySelector('.pagination-next');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.displayFilteredResults();
                    this.updatePagination();
                }
            });
        }

        // Page number buttons
        const pageButtons = document.querySelectorAll('.page-number');
        pageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.dataset.page);
                if (page !== this.currentPage) {
                    this.currentPage = page;
                    this.displayFilteredResults();
                    this.updatePagination();
                }
            });
        });
    }

    debounce(func, wait) {
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
}

// Load and display functions
async function loadFilterCompanies() {
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
            allCompanies = response.companies.map(company => ({
                ...company,
                id: parseInt(company.id, 10)
            }));
            displayCompanyCards(allCompanies);
            updateCompanyCount(allCompanies.length, allCompanies.length);
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
                <i class="fas fa-building text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p class="text-gray-500 dark:text-gray-400 text-lg">No companies found matching your criteria.</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }

    companiesContainer.innerHTML = companies.map(company => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover-scale transition-transform duration-300 text-sm">
            <div class="h-24 bg-lilac-50 dark:bg-gray-700 flex items-center justify-center p-3">
                <img class="h-12 object-contain" 
                     src="${company.profileImageUrl ? `http://localhost:8080${company.profileImageUrl}` : 'img/default-profile.png'}" 
                     alt="${company.companyName} Logo"
                     onerror="this.src='img/default-profile.png'">
            </div>
            <div class="p-3">
                <h3 class="font-semibold text-gray-900 dark:text-white text-center mb-1">${company.companyName || 'Unknown Company'}</h3>
                <p class="text-gray-500 dark:text-gray-300 text-center mb-2">${company.industry || 'Various Industries'}</p>
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
    `).join('');
}

function viewCompanyProfile(companyId) {
    window.location.href = `company_profile_view.html?id=${companyId}`;
}

function updateCompanyCount(showing, total) {
    const countElement = document.getElementById('showing-companies');
    if (countElement) {
        countElement.innerHTML = `
            <span data-i18n="companies.showing">Showing</span> 
            <span class="font-medium text-lilac-500 dark:text-lilac-400">${showing}</span> 
            <span data-i18n="companies.of">of</span> 
            <span class="font-medium">${total}</span> 
            <span data-i18n="companies.found">companies</span>
        `;
    }
}

function displayCompanyErrorState() {
    const companiesContainer = document.querySelector('#companies-container');
    companiesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <p class="text-red-500 dark:text-red-400 mb-2">Failed to load companies</p>
            <button onclick="loadFilterCompanies()" 
                    class="px-4 py-2 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md">
                <i class="fas fa-redo mr-2"></i>Retry
            </button>
        </div>
    `;
}

// Initialize filter system
let companyFilter;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load API client first
    if (typeof window.apiClient === 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Load companies after a short delay to ensure API client is ready
    setTimeout(() => {
        console.log('Loading companies...');
        loadFilterCompanies().then(() => {
            // Initialize the filter system after companies are loaded
            if (allCompanies && allCompanies.length > 0) {
                companyFilter = new CompanyFilter();
                companyFilter.filteredCompanies = [...allCompanies];
                companyFilter.updatePagination();
                console.log('CompanyFilter initialized with', allCompanies.length, 'companies');
            }
        });
    }, 100);
});