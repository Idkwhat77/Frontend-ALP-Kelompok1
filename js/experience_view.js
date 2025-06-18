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
        const noExperienceText = window.currentLanguage === 'id' ? 'Tidak ada catatan pengalaman ditemukan.' : 'No experience records found.';
        
        experienceList.innerHTML = `
            <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                <i class="fas fa-briefcase text-4xl mb-4" aria-label="experience"></i>
                <p data-i18n="experience.no_records">${noExperienceText}</p>
            </div>
        `;
        return;
    }

    experienceList.innerHTML = experiences.map(experience => `
            <div class="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
                <div class="mr-4">
                    <div class="h-12 w-12 rounded-lg bg-lilac-100 dark:bg-gray-600 flex items-center justify-center">
                        ${experience.profileImageUrl ? 
                            `<img src="${experience.profileImageUrl}" alt="${experience.experienceName}" class="h-12 w-12 rounded-lg object-cover">` :
                            `<i class="fas fa-briefcase text-lilac-500 text-xl"></i>`
                        }
                    </div>
                </div>
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 dark:text-white">${experience.experienceName}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                        ${experience.startYear}${experience.endYear ? ` - ${experience.endYear}` : ' - Present'}
                    </p>
                    ${experience.degree ? `<p class="text-sm text-gray-500 dark:text-gray-400">${experience.degree}</p>` : ''}
                </div>
            </div>
    `).join('');
}

// Make functions globally available
window.initializeEmployeeExperience = initializeEmployeeExperience;
window.loadEmployeeExperience = loadEmployeeExperience;
window.displayEmployeeExperience = displayEmployeeExperience;
