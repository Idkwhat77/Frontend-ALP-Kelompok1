// Company Jobs View Manager Class - For viewing other companies' jobs
class CompanyJobsViewManager {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.companyId = null;
        this.jobs = [];
        this.init();
    }

    async init() {
        console.log('=== Initializing Company Jobs View Manager ===');
        this.setupEventListeners();
        
        // Wait for company data to be available
        const initializeData = () => {
            if (window.currentViewedCompany?.id) {
                this.setCompanyId(window.currentViewedCompany.id);
            } else if (window.companyProfileViewer?.currentCompany?.id) {
                this.setCompanyId(window.companyProfileViewer.currentCompany.id);
            } else {
                setTimeout(initializeData, 100);
            }
        };
        
        initializeData();
    }

    setupEventListeners() {
        // Tab switch listener
        const jobsTab = document.getElementById('jobs-tab');
        if (jobsTab) {
            jobsTab.addEventListener('click', () => {
                if (this.companyId) {
                    this.loadCompanyJobs();
                }
            });
        }
    }

    setCompanyId(companyId) {
        console.log('Setting company ID for jobs view:', companyId);
        this.companyId = companyId;
        
        // Auto-load if jobs tab is visible
        const jobsContent = document.getElementById('jobs-content');
        if (jobsContent && !jobsContent.classList.contains('hidden')) {
            this.loadCompanyJobs();
        }
    }

    async loadCompanyJobs() {
        if (!this.companyId) return;

        this.showLoading();
        
        try {
            const response = await window.apiClient.getCompanyJobs(this.companyId, this.currentPage, this.pageSize);
            
            if (response && response.success) {
                this.jobs = response.jobs || [];
                this.totalPages = response.totalPages || 0;
                
                this.displayJobs();
                this.updatePagination(response.currentPage, response.totalPages, response.totalElements);
            } else {
                throw new Error('Failed to load jobs');
            }
        } catch (error) {
            console.error('Error loading company jobs:', error);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('jobs-loading')?.classList.remove('hidden');
        document.getElementById('jobs-table-container')?.classList.add('hidden');
        document.getElementById('jobs-empty-state')?.classList.add('hidden');
        document.getElementById('jobs-pagination')?.classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('jobs-loading')?.classList.add('hidden');
    }

    showEmptyState() {
        document.getElementById('jobs-loading')?.classList.add('hidden');
        document.getElementById('jobs-table-container')?.classList.add('hidden');
        document.getElementById('jobs-empty-state')?.classList.remove('hidden');
        document.getElementById('jobs-pagination')?.classList.add('hidden');
    }

    displayJobs() {
        if (!this.jobs || this.jobs.length === 0) {
            this.showEmptyState();
            return;
        }

        document.getElementById('jobs-table-container')?.classList.remove('hidden');
        document.getElementById('jobs-empty-state')?.classList.add('hidden');

        const tableBody = document.getElementById('jobs-table-body');
        if (tableBody) {
            tableBody.innerHTML = this.jobs.map(job => this.createJobRow(job)).join('');
        }
    }

    createJobRow(job) {
        const formatJobType = (type) => {
            if (!type) return 'Not specified';
            return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        };

        const formatSalary = (min, max) => {
            if (!min && !max) return 'Not disclosed';
            if (min && max) return `Rp ${min?.toLocaleString()} - ${max?.toLocaleString()}`;
            if (min) return `From Rp ${min?.toLocaleString()}`;
            if (max) return `Up to Rp ${max?.toLocaleString()}`;
            return 'Not disclosed';
        };

        const formatDate = (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch {
                return 'Unknown';
            }
        };

        const formatLocation = (city, province) => {
            if (city && province) return `${city}, ${province}`;
            if (city) return city;
            if (province) return province;
            return 'Remote/Flexible';
        };

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${job.title || 'Untitled Position'}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">${job.department || 'General'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ${formatJobType(job.type)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${formatLocation(job.city, job.province)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${formatSalary(job.salaryMin, job.salaryMax)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${formatDate(job.createdAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="viewJobDetails(${job.id})" class="text-lilac-600 dark:text-lilac-400 hover:text-lilac-900 dark:hover:text-lilac-300" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    updatePagination(currentPage, totalPages, totalElements) {
        const pagination = document.getElementById('jobs-pagination');
        const prevBtn = document.getElementById('jobs-prev-btn');
        const nextBtn = document.getElementById('jobs-next-btn');
        const showingStart = document.getElementById('jobs-showing-start');
        const showingEnd = document.getElementById('jobs-showing-end');
        const totalJobsSpan = document.getElementById('jobs-total');

        if (totalElements === 0) {
            pagination?.classList.add('hidden');
            return;
        }

        pagination?.classList.remove('hidden');

        const start = currentPage * this.pageSize + 1;
        const end = Math.min((currentPage + 1) * this.pageSize, totalElements);

        if (showingStart) showingStart.textContent = start;
        if (showingEnd) showingEnd.textContent = end;
        if (totalJobsSpan) totalJobsSpan.textContent = totalElements;

        if (prevBtn) {
            prevBtn.disabled = currentPage === 0;
            prevBtn.onclick = () => this.previousPage();
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages - 1;
            nextBtn.onclick = () => this.nextPage();
        }
    }

    async previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            await this.loadCompanyJobs();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            await this.loadCompanyJobs();
        }
    }
}

// Job action functions
function viewJobDetails(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Initializing Company Jobs View Manager ===');
    window.companyJobsViewManager = new CompanyJobsViewManager();
});