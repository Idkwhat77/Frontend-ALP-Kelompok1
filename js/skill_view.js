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
        const skillsList = document.getElementById('current-skills-list');
        if (!skillsList) return;

        if (skills.length === 0) {
            const noSkillsText = window.currentLanguage === 'id' ? 'Tidak ada keterampilan tersedia.' : 'No skills available.';
            
            skillsList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-code text-4xl mb-4" aria-label="skills"></i>
                    <p data-i18n="skills.no_skills">${noSkillsText}</p>
                </div>
            `;
            return;
        }

        skillsList.innerHTML = `
            <div class="flex flex-wrap gap-2">
                ${skills.map(skill => `
                    <div class="bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-300 px-3 py-1 rounded-full text-sm flex items-center">
                        <span>${skill.name}</span>
                    </div>
                `).join('')}
            </div>
        `;
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