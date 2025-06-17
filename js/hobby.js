// Hobby management functionality
class HobbyManagerClass {
    constructor() {
        this.currentCandidateId = null;
        this.userHobbies = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserHobbies();
    }

    setupEventListeners() {
        // Hobby form submission
        const hobbyForm = document.getElementById('hobby-form');
        if (hobbyForm) {
            hobbyForm.addEventListener('submit', (e) => this.handleHobbySubmit(e));
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

    async loadUserHobbies() {
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
                await this.loadHobbies();
            }
        } catch (error) {
            console.error('Error loading user hobbies:', error);
        }
    }

    async loadHobbies() {
        try {
            if (!this.currentCandidateId) {
                console.log('No candidate ID available');
                return;
            }

            const response = await window.apiClient.getAllHobbies(this.currentCandidateId);
            if (response && response.success) {
                this.userHobbies = response.hobbies || [];
                this.displayHobbies();
                this.displayCurrentHobbies();
            }
        } catch (error) {
            console.error('Error loading hobbies:', error);
            this.displayHobbies([]);
        }
    }

    displayHobbies() {
        const hobbiesList = document.getElementById('hobbies-list');
        if (!hobbiesList) return;

        if (this.userHobbies.length === 0) {
            hobbiesList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-heart text-4xl mb-4"></i>
                    <p>No hobbies added yet. Click "Manage" to add some!</p>
                </div>
            `;
            return;
        }

        hobbiesList.innerHTML = this.userHobbies.map(hobby => `
            <div class="mb-4">
                <h4 class="font-semibold text-xl text-[#C69AE6]">${hobby.name}</h4>
            </div>
        `).join('');
    }

    displayCurrentHobbies() {
        const currentHobbiesList = document.getElementById('current-hobbies-list');
        if (!currentHobbiesList) return;

        if (this.userHobbies.length === 0) {
            currentHobbiesList.innerHTML = `
                <div class="text-center py-4 text-gray-500 dark:text-gray-400">
                    <p>No hobbies added yet.</p>
                </div>
            `;
            return;
        }

        currentHobbiesList.innerHTML = this.userHobbies.map(hobby => `
            <div class="flex justify-between items-center bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <span class="text-gray-900 dark:text-white font-medium">${hobby.name}</span>
                <button onclick="hobbyManager.removeHobby(${hobby.id})" class="text-red-600 hover:text-red-800 p-1">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        `).join('');
    }

    async handleHobbySubmit(event) {
        event.preventDefault();

        try {
            const hobbyName = document.getElementById('hobby-name').value.trim();
            
            if (!hobbyName) {
                throw new Error('Hobby name is required');
            }

            if (!this.currentCandidateId) {
                throw new Error('No candidate ID available. Please make sure you are logged in.');
            }

            // Check if hobby already exists for this user
            const existingHobby = this.userHobbies.find(h => 
                h.name.toLowerCase() === hobbyName.toLowerCase()
            );
            
            if (existingHobby) {
                throw new Error('You already have this hobby!');
            }

            const hobbyData = {
                name: hobbyName
            };

            const response = await window.apiClient.createHobby(this.currentCandidateId, hobbyData);

            if (response && response.success) {
                await this.showNotification('Hobby added successfully!');
                document.getElementById('hobby-form').reset();
                await this.loadHobbies();
            } else {
                throw new Error(response?.message || 'Failed to add hobby');
            }

        } catch (error) {
            console.error('Error adding hobby:', error);
            await this.showNotification(`❌ Error: ${error.message}`, 'error');
        }
    }

    async removeHobby(hobbyId) {
        // Custom confirmation modal instead of alert box
        const confirmed = await new Promise((resolve) => {
            // Create modal elements
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50';

            const modalBox = document.createElement('div');
            modalBox.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full';

            modalBox.innerHTML = `
            <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Delete Hobby</h3>
            <p class="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to delete this hobby?</p>
            <div class="flex justify-end gap-2">
                <button id="cancel-delete-hobby" class="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                <button id="confirm-delete-hobby" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
            `;

            modalOverlay.appendChild(modalBox);
            document.body.appendChild(modalOverlay);

            // Event listeners
            document.getElementById('cancel-delete-hobby').onclick = () => {
            document.body.removeChild(modalOverlay);
            resolve(false);
            };
            document.getElementById('confirm-delete-hobby').onclick = () => {
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

            const response = await window.apiClient.deleteHobby(hobbyId, this.currentCandidateId);
            if (response && response.success) {
                await this.showNotification('Hobby removed successfully!');
                await this.loadHobbies();
            } else {
                throw new Error(response?.message || 'Failed to remove hobby');
            }
        } catch (error) {
            console.error('Error removing hobby:', error);
            await this.showNotification(`❌ Error: ${error.message}`, 'error');
        }
    }
}

// Global functions for HTML onclick handlers
function removeHobby(hobbyId) {
    if (window.hobbyManager) {
        window.hobbyManager.removeHobby(hobbyId);
    }
}

// Initialize hobby manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hobbyManager = new HobbyManagerClass();
});