window.addEventListener('DOMContentLoaded', async () => {
  const storedUser = JSON.parse(localStorage.getItem('current_user'));

  if (!storedUser || !storedUser.id) return;

  const userId = storedUser.id;

  try {
    const response = await apiClient.getCandidateByUserId(userId);

    // Check if the response is not ok
    if (!response || !response.candidate) {
      console.error('No candidate data found for user ID:', userId);
      return;
    }

    const candidate = response.candidate;

    // Helper function to format date
    const formatBirthDate = (dateString) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) return dateString;
        
        // Format as "Month Day, Year" (e.g., "June 14, 1990")
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
    };
    
    // Update profile information with candidate data
    document.getElementById('user-name').textContent = candidate.fullName || '';
    document.getElementById('user-name2').textContent = candidate.fullName || '';
    document.getElementById('user-email').textContent = candidate.email || '';
    document.getElementById('user-birthdate').textContent = formatBirthDate(candidate.birthDate);
    document.getElementById('user-location').textContent = candidate.city || '';
    document.getElementById('user-industry').textContent = candidate.industry || '';
    document.getElementById('user-employment-status').textContent = candidate.employmentStatus || '';

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

    // Fix: Use profileImageUrl instead of profileImage
    const profileImageElement = document.getElementById('profile-image');
    const profileImageElementNav = document.getElementById('profile-image-nav');
    const profileImageElementMobile = document.getElementById('profile-image-mobile');

    if (profileImageElementMobile) {
      if (candidate.profileImageUrl) {
        // Construct full URL - assuming your backend runs on localhost:8080
        const imageUrl = `http://localhost:8080${candidate.profileImageUrl}`;
        // Set background image instead of src
        profileImageElementMobile.style.backgroundImage = `url('${imageUrl}')`;
      } else {
        profileImageElementMobile.style.backgroundImage = `url('img/default-profile.png')`;
      }
    }

    if (profileImageElementNav) {
      if (candidate.profileImageUrl) {
        // Construct full URL - assuming your backend runs on localhost:8080
        const imageUrl = `http://localhost:8080${candidate.profileImageUrl}`;
        // Set background image instead of src
        profileImageElementNav.style.backgroundImage = `url('${imageUrl}')`;
      } else {
        profileImageElementNav.style.backgroundImage = `url('img/default-profile.png')`;
      }
    }

    if (profileImageElement) {
      if (candidate.profileImageUrl) {
        // Construct full URL - assuming your backend runs on localhost:8080
        const imageUrl = `http://localhost:8080${candidate.profileImageUrl}`;
        profileImageElement.style.backgroundImage = `url('${imageUrl}')`;
      } else {
        profileImageElement.style.backgroundImage = `url('img/default-profile.png')`;
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settings-form');
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
        
        // Load current profile data when settings modal opens
        const settingsModal = document.getElementById('modal-settings');
        if (settingsModal) {
            // Listen for when the modal is opened
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!settingsModal.classList.contains('hidden')) {
                            loadCurrentProfileData();
                        }
                    }
                });
            });
            observer.observe(settingsModal, { attributes: true });
        }
    }
});

// Load current profile data into the settings form
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
            document.getElementById('settings-city').value = candidate.city || '';
            document.getElementById('settings-industry').value = candidate.industry || '';
            document.getElementById('settings-employment-status').value = candidate.employmentStatus || '';
            document.getElementById('settings-job-type').value = candidate.jobType || '';
            document.getElementById('settings-biodata').value = candidate.biodata || '';
            
            // Handle birth date formatting
            if (candidate.birthDate) {
                const date = new Date(candidate.birthDate);
                const formattedDate = date.toISOString().split('T')[0];
                document.getElementById('settings-birthdate').value = formattedDate;
            }
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        alert('❌ Error loading profile data');
    }
}

// Handle settings form submission
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

        // Collect form data
        const formData = {
            fullName: document.getElementById('settings-fullname').value.trim(),
            email: document.getElementById('settings-email').value.trim(),
            birthDate: document.getElementById('settings-birthdate').value,
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
            const response = await window.apiClient.updateCandidate(user.id, formData);
            
            if (response && response.success) {
                alert('✅ Profile updated successfully!');
                
                // Update the profile display
                updateProfileDisplay(formData);
                
                // Close the modal
                closeModal('modal-settings');
            } else {
                throw new Error(response?.message || 'Update failed');
            }
        } else {
            // Fallback: simulate update for demo
            setTimeout(() => {
                alert('✅ Profile updated successfully! (Demo mode)');
                updateProfileDisplay(formData);
                closeModal('modal-settings');
            }, 1000);
        }
        
    } catch (error) {
        console.error('Settings update error:', error);
        alert(`❌ Error updating profile: ${error.message}`);
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Update the profile display with new data
function updateProfileDisplay(data) {
    // Helper function to format date
    const formatBirthDate = (dateString) => {
        if (!dateString) return '';
        
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
    };

    // Update profile information elements
    const elements = {
        'user-name': data.fullName,
        'user-name2': data.fullName,
        'user-email': data.email,
        'user-birthdate': formatBirthDate(data.birthDate),
        'user-location': data.city,
        'user-industry': data.industry,
        'user-employment-status': data.employmentStatus,
        'user-biodata': data.biodata
    };

    Object.entries(elements).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element && value) {
            element.textContent = value;
        }
    });

    // Refresh navbar profile image when profile is updated
    if (window.navbarProfileManager) {
        window.navbarProfileManager.refreshNavbar();
    }
}