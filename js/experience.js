// Experience management functionality
class ExperienceManager {
    constructor() {
        this.currentCandidateId = null;
        this.isEditing = false;
        this.currentExperienceId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserExperience();
    }

    setupEventListeners() {
        // Experience form submission
        const experienceForm = document.getElementById('experience-form');
        if (experienceForm) {
            experienceForm.addEventListener('submit', (e) => this.handleExperienceSubmit(e));
        }
    }

    async loadUserExperience() {
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
                await this.loadExperienceRecords();
            }
        } catch (error) {
            console.error('Error loading user experience:', error);
        }
    }

    async loadExperienceRecords() {
        try {
            if (!this.currentCandidateId) {
                console.log('No candidate ID available');
                return;
            }

            const response = await window.apiClient.getExperienceByCandidate(this.currentCandidateId);
            if (response && response.success) {
                this.displayExperienceRecords(response.experiences || []);
            }
        } catch (error) {
            console.error('Error loading experience records:', error);
            this.displayExperienceRecords([]);
        }
    }

    displayExperienceRecords(experiences) {
        const experienceList = document.getElementById('experience-list');
        if (!experienceList) return;

        if (experiences.length === 0) {
            experienceList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-briefcase text-4xl mb-4"></i>
                    <p>No experience records found. Click "Add Experience" to get started.</p>
                </div>
            `;
            return;
        }

        experienceList.innerHTML = experiences.map(experience => `
            <div class="bg-lilac-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-4">
                            ${experience.profileImageUrl ? 
                                `<img src="${experience.profileImageUrl}" alt="${experience.experienceName}" class="w-16 h-16 rounded-lg object-cover">` :
                                `<div class="w-16 h-16 rounded-lg bg-[#C69AE6] flex items-center justify-center">
                                    <i class="fas fa-briefcase text-white text-xl"></i>
                                 </div>`
                            }
                            <div>
                                <h4 class="text-lg font-semibold text-[#C69AE6]">${experience.experienceName}</h4>
                                <p class="text-gray-600 dark:text-gray-300">
                                    ${experience.startYear}${experience.endYear ? ` - ${experience.endYear}` : ' - Present'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="experienceManager.editExperience(${experience.id})" class="text-blue-600 hover:text-blue-800 p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="experienceManager.deleteExperience(${experience.id})" class="text-red-600 hover:text-red-800 p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleExperienceSubmit(event) {
        event.preventDefault();

        try {
            const formData = {
                experienceName: document.getElementById('experience-name').value.trim(),
                startYear: parseInt(document.getElementById('exp-start-year').value),
                endYear: document.getElementById('exp-end-year').value ? parseInt(document.getElementById('exp-end-year').value) : null,
                profileImageUrl: document.getElementById('profile-image-url').value.trim() || null,
                profileImagePath: null,
                imageUploadDate: null
            };

            // Debug logging
            console.log('Form elements check:');
            console.log('experience-name element:', document.getElementById('experience-name'));
            console.log('exp-start-year element:', document.getElementById('exp-start-year'));
            console.log('Form data:', formData);
            console.log('experienceName value:', formData.experienceName);
            console.log('startYear value:', formData.startYear);

            // Validate required fields
            if (!formData.experienceName || !formData.startYear) {
                throw new Error('Experience name and start year are required');
            }

            // Validate year range
            if (formData.endYear && formData.endYear < formData.startYear) {
                throw new Error('End year cannot be before start year');
            }

            let response;
            if (this.isEditing && this.currentExperienceId) {
                // Update existing experience
                if (!this.currentCandidateId) {
                    throw new Error('No candidate ID available for update');
                }
                response = await window.apiClient.updateExperience(this.currentExperienceId, formData, this.currentCandidateId);
            } else {
                // Create new experience
                if (!this.currentCandidateId) {
                    throw new Error('No candidate ID available. Please make sure you are logged in.');
                }
                response = await window.apiClient.createExperience(this.currentCandidateId, formData);
            }

            if (response && response.success) {
                alert(`✅ Experience ${this.isEditing ? 'updated' : 'created'} successfully!`);
                this.hideExperienceForm();
                await this.loadExperienceRecords();
            } else {
                throw new Error(response?.message || 'Operation failed');
            }

        } catch (error) {
            console.error('Error saving experience:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }

    async editExperience(experienceId) {
        try {
            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available');
            }

            const response = await window.apiClient.getExperienceById(experienceId, this.currentCandidateId);
            if (response && response.success && response.experience) {
                const experience = response.experience;
                
                // Fill the form with experience data
                document.getElementById('experience-id').value = experience.id;
                document.getElementById('experience-name').value = experience.experienceName;
                document.getElementById('exp-start-year').value = experience.startYear;
                document.getElementById('exp-end-year').value = experience.endYear || '';
                document.getElementById('profile-image-url').value = experience.profileImageUrl || '';

                // Set editing mode
                this.isEditing = true;
                this.currentExperienceId = experienceId;
                
                // Update form title and button text
                document.getElementById('experience-form-title').textContent = 'Edit Experience';
                document.getElementById('submit-btn-text').textContent = 'Update Experience';
                
                // Show the form
                this.showAddExperienceForm();
            }
        } catch (error) {
            console.error('Error loading experience for edit:', error);
            alert('❌ Error loading experience data');
        }
    }

    async deleteExperience(experienceId) {
        if (!confirm('Are you sure you want to delete this experience record?')) {
            return;
        }

        try {
            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available');
            }

            const response = await window.apiClient.deleteExperience(experienceId, this.currentCandidateId);
            if (response && response.success) {
                alert('✅ Experience deleted successfully!');
                await this.loadExperienceRecords();
            } else {
                throw new Error(response?.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting experience:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }

    showAddExperienceForm() {
        const formContainer = document.getElementById('experience-form-container');
        const form = document.getElementById('experience-form');
        
        if (formContainer && form) {
            formContainer.classList.remove('hidden');
            
            // Reset form if not editing
            if (!this.isEditing) {
                form.reset();
                document.getElementById('experience-id').value = '';
                document.getElementById('experience-form-title').textContent = 'Add Experience';
                document.getElementById('submit-btn-text').textContent = 'Save Experience';
            }
        }
    }

    hideExperienceForm() {
        const formContainer = document.getElementById('experience-form-container');
        const form = document.getElementById('experience-form');
        
        if (formContainer && form) {
            formContainer.classList.add('hidden');
            form.reset();
            
            // Reset editing state
            this.isEditing = false;
            this.currentExperienceId = null;
            document.getElementById('experience-id').value = '';
            document.getElementById('experience-form-title').textContent = 'Add Experience';
            document.getElementById('submit-btn-text').textContent = 'Save Experience';
        }
    }
}

// Global functions for HTML onclick handlers
function showAddExperienceForm() {
    if (window.experienceManager) {
        window.experienceManager.showAddExperienceForm();
    }
}

function hideExperienceForm() {
    if (window.experienceManager) {
        window.experienceManager.hideExperienceForm();
    }
}

// Initialize experience manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.experienceManager = new ExperienceManager();
});