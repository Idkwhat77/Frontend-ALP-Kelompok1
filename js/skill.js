// Skills management functionality
class SkillsManager {
    constructor() {
        this.currentCandidateId = null;
        this.userSkills = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserSkills();
    }

    setupEventListeners() {
        // Skills form submission
        const skillForm = document.getElementById('skill-form');
        if (skillForm) {
            skillForm.addEventListener('submit', (e) => this.handleSkillSubmit(e));
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
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

    async loadUserSkills() {
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
                await this.loadSkills();
            }
        } catch (error) {
            console.error('Error loading user skills:', error);
        }
    }

    async loadSkills() {
        try {
            if (!this.currentCandidateId) {
                console.log('No candidate ID available');
                return;
            }

            const response = await window.apiClient.getCandidateSkills(this.currentCandidateId);
            if (response && response.success) {
                this.userSkills = response.skills || [];
                this.displaySkills(this.userSkills);
            }
        } catch (error) {
            console.error('Error loading skills:', error);
        }
    }

    displaySkills(skills) {
        const skillsList = document.getElementById('current-skills-list');
        if (!skillsList) return;

        if (skills.length === 0) {
            skillsList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-code text-4xl mb-4"></i>
                    <p>No skills added yet. Add your first skill above!</p>
                </div>
            `;
            return;
        }

        skillsList.innerHTML = skills.map(skill => `
            <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="flex items-center">
                    <i class="fas fa-code text-[#C69AE6] mr-3"></i>
                    <span class="text-gray-900 dark:text-white font-medium">${skill.name}</span>
                </div>
                <button onclick="skillsManager.deleteSkill(${skill.id})" class="text-red-600 hover:text-red-800 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    async handleSkillSubmit(event) {
        event.preventDefault();

        try {
            const skillName = document.getElementById('skill-name').value.trim();
            
            if (!skillName) {
                throw new Error('Skill name is required');
            }

            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available. Please make sure you are logged in.');
            }

            // Check if skill already exists for this user
            const existingSkill = this.userSkills.find(s => 
                s.name.toLowerCase() === skillName.toLowerCase()
            );
            
            if (existingSkill) {
                throw new Error('You already have this skill!');
            }

            const skillData = {
                name: skillName
            };

            const response = await window.apiClient.createSkill(this.currentCandidateId, skillData);

            if (response && response.success) {
                await this.showNotification('Skill added successfully!');
                document.getElementById('skill-form').reset();
                await this.loadSkills();
            } else {
                throw new Error(response?.message || 'Failed to add skill');
            }

        } catch (error) {
            console.error('Error adding skill:', error);
            await this.showNotification(`❌ Error: ${error.message}`, 'error');
        }
    }

    async deleteSkill(skillId) {
    // Custom confirmation modal instead of alert box
        const confirmed = await new Promise((resolve) => {
            // Create modal elements
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';

            const modalBox = document.createElement('div');
            modalBox.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full';

            modalBox.innerHTML = `
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Delete Skill</h3>
            <p class="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to delete this skill?</p>
            <div class="flex justify-end gap-2">
                <button id="cancel-delete-skill" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                <button id="confirm-delete-skill" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
            `;

            modalOverlay.appendChild(modalBox);
            document.body.appendChild(modalOverlay);

            // Event listeners
            document.getElementById('cancel-delete-skill').onclick = () => {
            document.body.removeChild(modalOverlay);
            resolve(false);
            };
            document.getElementById('confirm-delete-skill').onclick = () => {
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

            const response = await window.apiClient.deleteSkill(skillId, this.currentCandidateId);

            if (response && response.success) {
                await this.showNotification('Skill removed successfully!');
                await this.loadSkills();
            } else {
                throw new Error(response?.message || 'Failed to remove skill');
            }

        } catch (error) {
            console.error('Error removing skill:', error);
            await this.showNotification(`❌ Error: ${error.message}`, 'error');
        }
    }
}

// Initialize skills manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.skillsManager = new SkillsManager();
});