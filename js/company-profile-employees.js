// Company employees management for company profile

class CompanyEmployeesManager {
    constructor(companyId) {
        this.companyId = companyId;
        this.currentPage = 1;
        this.pageSize = 5;
        this.allCandidates = [];
        this.init();
    }

    async init() {
        await this.loadEmployees();
        await this.loadAllCandidates();
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

    async loadAllCandidates() {
        try {
            const response = await window.apiClient.getAllCandidates();
            if (response && response.success && response.candidates) {
                // Filter out candidates who are already employees of this company
                const employees = await this.getCurrentEmployees();
                const employeeIds = employees.map(emp => emp.id);
                this.allCandidates = response.candidates.filter(candidate => !employeeIds.includes(candidate.id));
            }
        } catch (error) {
            console.error('Error loading candidates:', error);
            this.allCandidates = [];
        }
    }

    async getCurrentEmployees() {
        try {
            const response = await window.apiClient.getCompanyEmployees(this.companyId);
            return response && response.success ? response.employees : [];
        } catch (error) {
            console.error('Error getting current employees:', error);
            return [];
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
                    <button onclick="viewEmployeeProfile(${employee.id})" class="p-1 text-gray-400 hover:text-lilac-500 transition-colors">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="companyEmployeesManager.removeEmployee(${employee.id})" class="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <i class="fas fa-times"></i>
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
        const addEmployeeBtn = document.getElementById('add-employee-btn');

        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                this.showAllEmployeesModal();
            });
        }

