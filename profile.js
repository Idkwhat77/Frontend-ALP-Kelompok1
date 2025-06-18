document.addEventListener('DOMContentLoaded', function() {
    // Initialize profile manager
    initializeProfile();
    setupSettingsForm();
});

async function initializeProfile() {
    try {
        const user = window.apiClient?.getCurrentUser();
        if (!user || !user.id) {
            console.error('No user found');
            return;
        }

        const response = await window.apiClient.getCandidateByUserId(user.id);
        if (response && response.candidate) {
            displayCandidateProfile(response.candidate);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function displayCandidateProfile(candidate) {
    // Helper function to format province name
    const formatProvinceName = (province) => {
        if (!province) return '';
        return province
            .split('-')
            .map(word => {
                if (word === 'dki') return 'DKI';
                if (word === 'di') return 'DI';
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    // Helper function to format location
    const formatLocation = (city, province) => {
        const formattedProvince = formatProvinceName(province);
        if (city && formattedProvince) {
            return `${formattedProvince}, ${city}`;
        } else if (city) {
            return city;
        } else if (formattedProvince) {
            return formattedProvince;
        }
        return 'Not specified';
    };

    // Update profile information
    document.getElementById('user-name').textContent = candidate.fullName || 'Loading...';
    document.getElementById('user-industry').textContent = candidate.industry || 'Loading...';
    document.getElementById('user-location').textContent = formatLocation(candidate.city, candidate.province);
    document.getElementById('user-birthdate').textContent = formatBirthDate(candidate.birthDate);
    document.getElementById('user-email').textContent = candidate.email || 'Loading...';
    document.getElementById('user-employment-status').textContent = candidate.employmentStatus || 'Loading...';

    // Update biodata
    const biodataElement = document.getElementById('user-biodata');
    if (biodataElement) {
        if (candidate.biodata && candidate.biodata.trim()) {
            biodataElement.textContent = candidate.biodata;
        } else {
            biodataElement.innerHTML = `
                <span class="text-gray-400 dark:text-gray-500 italic text-sm">
                    <i class="fas fa-info-circle mr-2"></i>
                    No biodata provided
                </span>
            `;
        }
    }

    // Update profile image
    const profileImageElement = document.getElementById('profile-image');
    if (profileImageElement && candidate.profileImageUrl) {
        const imageUrl = `http://localhost:8080${candidate.profileImageUrl}`;
        profileImageElement.style.backgroundImage = `url('${imageUrl}')`;
    }
}

function formatBirthDate(dateString) {
    if (!dateString) return 'Not provided';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

function setupSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
        
        // Load current data when settings modal is opened
        const settingsModal = document.getElementById('modal-settings');
        if (settingsModal) {
            const observer = new MutationObserver(() => {
                if (!settingsModal.classList.contains('hidden')) {
                    loadCurrentProfileData();
                }
            });
            observer.observe(settingsModal, { attributes: true });
        }
    }
}

async function loadCurrentProfileData() {
    try {
        const user = window.apiClient?.getCurrentUser();
        if (!user || !user.id) {
            console.error('No user found');
            return;
        }

        const response = await window.apiClient.getCandidateByUserId(user.id);
        if (response && response.candidate) {
            const candidate = response.candidate;
            
            // Populate form fields
            document.getElementById('settings-fullname').value = candidate.fullName || '';
            document.getElementById('settings-email').value = candidate.email || '';
            
            // Handle industry with case-insensitive matching
            const industrySelect = document.getElementById('settings-industry');
            if (industrySelect && candidate.industry) {
                // First try exact match
                let optionFound = false;
                for (let option of industrySelect.options) {
                    if (option.value === candidate.industry) {
                        industrySelect.value = candidate.industry;
                        optionFound = true;
                        break;
                    }
                }
                
                // If no exact match, try case-insensitive match
                if (!optionFound) {
                    const candidateIndustryLower = candidate.industry.toLowerCase();
                    for (let option of industrySelect.options) {
                        if (option.value.toLowerCase() === candidateIndustryLower) {
                            industrySelect.value = option.value;
                            optionFound = true;
                            break;
                        }
                    }
                }
                
                // If still no match, log for debugging
                if (!optionFound) {
                    console.warn('Industry not found in options:', candidate.industry);
                    console.log('Available options:', Array.from(industrySelect.options).map(opt => opt.value));
                }
            }
            
            document.getElementById('settings-employment-status').value = candidate.employmentStatus || '';
            document.getElementById('settings-job-type').value = candidate.jobType || '';
            document.getElementById('settings-biodata').value = candidate.biodata || '';
            
            // Handle province and city
            const provinceSelect = document.getElementById('settings-province');
            const citySelect = document.getElementById('settings-city');
            
            if (provinceSelect && candidate.province) {
                provinceSelect.value = candidate.province;
                
                // Trigger change event to populate cities
                const event = new Event('change');
                provinceSelect.dispatchEvent(event);
                
                // Set city after a brief delay to ensure cities are loaded
                setTimeout(() => {
                    if (citySelect && candidate.city) {
                        citySelect.value = candidate.city;
                    }
                }, 100);
            }
            
            // Handle birth date formatting
            if (candidate.birthDate) {
                const date = new Date(candidate.birthDate);
                const formattedDate = date.toISOString().split('T')[0];
                document.getElementById('settings-birthdate').value = formattedDate;
            }
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        showNotification('Error loading profile data', 'error');
    }
}

async function handleSettingsSubmit(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        const user = window.apiClient?.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        // Get candidate data first to get the candidate ID
        const candidateResponse = await window.apiClient.getCandidateByUserId(user.id);
        if (!candidateResponse || !candidateResponse.candidate) {
            throw new Error('No candidate data found for user');
        }
        
        const candidateId = candidateResponse.candidate.id;
        
        // Collect form data
        const formData = {
            fullName: document.getElementById('settings-fullname').value.trim(),
            email: document.getElementById('settings-email').value.trim(),
            birthDate: document.getElementById('settings-birthdate').value,
            province: document.getElementById('settings-province').value,
            city: document.getElementById('settings-city').value,
            industry: document.getElementById('settings-industry').value,
            employmentStatus: document.getElementById('settings-employment-status').value,
            jobType: document.getElementById('settings-job-type').value,
            biodata: document.getElementById('settings-biodata').value.trim()
        };

        // Validate required fields
        if (!formData.fullName || !formData.email) {
            throw new Error('Full name and email are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            throw new Error('Please enter a valid email address');
        }

        // Update profile via API
        if (window.apiClient && window.apiClient.updateCandidate) {
            const response = await window.apiClient.updateCandidate(candidateId, formData);
            
            if (response && response.success) {
                showNotification('Profile updated successfully!');
                // Update the profile display
                displayCandidateProfile({...candidateResponse.candidate, ...formData});
                
                // Close the modal
                closeModal('modal-settings');
            } else {
                throw new Error(response?.message || 'Update failed');
            }
        } else {
            // Fallback: simulate update for demo
            setTimeout(() => {
                showNotification('Profile updated successfully! (Demo mode)');
                displayCandidateProfile({...candidateResponse.candidate, ...formData});
                closeModal('modal-settings');
            }, 1000);
        }
        
    } catch (error) {
        console.error('Settings update error:', error);
        showNotification(`Error updating profile: ${error.message}`, 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}