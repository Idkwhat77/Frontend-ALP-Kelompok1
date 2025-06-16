class CandidateFilter {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filteredCandidates = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search input - Updated to work with multiple selectors
        const searchInput = document.querySelector('#candidate-search') || 
                           document.querySelector('input[placeholder*="Search"]') ||
                           document.querySelector('input[placeholder*="search"]');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.applyFilters();
            }, 300));
            
            // Also listen for Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyFilters();
                }
            });
        }

        // Search button click
        const searchButton = document.querySelector('#search-button');
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

        // Filter dropdowns - apply filters on change
        const filterSelects = ['#location', '#job-type', '#industry'];
        filterSelects.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    applyFilters() {
        if (!allCandidates || allCandidates.length === 0) {
            console.log('No candidates data available for filtering');
            return;
        }

        const filters = this.getFilterValues();
        console.log('Applying filters:', filters); // Debug log
        
        this.filteredCandidates = allCandidates.filter(candidate => {
            return this.matchesSearchCriteria(candidate, filters);
        });

        console.log(`Filtered ${this.filteredCandidates.length} candidates from ${allCandidates.length} total`); // Debug log

        this.currentPage = 1; // Reset to first page
        this.displayFilteredResults();
        this.updatePagination();
    }

    getFilterValues() {
        // Try multiple selectors for search input
        const searchInput = document.querySelector('#candidate-search') || 
                           document.querySelector('input[placeholder*="Search"]') ||
                           document.querySelector('input[placeholder*="search"]');
        
        return {
            search: searchInput ? searchInput.value.toLowerCase().trim() : '',
            location: document.querySelector('#location')?.value || '',
            jobType: document.querySelector('#job-type')?.value || '',
            industry: document.querySelector('#industry')?.value || ''
        };
    }

    matchesSearchCriteria(candidate, filters) {
        // Search filter (name, email, industry, job type, city, biodata)
        if (filters.search) {
            const searchableText = [
                candidate.fullName,
                candidate.email,
                candidate.industry,
                candidate.jobType,
                candidate.city,
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

        // Location filter
        if (filters.location) {
            const candidateLocation = candidate.city?.toLowerCase() || '';
            if (filters.location === 'remote') {
                // Check if candidate accepts remote work
                if (!candidateLocation.includes('remote')) {
                    return false;
                }
            } else {
                if (!candidateLocation.includes(filters.location.toLowerCase())) {
                    return false;
                }
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

    displayFilteredResults() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const candidatesToShow = this.filteredCandidates.slice(startIndex, endIndex);

        displayCandidateCards(candidatesToShow);
        updateCandidateCount(candidatesToShow.length, this.filteredCandidates.length);
        
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
        if (filters.search || filters.location || filters.jobType || filters.industry) {
            const candidatesSection = document.querySelector('#candidates-container').parentElement;
            const message = document.createElement('div');
            message.className = 'search-results-message bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4';
            
            let messageText = '';
            if (filters.search) {
                messageText += `Search: "${filters.search}"`;
            }
            if (filters.location) {
                messageText += messageText ? ` | Location: ${filters.location}` : `Location: ${filters.location}`;
            }
            if (filters.jobType) {
                messageText += messageText ? ` | Job Type: ${filters.jobType}` : `Job Type: ${filters.jobType}`;
            }
            if (filters.industry) {
                messageText += messageText ? ` | Industry: ${filters.industry}` : `Industry: ${filters.industry}`;
            }
            
            message.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-blue-800 dark:text-blue-200 text-sm">
                        <i class="fas fa-filter mr-2"></i>Active filters: ${messageText}
                    </span>
                    <button onclick="candidateFilter.resetFilters()" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm">
                        <i class="fas fa-times mr-1"></i>Clear all
                    </button>
                </div>
            `;
            
            candidatesSection.insertBefore(message, candidatesSection.firstChild);
        }
    }

    resetFilters() {
        // Clear search input - try multiple selectors
        const searchInput = document.querySelector('#candidate-search') || 
                           document.querySelector('input[placeholder*="Search"]') ||
                           document.querySelector('input[placeholder*="search"]');
        if (searchInput) {
            searchInput.value = '';
        }

        // Reset all select elements
        const selects = ['#location', '#job-type', '#industry'];
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
        this.filteredCandidates = [...allCandidates];
        this.currentPage = 1;
        this.displayFilteredResults();
        this.updatePagination();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredCandidates.length / this.itemsPerPage);
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

        // Adjust start page if we're near the end
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

        // Add event listeners
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

    // Utility function to debounce search input
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

// Initialize the filter system when candidates are loaded
let candidateFilter;

// Override the original loadFilterCandidates to initialize filters after loading
const originalLoadFunction = window.loadFilterCandidates;
window.loadFilterCandidates = async function() {
    await originalLoadFunction();
    
    // Initialize the filter system after candidates are loaded
    if (allCandidates && allCandidates.length > 0) {
        candidateFilter = new CandidateFilter();
        candidateFilter.filteredCandidates = [...allCandidates];
        candidateFilter.updatePagination();
        console.log('CandidateFilter initialized with', allCandidates.length, 'candidates');
    }
};