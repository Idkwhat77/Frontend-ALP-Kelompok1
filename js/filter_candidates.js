// This file is responsible for loading all candidates from the API
let allCandidates = []; // Store all candidates globally

async function loadFilterCandidates() {
    try {
        // Show loading state
        const candidatesContainer = document.querySelector('#candidates-container');
        candidatesContainer.innerHTML = `
            <div class="col-span-full flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-lilac-400"></div>
            </div>
        `;

        // Fetch candidates from API
        const response = await window.apiClient.getAllCandidates();
        
        if (response && response.success && response.candidates) {
            allCandidates = response.candidates; // Store all candidates
            displayCandidateCards(allCandidates); // Display all initially
            updateCandidateCount(allCandidates.length, allCandidates.length);
        } else {
            throw new Error('No candidates data received');
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        displayErrorState();
    }
}

function displayCandidateCards(candidates) {
    const candidatesContainer = document.querySelector('#candidates-container');
    
    if (candidates.length === 0) {
        candidatesContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-users text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                <p class="text-gray-500 dark:text-gray-400 text-lg">No candidates found matching your criteria.</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }

    candidatesContainer.innerHTML = candidates.map(candidate => `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover-scale transition-transform duration-300 text-sm">
            <div class="p-4">
                <div class="flex items-start mb-3">
                    <img class="h-14 w-14 rounded-full object-cover mr-3" 
                         src="${candidate.profileImageUrl ? `http://localhost:8080${candidate.profileImageUrl}` : 'img/default-profile.png'}" 
                         alt="${candidate.fullName || 'Unknown'}"
                         onerror="this.src='img/default-profile.png'">
                    <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">${candidate.fullName || 'Unknown'}</h3>
                        <p class="text-gray-500 dark:text-gray-300 text-xs">${candidate.jobType || 'Professional'}</p>
                        <div class="flex items-center mt-1">
                            <i class="fas fa-map-marker-alt text-xs text-gray-400 dark:text-gray-500 mr-1"></i>
                            <span class="text-gray-500 dark:text-gray-400 text-xs">${candidate.city || 'Unknown Location'}</span>
                        </div>
                    </div>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-xs mb-3 line-clamp-2">
                    ${candidate.biodata || 'Professional with experience in their field, ready for new opportunities.'}
                </p>
                <div class="flex flex-wrap gap-1 mb-3">
                    <span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${candidate.industry || 'General'}</span>
                    <span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${candidate.jobType || 'Professional'}</span>
                    ${candidate.employmentStatus ? `<span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${candidate.employmentStatus}</span>` : ''}
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">${candidate.employmentStatus || 'Available'}</span>
                    <button onclick="viewCandidateProfile(${candidate.id})" 
                            data-i18n="view_profile" 
                            class="px-3 py-1 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md transition-colors">
                        View Profile
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function generateSkillTags(industry) {
    // Map industries to relevant skill tags
    const skillMap = {
        'Technology': ['JavaScript', 'React'],
        'Information Technology': ['JavaScript', 'React'],
        'Marketing': ['Digital', 'SEO'],
        'Design': ['Figma', 'UI'],
        'Finance': ['Excel', 'Analysis'],
        'Healthcare': ['Medical', 'Care'],
        'Education': ['Teaching', 'Training']
    };
    
    const skills = skillMap[industry] || ['Professional', 'Skilled'];
    
    return skills.map(skill => 
        `<span class="px-2 py-1 bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-200 text-xs rounded-full">${skill}</span>`
    ).join('');
}

function viewCandidateProfile(candidateId) {
    // Navigate to employee profile page with candidate ID
    window.location.href = `employee_profile.html?id=${candidateId}`;
}

function updateCandidateCount(showing, total) {
    const countElement = document.querySelector('.text-sm.text-gray-500');
    if (countElement) {
        countElement.innerHTML = `
            <span data-i18n="candidates.showing">Showing</span> 
            <span class="font-medium text-lilac-500 dark:text-lilac-400">${showing}</span> 
            <span data-i18n="candidates.of">of</span> 
            <span class="font-medium">${total}</span> 
            <span data-i18n="candidates.found">candidates</span>
        `;
    }
}

function displayErrorState() {
    const candidatesContainer = document.querySelector('#candidates-container');
    candidatesContainer.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <p class="text-red-500 dark:text-red-400 mb-2">Failed to load candidates</p>
            <button onclick="loadFilterCandidates()" 
                    class="px-4 py-2 bg-lilac-400 hover:bg-lilac-500 text-white text-xs rounded-md">
                <i class="fas fa-redo mr-2"></i>Retry
            </button>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load API client first
    if (typeof window.apiClient === 'undefined') {
        console.log('Initializing API client...');
        window.apiClient = new ApiClient();
    }
    
    // Load candidates after a short delay to ensure API client is ready
    setTimeout(() => {
        console.log('Loading candidates...');
        loadFilterCandidates();
    }, 100);
});