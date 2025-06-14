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

  } catch (err) {
    console.error('Error loading profile:', err);
  }
});