// Company Employees View Manager Class - For viewing other companies' employees
class CompanyEmployeesViewManager {
    constructor(companyId) {
        this.companyId = companyId;
        this.pageSize = 5;
        this.employees = [];
        this.init();
    }

    async init() {
        console.log('=== Initializing Company Employees View Manager ===');
        await this.loadEmployees();
        this.setupEventListeners();
    }

    async loadEmployees() {
        const loadingElement = document.getElementById('employees-loading');
        const emptyElement = document.getElementById('employees-empty');
        const containerElement = document.getElementById('employees-container');

        try {
            loadingElement?.classList.remove('hidden');
            emptyElement?.classList.add('hidden');
            containerElement?.classList.add('hidden');

            const response = await window.apiClient.getCompanyEmployees(this.companyId);
            
            if (response && response.success && response.employees && response.employees.length > 0) {
                this.employees = response.employees;
                this.displayEmployees(response.employees);
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            this.showEmptyState();
        } finally {
            loadingElement?.classList.add('hidden');
        }
    }

    displayEmployees(employees) {
        const containerElement = document.getElementById('employees-container');
        const emptyElement = document.getElementById('employees-empty');

        if (!containerElement) return;

        const displayEmployees = employees.slice(0, this.pageSize);
        
        containerElement.innerHTML = displayEmployees.map(employee => `
            <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="h-12 w-12 rounded-full bg-cover bg-center bg-no-repeat flex-shrink-0" 
                     style="background-image: url('${employee.profileImageUrl ? `http://localhost:8080${employee.profileImageUrl}` : 'img/default-profile.png'}');">
                </div>
                <div class="ml-4 flex-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white">${employee.fullName || 'Unknown'}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">${employee.position || employee.industry || 'Employee'}</p>
                    ${employee.department ? `<p class="text-xs text-gray-500 dark:text-gray-400">${employee.department}</p>` : ''}
                    ${employee.employeeId ? `<p class="text-xs text-gray-500 dark:text-gray-400">ID: ${employee.employeeId}</p>` : ''}
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="viewEmployeeProfile(${employee.id})" class="p-1 text-gray-400 hover:text-lilac-500 transition-colors" title="View Profile">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');

        containerElement.classList.remove('hidden');
        emptyElement?.classList.add('hidden');

        this.updateViewAllButton(employees.length);
    }

    showEmptyState() {
        const containerElement = document.getElementById('employees-container');
        const emptyElement = document.getElementById('employees-empty');

        containerElement?.classList.add('hidden');
        emptyElement?.classList.remove('hidden');
    }

    updateViewAllButton(totalEmployees) {
        const viewAllBtn = document.getElementById('view-all-employees');
        if (viewAllBtn) {
            if (totalEmployees > this.pageSize) {
                viewAllBtn.textContent = `View All (${totalEmployees})`;
                viewAllBtn.style.display = 'block';
            } else {
                viewAllBtn.style.display = 'none';
            }
        }
    }

    setupEventListeners() {
        const viewAllBtn = document.getElementById('view-all-employees');

        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.showAllEmployeesModal();
            });
        }
    }

    showAllEmployeesModal() {
        if (!this.employees || this.employees.length === 0) return;

        const modalHTML = `
            <div id="all-employees-modal" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-[90%] max-w-4xl max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">All Team Members (${this.employees.length})</h3>
                        <button onclick="this.closest('#all-employees-modal').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${this.employees.map(employee => `
                            <div class="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <div class="h-12 w-12 rounded-full bg-cover bg-center bg-no-repeat flex-shrink-0" 
                                     style="background-image: url('${employee.profileImageUrl ? `http://localhost:8080${employee.profileImageUrl}` : 'img/default-profile.png'}');">
                                </div>
                                <div class="ml-4 flex-1">
                                    <h4 class="font-semibold text-gray-900 dark:text-white">${employee.fullName || 'Unknown'}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">${employee.position || employee.industry || 'Employee'}</p>
                                    ${employee.department ? `<p class="text-xs text-gray-500 dark:text-gray-400">${employee.department}</p>` : ''}
                                    ${employee.employeeId ? `<p class="text-xs text-gray-500 dark:text-gray-400">ID: ${employee.employeeId}</p>` : ''}
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button onclick="viewEmployeeProfile(${employee.id})" class="p-2 text-gray-400 hover:text-lilac-500 transition-colors" title="View Profile">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mt-6 flex justify-end">
                        <button onclick="this.closest('#all-employees-modal').remove()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Global function to view employee profile
function viewEmployeeProfile(employeeId) {
    window.location.href = `employee_profile.html?id=${employeeId}`;
}

// Export for use in other scripts
window.CompanyEmployeesViewManager = CompanyEmployeesViewManager;