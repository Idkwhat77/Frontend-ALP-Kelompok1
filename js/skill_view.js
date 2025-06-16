// Skills display functionality for employee profile (read-only)
class EmployeeSkillsViewer {
    constructor(candidateId) {
        this.candidateId = candidateId;
        this.init();
    }

    init() {
        this.loadSkillRecords();
    }

    async loadSkillRecords() {
        try {
            if (!this.candidateId) {
                console.log('No candidate ID available');
                this.displaySkills([]);
                return;
            }

            const response = await window.apiClient.getCandidateSkills(this.candidateId);
            if (response && response.success) {
                this.displaySkills(response.skills || []);
            }
        } catch (error) {
            console.error('Error loading skill records:', error);
            this.displaySkills([]);
        }
    }

    displaySkills(skills) {
        const skillsList = document.getElementById('skills-list');
        if (!skillsList) return;

        if (skills.length === 0) {
            skillsList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-code text-4xl mb-4"></i>
                    <p>No skills available.</p>
                </div>
            `;
            return;
        }

        skillsList.innerHTML = skills.map(skill => `
            <div class="flex items-center p-3 bg-lilac-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 mb-2">
                <i class="fas fa-code text-[#C69AE6] mr-3"></i>
                <span class="text-gray-900 dark:text-white font-medium">${skill.name}</span>
            </div>
        `).join('');
    }
}

// Initialize employee skills viewer when candidate data is available
function initializeEmployeeSkills(candidateId) {
    if (candidateId) {
        window.employeeSkillsViewer = new EmployeeSkillsViewer(candidateId);
    }
}

// Make it globally available
window.initializeEmployeeSkills = initializeEmployeeSkills;