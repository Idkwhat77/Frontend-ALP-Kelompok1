window.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on employee_profile.html (viewing someone else's profile)
  const isEmployeeProfilePage = window.location.pathname.includes('employee_profile.html');
  
  let candidateId = null;
  
  if (isEmployeeProfilePage) {
    // First, load the logged-in user's profile for navbar
    await loadLoggedInUserProfile();
    
    // Then get candidate ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    candidateId = urlParams.get('id');
    
    if (!candidateId) {
      console.error('No candidate ID provided in URL');
      document.getElementById('user-name').textContent = 'Candidate not found';
      return;
    }
    
    try {
      // Load specific candidate data by ID
      const response = await apiClient.getCandidateById(candidateId);
      
      if (!response || !response.candidate) {
        console.error('No candidate data found for ID:', candidateId);
        document.getElementById('user-name').textContent = 'Candidate not found';
        return;
      }
      
      const candidate = response.candidate;
      displayCandidateProfile(candidate, false); // false = don't update navbar
      
      // Initialize education viewer for this candidate
      if (window.initializeEmployeeEducation) {
        window.initializeEmployeeEducation(candidateId);
      }
      
    } catch (error) {
      console.error('Error loading candidate profile:', error);
      document.getElementById('user-name').textContent = 'Error loading profile';
    }
  } else {
    // Original behavior for profile.html (current user's profile)
    const storedUser = JSON.parse(localStorage.getItem('current_user'));

    if (!storedUser || !storedUser.id) return;

    const userId = storedUser.id;

    try {
      const response = await apiClient.getCandidateByUserId(userId);

      if (!response || !response.candidate) {
        console.error('No candidate data found for user ID:', userId);
        return;
      }

      const candidate = response.candidate;
      displayCandidateProfile(candidate, true); // true = update navbar
      
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }
});

// Load logged-in user's profile for navbar display
async function loadLoggedInUserProfile() {
  try {
    const storedUser = JSON.parse(localStorage.getItem('current_user'));
    if (!storedUser || !storedUser.id) return;

    const response = await apiClient.getCandidateByUserId(storedUser.id);
    if (response && response.candidate) {
      updateNavbarProfile(response.candidate);
    }
  } catch (error) {
    console.error('Error loading logged-in user profile:', error);
  }
}

// Update only navbar profile images with logged-in user's data
function updateNavbarProfile(candidate) {
  const profileImageElementNav = document.getElementById('profile-image-nav');
  const profileImageElementMobile = document.getElementById('profile-image-mobile');

  const imageUrl = candidate.profileImageUrl 
    ? `http://localhost:8080${candidate.profileImageUrl}`
    : 'img/default-profile.png';

  if (profileImageElementNav) {
    profileImageElementNav.style.backgroundImage = `url('${imageUrl}')`;
  }

  if (profileImageElementMobile) {
    profileImageElementMobile.style.backgroundImage = `url('${imageUrl}')`;
  }
}

// Helper function to display candidate profile data
function displayCandidateProfile(candidate, updateNavbar = true) {
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
  const elements = {
    'user-name': candidate.fullName || 'Unknown',
    'user-name2': candidate.fullName || 'Unknown',
    'user-email': candidate.email || 'Not provided',
    'user-birthdate': formatBirthDate(candidate.birthDate),
    'user-location': candidate.city || 'Not specified',
    'user-industry': candidate.industry || 'Not specified',
    'user-employment-status': candidate.employmentStatus || 'Not specified',
    'user-biodata': candidate.biodata || 'No bio available'
  };

  // Update each element if it exists
  Object.entries(elements).forEach(([elementId, value]) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  });

  // Update main profile image (always update this for the viewed profile)
  const profileImageElement = document.getElementById('profile-image');
  const imageUrl = candidate.profileImageUrl 
    ? `http://localhost:8080${candidate.profileImageUrl}`
    : 'img/default-profile.png';

  if (profileImageElement) {
    profileImageElement.style.backgroundImage = `url('${imageUrl}')`;
  }

  // Only update navbar images if this is the logged-in user's own profile
  if (updateNavbar) {
    updateNavbarProfile(candidate);
  }
}