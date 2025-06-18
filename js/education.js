// Education management functionality
class EducationManager {
    constructor() {
        this.currentCandidateId = null;
        this.isEditing = false;
        this.currentEducationId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserEducation();
    }

    setupEventListeners() {
        // Education form submission
        const educationForm = document.getElementById('education-form');
        if (educationForm) {
            educationForm.addEventListener('submit', (e) => this.handleEducationSubmit(e));
        }
    }

    async loadUserEducation() {
        try {
            // Get current user and candidate data
            const user = window.apiClient.getCurrentUser();
            if (!user) {
                console.log('No user found');
                return;
            }

            // Get candidate data by user ID
            const candidateResponse = await window.apiClient.getCandidateByUserId(user.id);
            if (candidateResponse && candidateResponse.success && candidateResponse.candidate) {
                this.currentCandidateId = candidateResponse.candidate.id;
                await this.loadEducationRecords();
            }
        } catch (error) {
            console.error('Error loading user education:', error);
        }
    }

    async loadEducationRecords() {
        try {
            if (!this.currentCandidateId) {
                console.log('No candidate ID available');
                return;
            }

            const response = await window.apiClient.getEducationByCandidate(this.currentCandidateId);
            if (response && response.success) {
                this.displayEducationRecords(response.educations || []);
            }
        } catch (error) {
            console.error('Error loading education records:', error);
            this.displayEducationRecords([]);
        }
    }

