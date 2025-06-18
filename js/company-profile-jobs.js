// Company Jobs Manager Class
class CompanyJobsManager {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.companyId = null;
        this.jobs = [];
    }

    async init() {
        this.setupEventListeners();
        
        // Try to get company ID from current company data
        if (window.currentCompany?.id) {
            this.setCompanyId(window.currentCompany.id);
        }
    }

    setupEventListeners() {
        // Pagination event listeners
        document.getElementById('jobs-prev-btn')?.addEventListener('click', () => {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.loadCompanyJobs();
            }
        });

        document.getElementById('jobs-next-btn')?.addEventListener('click', () => {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.loadCompanyJobs();
            }
        });
    }

    async loadCompanyJobs() {
        if (!this.companyId) {
            console.log('Company ID not available yet');
            return;
        }

        try {
            this.showLoading();

            const response = await fetch(`http://localhost:8080/api/jobs/company/${this.companyId}?page=${this.currentPage}&size=${this.pageSize}`);
            const data = await response.json();

            console.log('Jobs API response:', data);

            if (data.success && data.jobs) {
                this.jobs = data.jobs;
                this.totalPages = data.totalPages || Math.ceil(data.jobs.length / this.pageSize);
                this.displayJobs();
                this.updatePagination(data);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading company jobs:', error);
            this.showEmptyState();
        }
    }

    showLoading() {
        document.getElementById('jobs-loading')?.classList.remove('hidden');
        document.getElementById('jobs-table-container')?.classList.add('hidden');
        document.getElementById('jobs-empty-state')?.classList.add('hidden');
        document.getElementById('jobs-pagination')?.classList.add('hidden');
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

        document.getElementById('jobs-loading')?.classList.add('hidden');
        document.getElementById('jobs-table-container')?.classList.remove('hidden');
        document.getElementById('jobs-empty-state')?.classList.add('hidden');

        const tableBody = document.getElementById('jobs-table-body');
        if (tableBody) {
            tableBody.innerHTML = this.jobs.map(job => this.createJobRow(job)).join('');
        }
    }

    createJobRow(job) {
        const jobType = this.formatJobType(job.type);
        const location = this.formatLocation(job.city, job.province);
        const salary = this.formatSalary(job.salaryMin, job.salaryMax);
        const postedDate = this.formatDate(job.createdAt);
        const status = this.getJobStatus(job);
        const applicationCount = job.applicationCount || 0;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900 dark:text-white">${job.title}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">Posted ${postedDate}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200">
                        ${jobType}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                    ${location}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">
                    ${salary}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        ${applicationCount} applicant${applicationCount !== 1 ? 's' : ''}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${status}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                        <button onclick="viewJobDetails(${job.id})" class="text-lilac-600 dark:text-lilac-400 hover:text-lilac-900 dark:hover:text-lilac-300" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editJob(${job.id})" class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300" title="Edit Job">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button onclick="deleteJob(${job.id}, '${job.title}')" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300" title="Delete Job">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    formatJobType(type) {
        const typeMap = {
            'fulltime': 'Full-time',
            'parttime': 'Part-time',
            'contract': 'Contract',
            'internship': 'Internship',
            'freelance': 'Freelance',
            'remote': 'Remote',
            'hybrid': 'Hybrid'
        };
        return typeMap[type] || type;
    }

    formatLocation(city, province) {
        if (city && province) {
            const formattedProvince = province.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${city}, ${formattedProvince}`;
        }
        return city || province || 'Not specified';
    }

    formatSalary(salaryMin, salaryMax) {
        if (!salaryMin && !salaryMax) return 'Not specified';
        
        const formatAmount = (amount) => {
            if (amount >= 1000000) {
                return `${(amount / 1000000).toFixed(0)}M`;
            } else if (amount >= 1000) {
                return `${(amount / 1000).toFixed(0)}K`;
            }
            return amount.toString();
        };

        if (salaryMin && salaryMax) {
            return `IDR ${formatAmount(salaryMin)}-${formatAmount(salaryMax)}`;
        } else if (salaryMin) {
            return `IDR ${formatAmount(salaryMin)}+`;
        } else {
            return `Up to IDR ${formatAmount(salaryMax)}`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Unknown';
            }
            
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffTime / (1000 * 60));

            if (diffMinutes < 60) {
                return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`;
            } else if (diffHours < 24) {
                return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
            } else if (diffDays === 1) {
                return 'yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
            } else if (diffDays < 365) {
                const months = Math.floor(diffDays / 30);
                return `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
                const years = Math.floor(diffDays / 365);
                return `${years} year${years > 1 ? 's' : ''} ago`;
            }
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Unknown';
        }
    }

    getJobStatus(job) {
        const status = job.status || 'ACTIVE';
        
        const statusConfig = {
            'ACTIVE': { class: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', text: 'Active' },
            'DRAFT': { class: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200', text: 'Draft' },
            'CLOSED': { class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', text: 'Closed' },
            'PAUSED': { class: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', text: 'Paused' }
        };

        const config = statusConfig[status] || statusConfig['ACTIVE'];
        return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}">${config.text}</span>`;
    }

    updatePagination(data) {
        const totalItems = data.totalElements || this.jobs.length;
        const startIndex = this.currentPage * this.pageSize + 1;
        const endIndex = Math.min((this.currentPage + 1) * this.pageSize, totalItems);

        const showingStart = document.getElementById('jobs-showing-start');
        const showingEnd = document.getElementById('jobs-showing-end');
        const totalElement = document.getElementById('jobs-total');

        if (showingStart) showingStart.textContent = startIndex;
        if (showingEnd) showingEnd.textContent = endIndex;
        if (totalElement) totalElement.textContent = totalItems;

        // Update pagination buttons
        const prevBtn = document.getElementById('jobs-prev-btn');
        const nextBtn = document.getElementById('jobs-next-btn');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages - 1;
        }

        // Show pagination if there are jobs
        if (this.jobs.length > 0) {
            document.getElementById('jobs-pagination')?.classList.remove('hidden');
        }
    }

    setCompanyId(companyId) {
        console.log('Setting company ID for jobs:', companyId);
        this.companyId = companyId;
        this.loadCompanyJobs();
    }
}

