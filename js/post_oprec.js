// Add this improved date formatting function at the top of the file
function formatRealDate(dateInput) {
    if (!dateInput) return 'recently';
    
    try {
        let date;
        
        // Handle different date formats from backend
        if (Array.isArray(dateInput) && dateInput.length >= 6) {
            // Handle Jackson array format [YYYY, MM, DD, HH, MM, SS]
            // Note: JavaScript Date constructor expects month to be 0-indexed
            date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
        } else if (typeof dateInput === 'string') {
            // Handle ISO string format
            date = new Date(dateInput);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            console.warn('Unknown date format:', dateInput);
            return 'recently';
        }
        
        // Validate the parsed date
        if (!date || isNaN(date.getTime())) {
            console.warn('Invalid date parsed from:', dateInput);
            return 'recently';
        }
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Format relative time
        if (diffMinutes < 1) {
            return 'just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffDays < 30) {
            const weeks = Math.ceil(diffDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else if (diffDays < 365) {
            const months = Math.ceil(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            const years = Math.ceil(diffDays / 365);
            return `${years} year${years > 1 ? 's' : ''} ago`;
        }
    } catch (error) {
        console.error('Error formatting date:', error, 'Input:', dateInput);
        return 'recently';
    }
}

// Add a universal date parser utility
function parseUniversalDate(dateInput) {
    if (!dateInput) return null;
    
    try {
        let date;
        
        if (Array.isArray(dateInput) && dateInput.length >= 6) {
            // Jackson array format [YYYY, MM, DD, HH, MM, SS]
            date = new Date(dateInput[0], dateInput[1] - 1, dateInput[2], dateInput[3] || 0, dateInput[4] || 0, dateInput[5] || 0);
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            return null;
        }
        
        return (date && !isNaN(date.getTime())) ? date : null;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
}

// Province and city data
const citiesByProvince = {
    "Aceh": ["Banda Aceh", "Langsa", "Lhokseumawe", "Sabang", "Subulussalam"],
    "Sumatera Utara": ["Binjai", "Gunungsitoli", "Medan", "Padangsidempuan", "Pematangsiantar", "Sibolga", "Tanjung Balai", "Tebing Tinggi"],
    "Sumatera Barat": ["Bukittinggi", "Padang", "Padang Panjang", "Pariaman", "Payakumbuh", "Sawahlunto", "Solok"],
    "Riau": ["Pekanbaru", "Dumai"],
    "Jambi": ["Jambi", "Sungai Penuh"],
    "Sumatera Selatan": ["Lubuklinggau", "Pagar Alam", "Palembang", "Prabumulih"],
    "Bengkulu": ["Bengkulu"],
    "Lampung": ["Bandar Lampung", "Metro"],
    "Kepulauan Bangka Belitung": ["Pangkalpinang"],
    "Kepulauan Riau": ["Batam", "Tanjung Pinang"],
    "DKI Jakarta": ["Jakarta Pusat", "Jakarta Utara", "Jakarta Barat", "Jakarta Selatan", "Jakarta Timur"],
    "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya", "Banjar"],
    "Jawa Tengah": ["Magelang", "Pekalongan", "Purwokerto", "Salatiga", "Semarang", "Surakarta", "Tegal"],
    "DI Yogyakarta": ["Yogyakarta"],
    "Jawa Timur": ["Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya"],
    "Banten": ["Cilegon", "Serang", "Tangerang Selatan", "Tangerang"],
    "Bali": ["Denpasar"],
    "Nusa Tenggara Barat": ["Bima", "Mataram"],
    "Nusa Tenggara Timur": ["Kupang"],
    "Kalimantan Barat": ["Pontianak", "Singkawang"],
    "Kalimantan Tengah": ["Palangka Raya"],
    "Kalimantan Selatan": ["Banjarbaru", "Banjarmasin"],
    "Kalimantan Timur": ["Balikpapan", "Bontang", "Samarinda"],
    "Kalimantan Utara": ["Tarakan"],
    "Sulawesi Utara": ["Bitung", "Kotamobagu", "Manado", "Tomohon"],
    "Sulawesi Tengah": ["Palu"],
    "Sulawesi Selatan": ["Makassar", "Palopo", "Parepare"],
    "Sulawesi Tenggara": ["Baubau", "Kendari"],
    "Gorontalo": ["Gorontalo"],
    "Sulawesi Barat": ["Mamuju"],
    "Maluku": ["Ambon", "Tual"],
    "Maluku Utara": ["Ternate", "Tidore Kepulauan"],
    "Papua Barat": ["Sorong"],
    "Papua": ["Jayapura"]
};

// Notification system - consistent with other classes in the codebase
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${iconClass} mr-2" aria-label="${type}"></i>
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
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize province and city dropdowns
document.addEventListener('DOMContentLoaded', function() {
    const provinceSelect = document.getElementById('province');
    const citySelect = document.getElementById('city');

    if (provinceSelect && citySelect) {
        // Populate provinces
        Object.keys(citiesByProvince).forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            provinceSelect.appendChild(option);
        });

        provinceSelect.addEventListener('change', () => {
            const province = provinceSelect.value;
            citySelect.innerHTML = '<option value="">Select city/regency</option>';

            if (province && citiesByProvince[province]) {
                citiesByProvince[province].forEach(city => {
                    const option = document.createElement('option');
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
            }
        });
    }

    // Authentication check - only allow companies to access this page
    checkCompanyAuthentication();
});

async function checkCompanyAuthentication() {
    try {
        // Initialize API client if not exists
        if (typeof window.apiClient === 'undefined') {
            window.apiClient = new ApiClient();
        }
        
        const currentUser = window.apiClient.getCurrentUser();
        const userType = window.apiClient.getUserType();
        
        console.log('Current user:', currentUser);
        console.log('User type:', userType);
        
        // Redirect to login if not authenticated
        if (!currentUser) {
            showNotification('Please log in to post a job', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Check if user is a company
        if (userType !== 'company') {
            showNotification('Only companies can post job openings. Please log in with a company account.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            return;
        }
        
        // Load company profile to verify company exists
        await loadCompanyProfile();
        
        // Initialize form after successful authentication
        initializeJobPostingForm();
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        showNotification('Failed to verify authentication. Please try logging in again.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    }
}

async function loadCompanyProfile() {
    try {
        const currentUser = window.apiClient.getCurrentUser();
        const response = await window.apiClient.getCompanyByUserId(currentUser.id);
        
        if (!response || !response.success || !response.company) {
            showNotification('Company profile not found. Please complete your company profile first.', 'error');
            setTimeout(() => {
                window.location.href = 'company_profile.html';
            }, 3000);
            return;
        }
        
        // Store company data for job posting
        window.currentCompany = response.company;
        console.log('Company loaded:', response.company);
        
        // Show company name in the form header
        const companyNameElement = document.getElementById('company-name-display');
        if (companyNameElement) {
            companyNameElement.textContent = response.company.companyName;
        }
        
    } catch (error) {
        console.error('Error loading company profile:', error);
        showNotification('Failed to load company profile. Please try again.', 'error');
        setTimeout(() => {
            window.location.href = 'company_profile.html';
        }, 3000);
    }
}

function initializeJobPostingForm() {
    // Rich text editor setup
    const editor = document.getElementById('jobDescription');
    if (editor) {
        editor.addEventListener('focus', function() {
            if (this.textContent === 'Describe the responsibilities and requirements of this position...') {
                this.textContent = '';
            }
        });

        editor.addEventListener('blur', function() {
            if (this.textContent.trim() === '') {
                this.textContent = 'Describe the responsibilities and requirements of this position...';
            }
        });
    }

    // Skills management
    const skillInput = document.getElementById('skillInput');
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillsContainer = document.getElementById('skillsContainer');

    if (addSkillBtn && skillInput && skillsContainer) {
        addSkillBtn.addEventListener('click', function() {
            const skill = skillInput.value.trim();
            if (skill && !isSkillAlreadyAdded(skill)) {
                addSkillTag(skill);
                skillInput.value = '';
            }
        });

        skillInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkillBtn.click();
            }
        });
    }

    // Form submission
    const jobPostForm = document.getElementById('jobPostForm');
    if (jobPostForm) {
        jobPostForm.addEventListener('submit', handleJobSubmission);
    }

    // Set minimum date for deadline (today)
    const today = new Date().toISOString().split('T')[0];
    const deadlineInput = document.getElementById('deadline');
    if (deadlineInput) {
        deadlineInput.min = today;
    }
}

function isSkillAlreadyAdded(skill) {
    const existingSkills = Array.from(document.querySelectorAll('#skillsContainer .skill-tag'))
        .map(tag => tag.textContent.replace('×', '').trim().toLowerCase());
    return existingSkills.includes(skill.toLowerCase());
}

function addSkillTag(skill) {
    const skillsContainer = document.getElementById('skillsContainer');
    const skillTag = document.createElement('span');
    skillTag.className = 'skill-tag inline-flex items-center px-3 py-1 rounded-full text-sm bg-lilac-100 dark:bg-gray-700 text-lilac-800 dark:text-lilac-300';
    skillTag.innerHTML = `
        ${skill}
        <button type="button" class="ml-2 text-lilac-600 dark:text-lilac-400 hover:text-lilac-800 dark:hover:text-lilac-200" onclick="removeSkill(this)">
            ×
        </button>
    `;
    skillsContainer.appendChild(skillTag);
}

function removeSkill(button) {
    button.closest('.skill-tag').remove();
}

async function handleJobSubmission(e) {
    e.preventDefault();
    
    // Get submit button reference first
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Post Job';
    
    try {
        // Verify company is still authenticated
        const currentUser = window.apiClient.getCurrentUser();
        const userType = window.apiClient.getUserType();
        
        if (!currentUser || userType !== 'company') {
            showNotification('Authentication expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        // Verify company profile exists
        if (!window.currentCompany) {
            showNotification('Company profile not found. Please refresh the page.', 'error');
            return;
        }
        
        // Show loading state
        if (submitBtn) {
            submitBtn.textContent = 'Posting Job...';
            submitBtn.disabled = true;
        }
        
        // Get the HTML content from the rich text editor
        const jobDescription = document.getElementById('jobDescription').value;
        
        // Collect form data
        const formData = new FormData(e.target);
        
        // Get selected skills
        const skills = Array.from(document.querySelectorAll('#skillsContainer .skill-tag'))
            .map(tag => tag.textContent.replace('×', '').trim());
        
        // Get selected benefits
        const benefits = Array.from(document.querySelectorAll('input[name="benefits"]:checked'))
            .map(cb => cb.value);
        
        // Parse salary values properly
        const salaryMinValue = formData.get('salaryMin');
        const salaryMaxValue = formData.get('salaryMax');
        
        const salaryMin = salaryMinValue && salaryMinValue.trim() !== '' ? parseInt(salaryMinValue) : null;
        const salaryMax = salaryMaxValue && salaryMaxValue.trim() !== '' ? parseInt(salaryMaxValue) : null;
        
        // Validate salary range
        if (salaryMin && salaryMax && salaryMin > salaryMax) {
            showNotification('Minimum salary cannot be greater than maximum salary.', 'error');
            return;
        }
        
        // Validate required fields
        if (!formData.get('jobTitle')) {
            showNotification('Job title is required.', 'error');
            return;
        }
        
        if (!formData.get('jobType')) {
            showNotification('Job type is required.', 'error');
            return;
        }
        
        if (!formData.get('province')) {
            showNotification('Province is required.', 'error');
            return;
        }
        
        if (!formData.get('city')) {
            showNotification('City is required.', 'error');
            return;
        }
        
        if (!formData.get('experience')) {
            showNotification('Experience level is required.', 'error');
            return;
        }
        
        if (!jobDescription || jobDescription.trim() === '') {
            showNotification('Job description is required.', 'error');
            return;
        }
        
        if (!formData.get('deadline')) {
            showNotification('Application deadline is required.', 'error');
            return;
        }
        
        if (skills.length === 0) {
            showNotification('At least one skill is required.', 'error');
            return;
        }
        
        // Create job posting object with company information
        const jobData = {
            title: formData.get('jobTitle'),
            type: formData.get('jobType'),
            province: formData.get('province'),
            city: formData.get('city'),
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            experience: formData.get('experience'),
            description: jobDescription,
            skills: skills,
            benefits: benefits,
            deadline: formData.get('deadline'),
            hiringProcess: formData.get('hiringProcess'),
            applicationQuestions: formData.get('applicationQuestions')
        };
        
        console.log('Submitting job data:', jobData);
        
        // Send to backend API
        const response = await fetch('http://localhost:8080/api/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': currentUser.id.toString(),
                'X-Company-Id': window.currentCompany.id.toString()
            },
            body: JSON.stringify(jobData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error occurred' }));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Job posted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'oprec.html';
            }, 2000);
        } else {
            throw new Error(result.message || 'Failed to post job');
        }
        
    } catch (error) {
        console.error('Error posting job:', error);
        
        // Show user-friendly error messages
        let errorMessage = 'Error posting job: ';
        
        if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
            errorMessage += 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.message.includes('Authentication') || error.message.includes('unauthorized')) {
            errorMessage += 'Authentication failed. Please log in again.';
        } else if (error.message.includes('Company')) {
            errorMessage += 'Company profile error. Please refresh the page and try again.';
        } else {
            errorMessage += error.message || 'An unexpected error occurred. Please try again.';
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        // Always reset submit button state
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Export the date formatting function for use in other files
if (typeof window !== 'undefined') {
    window.formatRealDate = formatRealDate;
    window.parseUniversalDate = parseUniversalDate;
}