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
            <div class="bg-lilac-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-4">
                            ${education.profileImageUrl ? 
                                `<img src="${education.profileImageUrl}" alt="${education.institutionName}" class="w-16 h-16 rounded-lg object-cover">` :
                                `<div class="w-16 h-16 rounded-lg bg-[#C69AE6] flex items-center justify-center">
                                    <i class="fas fa-graduation-cap text-white text-xl"></i>
                                 </div>`
                            }
                            <div>
                                <h4 class="text-lg font-semibold text-[#C69AE6]">${education.institutionName}</h4>
                                <p class="text-gray-600 dark:text-gray-300">
                                    ${education.startYear}${education.endYear ? ` - ${education.endYear}` : ' - Present'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="educationManager.editEducation(${education.id})" class="text-blue-600 hover:text-blue-800 p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="educationManager.deleteEducation(${education.id})" class="text-red-600 hover:text-red-800 p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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
                alert(`✅ Education ${this.isEditing ? 'updated' : 'created'} successfully!`);
                this.hideEducationForm();
                await this.loadEducationRecords();
            } else {
                throw new Error(response?.message || 'Operation failed');
            }

        } catch (error) {
            console.error('Error saving education:', error);
            alert(`❌ Error: ${error.message}`);
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
                
                // Show the form
                this.showAddEducationForm();
            }
        } catch (error) {
            console.error('Error loading education for edit:', error);
            alert('❌ Error loading education data');
        }
    }

    async deleteEducation(educationId) {
        if (!confirm('Are you sure you want to delete this education record?')) {
            return;
        }

        try {
            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available');
            }

            const response = await window.apiClient.deleteEducation(educationId, this.currentCandidateId);
            if (response && response.success) {
                alert('✅ Education deleted successfully!');
                await this.loadEducationRecords();
            } else {
                throw new Error(response?.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting education:', error);
            alert(`❌ Error: ${error.message}`);
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
            formContainer.classList.add('hidden');
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