        if (addEmployeeBtn) {
            addEmployeeBtn.addEventListener('click', () => {
                this.showAddEmployeeModal();
            });
        }
    }

    showAddEmployeeModal() {
        // Create modal HTML with employee details form
        const modalHTML = `
            <div id="add-employee-modal" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-[90%] max-w-3xl max-h-[90%] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Add Employee</h3>
                        <button onclick="this.closest('#add-employee-modal').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <input type="text" id="candidate-search-input" placeholder="Search candidates by name, email, or industry..." class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lilac-500">
                    </div>
                    
                    <div id="candidates-list" class="space-y-2 max-h-64 overflow-y-auto mb-4">
                        <!-- Candidates will be loaded here -->
                    </div>
                    
                    <div id="employee-details-form" class="hidden">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee Details</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position *</label>
                                <input type="text" id="employee-position" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lilac-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                <input type="text" id="employee-department" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lilac-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
                                <input type="text" id="employee-id" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lilac-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hire Date</label>
                                <input type="date" id="employee-hire-date" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lilac-500">
                            </div>
                        </div>
                        
                        <div class="mt-6 flex justify-end space-x-3">
                            <button onclick="this.closest('#add-employee-modal').remove()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                                Cancel
                            </button>
                            <button onclick="companyEmployeesManager.submitEmployeeForm()" class="px-4 py-2 bg-lilac-500 hover:bg-lilac-600 text-white rounded-lg">
                                Add Employee
                            </button>
                        </div>
                    </div>
                    
                    <div id="modal-bottom-buttons" class="mt-4 flex justify-end">
                        <button onclick="this.closest('#add-employee-modal').remove()" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Load candidates
        this.displayCandidatesInModal(this.allCandidates);

        // Setup search
        const searchInput = document.getElementById('candidate-search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredCandidates = this.allCandidates.filter(candidate => 
                candidate.fullName?.toLowerCase().includes(query) ||
                candidate.email?.toLowerCase().includes(query) ||
                candidate.industry?.toLowerCase().includes(query) ||
                candidate.jobType?.toLowerCase().includes(query)
            );
            this.displayCandidatesInModal(filteredCandidates);
        });
    }

    displayCandidatesInModal(candidates) {
        const candidatesList = document.getElementById('candidates-list');
        if (!candidatesList) return;

        if (candidates.length === 0) {
            candidatesList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-users text-2xl mb-2"></i>
                    <p>No candidates found</p>
                </div>
            `;
            return;
        }

        candidatesList.innerHTML = candidates.map(candidate => `
            <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div class="h-10 w-10 rounded-full bg-cover bg-center bg-no-repeat flex-shrink-0" 
                     style="background-image: url('${candidate.profileImageUrl ? `http://localhost:8080${candidate.profileImageUrl}` : 'img/default-profile.png'}');">
                </div>
                <div class="ml-3 flex-1">
                    <h4 class="font-medium text-gray-900 dark:text-white">${candidate.fullName || 'Unknown'}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-300">${candidate.industry || candidate.jobType || 'Professional'}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${candidate.email || ''}</p>
                    ${candidate.city ? `<p class="text-xs text-gray-500 dark:text-gray-400">${candidate.city}, ${candidate.province || ''}</p>` : ''}
                </div>
                <button onclick="companyEmployeesManager.selectCandidate(${candidate.id}, '${candidate.fullName}')" 
                        class="px-3 py-1 bg-lilac-500 hover:bg-lilac-600 text-white text-sm rounded-md transition-colors">
                    <i class="fas fa-plus mr-1"></i>Select
                </button>
            </div>
        `).join('');
    }

    selectCandidate(candidateId, candidateName) {
        this.selectedCandidateId = candidateId;
        
        // Hide candidate list and show form
        document.getElementById('candidates-list').classList.add('hidden');
        document.getElementById('candidate-search-input').value = candidateName;
        document.getElementById('candidate-search-input').disabled = true;
        document.getElementById('employee-details-form').classList.remove('hidden');
        document.getElementById('modal-bottom-buttons').classList.add('hidden');
        
        // Set default hire date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('employee-hire-date').value = today;
        
        // Add button to change selection
        const searchContainer = document.getElementById('candidate-search-input').parentElement;
        if (!document.getElementById('change-selection-btn')) {
            searchContainer.insertAdjacentHTML('afterend', `
                <div class="mb-4">
                    <button id="change-selection-btn" onclick="companyEmployeesManager.resetCandidateSelection()" 
                            class="text-sm text-lilac-500 hover:text-lilac-600">
                        <i class="fas fa-arrow-left mr-1"></i>Change Selection
                    </button>
                </div>
            `);
        }
    }

    resetCandidateSelection() {
        this.selectedCandidateId = null;
        
        // Reset form
        document.getElementById('employee-position').value = '';
        document.getElementById('employee-department').value = '';
        document.getElementById('employee-id').value = '';
        document.getElementById('employee-hire-date').value = '';
        
        // Show candidate list and hide form
        document.getElementById('candidates-list').classList.remove('hidden');
        document.getElementById('candidate-search-input').value = '';
        document.getElementById('candidate-search-input').disabled = false;
        document.getElementById('employee-details-form').classList.add('hidden');
        document.getElementById('modal-bottom-buttons').classList.remove('hidden');
        
        // Remove change selection button
        document.getElementById('change-selection-btn')?.parentElement.remove();
        
        // Reload candidates
        this.displayCandidatesInModal(this.allCandidates);
    }    async submitEmployeeForm() {
        if (!this.selectedCandidateId) {
            this.showMessage('Please select a candidate first', 'error');
            return;
        }

        const position = document.getElementById('employee-position').value.trim();
        if (!position) {
            this.showMessage('Position is required', 'error');
            return;
        }

        const employeeData = {
            candidateId: this.selectedCandidateId,
            position: position,
            department: document.getElementById('employee-department').value.trim() || null,
            employeeId: document.getElementById('employee-id').value.trim() || null,
            hireDate: document.getElementById('employee-hire-date').value || null
        };

        try {
            const response = await window.apiClient.addEmployeeToCompany(this.companyId, employeeData);
            
            if (response && response.success) {
                // Close modal
                document.getElementById('add-employee-modal')?.remove();
                
                // Reload employees and candidates
                await this.loadEmployees();
                await this.loadAllCandidates();
                
                // Show success message
                this.showMessage('Employee added successfully!', 'success');
            } else {
                const errorMessage = response?.message || 'Failed to add employee';
                console.error('Add employee failed:', response);
                this.showMessage('Error adding employee: ' + errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error adding employee:', error);
            let errorMessage = 'Failed to add employee';
            
            // Handle specific validation errors
            if (error.message.includes('Department is required')) {
                errorMessage = 'Department is required. Please fill in the department field.';
            } else if (error.message.includes('Position is required')) {
                errorMessage = 'Position is required. Please fill in the position field.';
            } else if (error.message.includes('AlreadyEmployed')) {
                errorMessage = 'This candidate is already employed by another company.';
            } else if (error.message.includes('CandidateNotFound')) {
                errorMessage = 'Candidate not found. Please select a valid candidate.';
            } else if (error.message.includes('Forbidden')) {
                errorMessage = 'You do not have permission to add employees to this company.';
            } else {
                errorMessage = error.message || 'An unexpected error occurred';
            }
            
            this.showMessage(errorMessage, 'error');
        }
    }

    async removeEmployee(candidateId) {
        if (!confirm('Are you sure you want to remove this employee? This will remove their employment relationship with the company.')) {
            return;
        }

        try {
            const response = await window.apiClient.removeEmployeeFromCompany(this.companyId, candidateId);
            
            if (response && response.success) {
                // Reload employees and candidates
                await this.loadEmployees();
                await this.loadAllCandidates();
                this.showMessage('Employee removed successfully!', 'success');
            } else {
                throw new Error(response?.message || 'Failed to remove employee');
            }
        } catch (error) {
            console.error('Error removing employee:', error);
            this.showMessage('Error removing employee: ' + error.message, 'error');
        }
    }

    showAllEmployeesModal() {
        // This method can be implemented to show all employees in a separate modal
        // For now, we'll just redirect or expand the current view
        console.log('Show all employees modal - to be implemented');
    }

    showMessage(message, type = 'success') {
        // Remove any existing messages
        document.querySelectorAll('.fixed.top-4.right-4.z-50').forEach(el => el.remove());
        
        const messageHTML = `
            <div class="fixed top-4 right-4 z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded-lg shadow-lg">
                <div class="flex items-center">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
                    ${message}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', messageHTML);
        
        setTimeout(() => {
            document.querySelector('.fixed.top-4.right-4.z-50')?.remove();
        }, 3000);
    }
}

// Global function to view employee profile
function viewEmployeeProfile(employeeId) {
    window.location.href = `employee_profile.html?id=${employeeId}`;
}

// Export for use in other scripts
window.CompanyEmployeesManager = CompanyEmployeesManager;