// Job action functions
function viewJobDetails(jobId) {
    window.location.href = `job-detail.html?id=${jobId}`;
}

function editJob(jobId) {
    window.location.href = `posting_oprec.html?edit=${jobId}`;
}

async function deleteJob(jobId, jobTitle) {
    if (!confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const user = window.apiClient?.getCurrentUser();
        if (!user?.id) {
            alert('Authentication required. Please log in again.');
            return;
        }

        const response = await fetch(`http://localhost:8080/api/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id.toString()
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Job deleted successfully!');
            // Reload the jobs list
            if (window.companyJobsManager) {
                window.companyJobsManager.loadCompanyJobs();
            }
        } else {
            throw new Error(data.message || 'Failed to delete job');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        alert('Error deleting job: ' + error.message);
    }
}

// Enhanced initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM Content Loaded (Company Profile) ===');
    
    // Initialize jobs manager
    window.companyJobsManager = new CompanyJobsManager();
    window.companyJobsManager.init();
    
    // Wait for API client and company data to be ready
    const initializeCompanyData = () => {
        if (typeof window.apiClient === 'undefined') {
            console.log('Initializing API client...');
            window.apiClient = new ApiClient();
        }
        
        // Try to get company data from existing scripts
        if (window.currentCompany?.id) {
            console.log('Company data already available:', window.currentCompany);
            window.companyJobsManager.setCompanyId(window.currentCompany.id);
        } else {
            // Listen for company data loaded event
            window.addEventListener('companyDataLoaded', (event) => {
                console.log('Company data loaded event received:', event.detail);
                if (event.detail?.company?.id) {
                    window.companyJobsManager.setCompanyId(event.detail.company.id);
                }
            });
            
            // Also check periodically for company data
            const checkCompanyData = setInterval(() => {
                if (window.currentCompany?.id) {
                    console.log('Company data found via polling:', window.currentCompany);
                    window.companyJobsManager.setCompanyId(window.currentCompany.id);
                    clearInterval(checkCompanyData);
                }
            }, 500);
            
            // Stop checking after 10 seconds
            setTimeout(() => {
                clearInterval(checkCompanyData);
            }, 10000);
        }
    };
    
    // Initialize after a short delay to ensure other scripts are loaded
    setTimeout(initializeCompanyData, 100);
});

// Initialize first tab as active
switchTab('overview');