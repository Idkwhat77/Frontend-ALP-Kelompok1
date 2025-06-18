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
      const errorText = window.currentLanguage === 'id' ? 'Kandidat tidak ditemukan' : 'Candidate not found';
      document.getElementById('user-name').textContent = errorText;
      document.getElementById('user-name').setAttribute('data-i18n', 'profile.candidate_not_found');
      return;
    }
    
    try {
      // Load specific candidate data by ID
      const response = await apiClient.getCandidateById(candidateId);
      
      if (!response || !response.candidate) {
        console.error('No candidate data found for ID:', candidateId);
        const errorText = window.currentLanguage === 'id' ? 'Kandidat tidak ditemukan' : 'Candidate not found';
        document.getElementById('user-name').textContent = errorText;
        document.getElementById('user-name').setAttribute('data-i18n', 'profile.candidate_not_found');
        return;
      }
      
      const candidate = response.candidate;
      displayCandidateProfile(candidate, false); // false = don't update navbar
      
      // Initialize viewers for this candidate
      if (window.initializeEmployeeEducation) {
        window.initializeEmployeeEducation(candidateId);
      }

      if (window.initializeEmployeeExperience) {
        window.initializeEmployeeExperience(candidateId);
      }
      
      if (window.initializeEmployeeHobbies) {
        window.initializeEmployeeHobbies(candidateId);
      }
      
      if (window.initializeEmployeeSkills) {
        window.initializeEmployeeSkills(candidateId);
      }

      // Load social media and portfolio data
      loadSocialMediaData(candidateId);
      loadPortfolioData(candidateId);
      
    } catch (error) {
      console.error('Error loading candidate profile:', error);
      document.getElementById('user-name').textContent = 'Error loading profile';
    }
  } else {
    // Original behavior for profiledesign.html (current user's profile)
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

  // Store candidate data globally for chat functionality
  window.currentCandidateData = candidate;
  console.log('Storing candidate data globally:', window.currentCandidateData);

  // Update profile information with candidate data
  document.getElementById('user-name').textContent = candidate.fullName || '';
  document.getElementById('user-email').textContent = candidate.email || '';
  document.getElementById('user-birthdate').textContent = formatBirthDate(candidate.birthDate);
  document.getElementById('user-location').textContent = formatLocation(candidate.city, candidate.province);
  document.getElementById('user-industry').textContent = candidate.industry || '';
  
  // Check if employment status element exists
  const employmentStatusElement = document.getElementById('user-employment-status');
  if (employmentStatusElement) {
    employmentStatusElement.textContent = candidate.employmentStatus || '';
  }

  // Update contact information in right column
  const emailContactElement = document.getElementById('user-email-contact');
  const locationContactElement = document.getElementById('user-location-contact');
  
  if (emailContactElement) {
    emailContactElement.textContent = candidate.email || 'Not provided';
  }
  
  if (locationContactElement) {
    locationContactElement.textContent = formatLocation(candidate.city, candidate.province);
  }

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
  
  // Update page title for employee profiles
  if (candidate.fullName) {
    document.title = `${candidate.fullName} - RuangKerja`;
  }
  
  // Trigger a custom event to notify that candidate data is loaded
  window.dispatchEvent(new CustomEvent('candidateDataLoaded', { 
    detail: { candidate: candidate }
  }));
}

// Helper function to update navbar profile images
function updateNavbarProfile(candidate) {
  const imageUrl = candidate.profileImageUrl 
    ? `http://localhost:8080${candidate.profileImageUrl}`
    : 'img/default-profile.png';

  // Update navbar profile images
  const profileImageElementNav = document.getElementById('profile-image-nav');
  const profileImageElementMobile = document.getElementById('profile-image-mobile');

  if (profileImageElementNav) {
    profileImageElementNav.style.backgroundImage = `url('${imageUrl}')`;
  }

  if (profileImageElementMobile) {
    profileImageElementMobile.style.backgroundImage = `url('${imageUrl}')`;
  }
}

