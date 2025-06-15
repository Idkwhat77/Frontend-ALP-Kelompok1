// Hobby display functionality for employee profile (read-only)
class EmployeeHobbyViewer {
    constructor(candidateId) {
        this.candidateId = candidateId;
        this.init();
    }

    init() {
        this.loadHobbyRecords();
    }

    async loadHobbyRecords() {
        try {
            if (!this.candidateId) {
                console.log('No candidate ID available');
                this.displayHobbies([]);
                return;
            }

            const response = await window.apiClient.getAllHobbies(this.candidateId);
            if (response && response.success) {
                this.displayHobbies(response.hobbies || []);
            }
        } catch (error) {
            console.error('Error loading hobby records:', error);
            this.displayHobbies([]);
        }
    }

    displayHobbies(hobbies) {
        const hobbiesList = document.getElementById('hobbies-list');
        if (!hobbiesList) return;

        if (hobbies.length === 0) {
            hobbiesList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-heart text-4xl mb-4"></i>
                    <p>No hobbies available.</p>
                </div>
            `;
            return;
        }

        hobbiesList.innerHTML = hobbies.map(hobby => `
            <div class="mb-4">
                <h4 class="font-semibold text-xl text-[#C69AE6]">${hobby.name}</h4>
            </div>
        `).join('');
    }
}

// Initialize employee hobby viewer when candidate data is available
function initializeEmployeeHobbies(candidateId) {
    if (candidateId) {
        window.employeeHobbyViewer = new EmployeeHobbyViewer(candidateId);
    }
}

// Make it globally available
window.initializeEmployeeHobbies = initializeEmployeeHobbies;