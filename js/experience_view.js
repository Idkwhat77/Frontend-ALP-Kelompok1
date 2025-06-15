// Experience viewer for employee profiles
function initializeEmployeeExperience(candidateId) {
    console.log('Initializing experience view for candidate:', candidateId);
    loadEmployeeExperience(candidateId);
}

async function loadEmployeeExperience(candidateId) {
    try {
        const response = await window.apiClient.getExperienceByCandidate(candidateId);
        if (response && response.success) {
            displayEmployeeExperience(response.experiences || []);
        } else {
            displayEmployeeExperience([]);
        }
    } catch (error) {
        console.error('Error loading employee experience:', error);
        displayEmployeeExperience([]);
    }
}

function displayEmployeeExperience(experiences) {
    const experienceList = document.getElementById('experience-list');
    if (!experienceList) return;

    if (experiences.length === 0) {
        experienceList.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-briefcase text-4xl mb-4"></i>
                <p>No experience records found.</p>
            </div>
        `;
        return;
    }

    experienceList.innerHTML = experiences.map(experience => `
        <div class="bg-lilac-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div class="flex items-center gap-4">
                ${experience.profileImageUrl ? 
                    `<img src="${experience.profileImageUrl}" alt="${experience.experienceName}" class="w-16 h-16 rounded-lg object-cover">` :
                    `<div class="w-16 h-16 rounded-lg bg-[#C69AE6] flex items-center justify-center">
                        <i class="fas fa-briefcase text-white text-xl"></i>
                     </div>`
                }
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-[#C69AE6]">${experience.experienceName}</h4>
                    <p class="text-gray-600 dark:text-gray-300">
                        ${experience.startYear}${experience.endYear ? ` - ${experience.endYear}` : ' - Present'}
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// Make functions globally available
window.initializeEmployeeExperience = initializeEmployeeExperience;
window.loadEmployeeExperience = loadEmployeeExperience;
window.displayEmployeeExperience = displayEmployeeExperience;
