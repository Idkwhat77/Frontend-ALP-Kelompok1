// Education display functionality for employee profile (read-only)
class EmployeeEducationViewer {
    constructor(candidateId) {
        this.candidateId = candidateId;
        this.init();
    }

    init() {
        this.loadEducationRecords();
    }

    async loadEducationRecords() {
        try {
            if (!this.candidateId) {
                console.log('No candidate ID available');
                this.displayEducationRecords([]);
                return;
            }

            const response = await window.apiClient.getEducationByCandidate(this.candidateId);
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
                    <p>No education records available.</p>
                </div>
            `;
            return;
        }

        educationList.innerHTML = educations.map(education => `
            <div class="bg-lilac-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-4">
                    ${education.profileImageUrl ? 
                        `<img src="${education.profileImageUrl}" alt="${education.institutionName}" class="w-20 h-20 rounded-lg object-cover">` :
                        `<div class="w-20 h-20 rounded-lg bg-[#C69AE6] flex items-center justify-center">
                            <i class="fas fa-graduation-cap text-white text-2xl"></i>
                         </div>`
                    }
                    <div class="flex-1">
                        <h4 class="text-xl font-semibold text-[#C69AE6] mb-2">${education.institutionName}</h4>
                        <p class="text-gray-600 dark:text-gray-300 text-lg">
                            ${education.startYear}${education.endYear ? ` - ${education.endYear}` : ' - Present'}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Initialize employee education viewer when candidate data is available
function initializeEmployeeEducation(candidateId) {
    if (candidateId) {
        window.employeeEducationViewer = new EmployeeEducationViewer(candidateId);
    }
}

// Make it globally available
window.initializeEmployeeEducation = initializeEmployeeEducation;