    async showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${iconClass} mr-2" aria-label="${type}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    displayEducationRecords(educations) {
        const educationList = document.getElementById('education-list');
        if (!educationList) return;

        if (educations.length === 0) {
            educationList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-graduation-cap text-4xl mb-4"></i>
                    <p>No education records found. Click "Add Education" to get started.</p>
                </div>
            `;
            return;
        }

        educationList.innerHTML = educations.map(education => `
        <div class="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
            <div class="mr-4">
                <div class="h-12 w-12 rounded-lg bg-lilac-100 dark:bg-gray-600 flex items-center justify-center">
                    ${education.profileImageUrl ? 
                        `<img src="${education.profileImageUrl}" alt="${education.institutionName}" class="h-12 w-12 rounded-lg object-cover">` :
                        `<i class="fas fa-graduation-cap text-lilac-500 text-xl"></i>`
                    }
                </div>
            </div>
            <div class="flex-1">
                <h3 class="font-semibold text-gray-900 dark:text-white">${education.institutionName}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                    ${education.startYear}${education.endYear ? ` - ${education.endYear}` : ' - Present'}
                </p>
                ${education.degree ? `<p class="text-sm text-gray-500 dark:text-gray-400">${education.degree}</p>` : ''}
            </div>
            <div class="ml-4 flex space-x-2">
                <button onclick="window.educationManager.editEducation(${education.id})" class="text-gray-400 hover:text-lilac-500 transition-colors duration-200" title="Edit Education">
                    <i class="fas fa-pen"></i>
                </button>
                <button onclick="window.educationManager.deleteEducation(${education.id})" class="text-gray-400 hover:text-red-500 transition-colors duration-200" title="Delete Education">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `).join('');
    }

    async handleEducationSubmit(event) {
        event.preventDefault();

        try {
            const formData = {
                institutionName: document.getElementById('institution-name').value.trim(),
                startYear: parseInt(document.getElementById('start-year').value),
                endYear: document.getElementById('end-year').value ? parseInt(document.getElementById('end-year').value) : null,
                profileImageUrl: document.getElementById('profile-image-url').value.trim() || null,
                profileImagePath: null,
                imageUploadDate: null
            };

            // Validate required fields
            if (!formData.institutionName || !formData.startYear) {
                throw new Error('Institution name and start year are required');
            }

            // Validate year range
            if (formData.endYear && formData.endYear < formData.startYear) {
                throw new Error('End year cannot be before start year');
            }

            let response;
            if (this.isEditing && this.currentEducationId) {
                // Update existing education
                if (!this.currentCandidateId) {
                    throw new Error('No candidate ID available for update');
                }
                response = await window.apiClient.updateEducation(this.currentEducationId, formData, this.currentCandidateId);
            } else {
                // Create new education
                if (!this.currentCandidateId) {
                    throw new Error('No candidate ID available. Please make sure you are logged in.');
                }
                response = await window.apiClient.createEducation(this.currentCandidateId, formData);
            }

            if (response && response.success) {
                await this.showNotification(`Education ${this.isEditing ? 'updated' : 'created'} successfully!`);
                this.hideEducationForm();
                await this.loadEducationRecords();
            } else {
                throw new Error(response?.message || 'Operation failed');
            }

        } catch (error) {
            console.error('Error saving education:', error);
            await this.showNotification(`Error saving education: ${error.message}`, 'error');
        }
    }

    async editEducation(educationId) {
        try {
            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available');
            }

            const response = await window.apiClient.getEducationById(educationId, this.currentCandidateId);
            if (response && response.success && response.education) {
                const education = response.education;
                
                // Fill the form with education data
                document.getElementById('education-id').value = education.id;
                document.getElementById('institution-name').value = education.institutionName;
                document.getElementById('start-year').value = education.startYear;
                document.getElementById('end-year').value = education.endYear || '';
                document.getElementById('profile-image-url').value = education.profileImageUrl || '';

                // Set editing mode
                this.isEditing = true;
                this.currentEducationId = educationId;
                
                // Update form title and button text
                document.getElementById('education-form-title').textContent = 'Edit Education';
                document.getElementById('submit-btn-text').textContent = 'Update Education';
                
                // FIXED: Use the correct method for profiledesign.html
                if (typeof openModal === 'function') {
                    // For profiledesign.html - use global openModal function
                    openModal('education-form-container');
                } else {
                    // For profile.html - use the local method
                    this.showAddEducationForm();
                }
            }
        } catch (error) {
            console.error('Error loading education for edit:', error);
            await this.showNotification('Error loading education data', 'error');
        }
    }

    async deleteEducation(educationId) {
        // Custom confirmation modal instead of alert box
        const confirmed = await new Promise((resolve) => {
            // Create modal elements
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';

            const modalBox = document.createElement('div');
            modalBox.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full';

            modalBox.innerHTML = `
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Delete Education</h3>
            <p class="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to delete this education record?</p>
            <div class="flex justify-end gap-2">
                <button id="cancel-delete-education" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                <button id="confirm-delete-education" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
            `;

            modalOverlay.appendChild(modalBox);
            document.body.appendChild(modalOverlay);

            // Event listeners
            document.getElementById('cancel-delete-education').onclick = () => {
            document.body.removeChild(modalOverlay);
            resolve(false);
            };
            document.getElementById('confirm-delete-education').onclick = () => {
            document.body.removeChild(modalOverlay);
            resolve(true);
            };
        });

        if (!confirmed) {
            return;
        }

        try {
            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available');
            }

            const response = await window.apiClient.deleteEducation(educationId, this.currentCandidateId);
            if (response && response.success) {
                await this.showNotification('Education deleted successfully!');
                await this.loadEducationRecords();
            } else {
                throw new Error(response?.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting education:', error);
            await this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    showAddEducationForm() {
        const formContainer = document.getElementById('education-form-container');
        const form = document.getElementById('education-form');
        
        if (formContainer && form) {
            formContainer.classList.remove('hidden');
            
            // Reset form if not editing
            if (!this.isEditing) {
                form.reset();
                document.getElementById('education-id').value = '';
                document.getElementById('education-form-title').textContent = 'Add Education';
                document.getElementById('submit-btn-text').textContent = 'Save Education';
            }
        }
    }

    hideEducationForm() {
        const formContainer = document.getElementById('education-form-container');
        const form = document.getElementById('education-form');
        
        if (formContainer && form) {
            form.reset();
            
            // Reset editing state
            this.isEditing = false;
            this.currentEducationId = null;
            document.getElementById('education-id').value = '';
            document.getElementById('education-form-title').textContent = 'Add Education';
            document.getElementById('submit-btn-text').textContent = 'Save Education';
        }
    }
}

// Global functions for HTML onclick handlers
function showAddEducationForm() {
    if (window.educationManager) {
        window.educationManager.showAddEducationForm();
    }
}

function hideEducationForm() {
    if (window.educationManager) {
        window.educationManager.hideEducationForm();
    }
}

// Initialize education manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.educationManager = new EducationManager();
});