// Load social media data for employee profile view
async function loadSocialMediaData(candidateId) {
  try {
    const socialsList = document.getElementById('current-socials-list');
    if (!socialsList) return;

    // Try to get social media data from API
    const response = await window.apiClient.getCandidateSocials?.(candidateId);
    
    if (response && response.success && response.socials && response.socials.length > 0) {
      const socialsHTML = response.socials.map(social => {
        const iconClass = getSocialIconClass(social.platform);
        return `
          <div class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <i class="${iconClass} text-[#C69AE6] mr-3"></i>
            <a href="${social.url}" target="_blank" class="text-gray-700 dark:text-gray-300 hover:text-[#C69AE6] hover:underline">
              ${social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}
            </a>
          </div>
        `;
      }).join('');
      
      socialsList.innerHTML = socialsHTML;
    } else {
      socialsList.innerHTML = `
        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
          <i class="fas fa-share-alt text-2xl mb-2"></i>
          <p>No social media links available</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading social media data:', error);
    const socialsList = document.getElementById('current-socials-list');
    if (socialsList) {
      socialsList.innerHTML = `
        <div class="text-center py-4 text-gray-500 dark:text-gray-400">
          <i class="fas fa-share-alt text-2xl mb-2"></i>
          <p>No social media links available</p>
        </div>
      `;
    }
  }
}

// Load portfolio data for employee profile view
async function loadPortfolioData(candidateId) {
  try {
    const portfolioList = document.getElementById('current-portfolio-list');
    if (!portfolioList) return;

    // Try to get portfolio data from API
    const response = await window.apiClient.getCandidatePortfolio?.(candidateId);
    
    if (response && response.success && response.portfolio && response.portfolio.length > 0) {
      const portfolioHTML = response.portfolio.map(item => {
        // Fix: Format the image URL properly
        const imageUrl = item.imageUrl ? 
          (item.imageUrl.startsWith('http') ? 
            item.imageUrl : 
            `http://localhost:8080${item.imageUrl.startsWith('/') ? item.imageUrl : '/' + item.imageUrl}`
          ) : null;
        
        return `
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            ${imageUrl ? 
              `<div class="mb-3">
                <img src="${imageUrl}" alt="${item.title}" class="w-full h-32 object-cover rounded-lg" 
                     onerror="this.src='img/default-portfolio.png';">
              </div>` : 
              `<div class="mb-3">
                <div class="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <i class="fas fa-image text-2xl text-gray-400"></i>
                </div>
              </div>`
            }
            <h4 class="font-semibold text-[#C69AE6] mb-2">${item.title}</h4>
            ${item.description ? 
              `<p class="text-gray-600 dark:text-gray-300 text-sm mb-2">${item.description}</p>` : ''
            }
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                ${item.type || 'Project'}
              </span>
              <a href="${item.url}" target="_blank" class="text-[#C69AE6] hover:text-[#9f7aea] text-sm">
                <i class="fas fa-external-link-alt mr-1"></i>View
              </a>
            </div>
          </div>
        `;
      }).join('');
      
      portfolioList.innerHTML = portfolioHTML;
    } else {
      portfolioList.innerHTML = `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="fas fa-briefcase text-2xl mb-2"></i>
          <p>No portfolio items available</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading portfolio data:', error);
    const portfolioList = document.getElementById('current-portfolio-list');
    if (portfolioList) {
      portfolioList.innerHTML = `
        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="fas fa-briefcase text-2xl mb-2"></i>
          <p>No portfolio items available</p>
        </div>
      `;
    }
  }
}

// Helper function to get social media icon class
function getSocialIconClass(platform) {
  const iconMap = {
    instagram: 'fab fa-instagram',
    facebook: 'fab fa-facebook',
    twitter: 'fab fa-twitter',
    linkedin: 'fab fa-linkedin',
    github: 'fab fa-github',
    youtube: 'fab fa-youtube',
    tiktok: 'fab fa-tiktok',
    website: 'fas fa-globe'
  };
  
  return iconMap[platform.toLowerCase()] || 'fas fa-link';
}