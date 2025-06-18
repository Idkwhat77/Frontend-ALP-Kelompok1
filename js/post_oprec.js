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
    "Kepulauan Bangka Belitung": ["Pangkal Pinang"],
    "Kepulauan Riau": ["Batam", "Tanjung Pinang"],
    "DKI Jakarta": ["Jakarta Barat", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu"],
    "Jawa Barat": ["Bandung", "Banjar", "Bekasi", "Bogor", "Cimahi", "Cirebon", "Depok", "Sukabumi", "Tasikmalaya"],
    "Jawa Tengah": ["Magelang", "Pekalongan", "Salatiga", "Semarang", "Surakarta", "Tegal"],
    "DI Yogyakarta": ["Yogyakarta"],
    "Jawa Timur": ["Batu", "Blitar", "Kediri", "Madiun", "Malang", "Mojokerto", "Pasuruan", "Probolinggo", "Surabaya"],
    "Banten": ["Cilegon", "Serang", "Tangerang", "Tangerang Selatan"],
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
    "Sulawesi Tenggara": ["Bau-Bau", "Kendari"],
    "Gorontalo": ["Gorontalo"],
    "Sulawesi Barat": ["Mamuju"],
    "Maluku": ["Ambon", "Tual"],
    "Maluku Utara": ["Ternate", "Tidore Kepulauan"],
    "Papua Barat": ["Manokwari", "Sorong"],
    "Papua": ["Jayapura"],
    "Papua Selatan": ["Merauke"],
    "Papua Tengah": ["Nabire"],
    "Papua Pegunungan": ["Jayawijaya"]
};

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
            alert('Please log in to post a job');
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is a company
        if (userType !== 'company') {
            alert('Only companies can post job openings. Please log in with a company account.');
            window.location.href = 'login.html';
            return;
        }
        
        // Load company profile to verify company exists
        await loadCompanyProfile();
        
        // Initialize form after successful authentication
        initializeJobPostingForm();
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        alert('Failed to verify authentication. Please try logging in again.');
        window.location.href = 'login.html';
    }
}

async function loadCompanyProfile() {
    try {
        const currentUser = window.apiClient.getCurrentUser();
        const response = await window.apiClient.getCompanyByUserId(currentUser.id);
        
        if (!response || !response.success || !response.company) {
            alert('Company profile not found. Please complete your company profile first.');
            window.location.href = 'company_profile.html';
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
        alert('Failed to load company profile. Please try again.');
        window.location.href = 'company_profile.html';
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
    
    try {
        // Verify company is still authenticated
        const currentUser = window.apiClient.getCurrentUser();
        const userType = window.apiClient.getUserType();
        
        if (!currentUser || userType !== 'company') {
            alert('Authentication expired. Please log in again.');
            window.location.href = 'login.html';
            return;
        }
        
        // Verify company profile exists
        if (!window.currentCompany) {
            alert('Company profile not found. Please refresh the page.');
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Posting Job...';
        submitBtn.disabled = true;
        
        // Get the HTML content from the rich text editor
        const jobDescriptionElement = document.getElementById('jobDescription');
        let jobDescription = jobDescriptionElement.textContent || jobDescriptionElement.innerText;
        
        // Remove placeholder text if present
        if (jobDescription === 'Describe the responsibilities and requirements of this position...') {
            jobDescription = '';
        }
        
        // Validate required fields
        if (!jobDescription.trim()) {
            alert('Job description is required.');
            return;
        }
        
        // Collect form data
        const formData = new FormData(e.target);
        
        // Get selected skills
        const skills = Array.from(document.querySelectorAll('#skillsContainer .skill-tag'))
            .map(tag => tag.textContent.replace('×', '').trim())
            .filter(skill => skill.length > 0);
        
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
            alert('Minimum salary cannot be greater than maximum salary.');
            return;
        }
        
        // Validate required fields
        const title = formData.get('jobTitle')?.trim();
        const type = formData.get('jobType');
        const experience = formData.get('experience');
        const deadline = formData.get('deadline');
        
        if (!title) {
            alert('Job title is required.');
            return;
        }
        
        if (!type) {
            alert('Job type is required.');
            return;
        }
        
        if (!experience) {
            alert('Experience level is required.');
            return;
        }
        
        // Create job posting object with company information
        const jobData = {
            title: title,
            type: type,
            province: formData.get('province') || null,
            city: formData.get('city') || null,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            experience: experience,
            description: jobDescription.trim(),
            skills: skills,
            benefits: benefits,
            deadline: deadline || null,
            hiringProcess: formData.get('hiringProcess') || null,
            applicationQuestions: formData.get('applicationQuestions')?.trim() || null
        };
        
        console.log('Submitting job data:', jobData);
        
        // Use API client for consistency
        const response = await window.apiClient.createJob(jobData);
        
        if (response && response.success) {
            alert('Job posted successfully!');
            window.location.href = 'oprec.html';
        } else {
            throw new Error(response?.message || 'Failed to post job');
        }
        
    } catch (error) {
        console.error('Error posting job:', error);
        alert('Error posting job: ' + error.message);
    } finally {
        // Reset submit button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}