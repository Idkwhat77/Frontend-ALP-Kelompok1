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