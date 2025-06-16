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
                alert('✅ Skill added successfully!');
                document.getElementById('skill-form').reset();
                await this.loadSkills();
            } else {
                throw new Error(response?.message || 'Failed to add skill');
            }

        } catch (error) {
            console.error('Error adding skill:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }

    async deleteSkill(skillId) {
        if (!confirm('Are you sure you want to remove this skill?')) {
            return;
        }

        try {
            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available');
            }

            const response = await window.apiClient.deleteSkill(skillId, this.currentCandidateId);

            if (response && response.success) {
                alert('✅ Skill removed successfully!');
                await this.loadSkills();
            } else {
                throw new Error(response?.message || 'Failed to remove skill');
            }

        } catch (error) {
            console.error('Error removing skill:', error);
            alert(`❌ Error: ${error.message}`);
        }
    }
}

// Initialize skills manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.skillsManager = new SkillsManager();
});