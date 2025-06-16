// Check if user is authenticated when page loads
window.addEventListener("DOMContentLoaded", () => {
    const currentUser = apiClient.getCurrentUser();
    const userType = apiClient.getUserType();
    
  if (!currentUser) {
      console.warn('No authenticated user found. Redirecting to login...');
      window.location.href = 'login.html';
      return;
  }
  
  // If user already has a type, redirect to homepage
  if (userType) {
      console.log('User already has profile type:', userType);
      window.location.href = 'homepage.html';
      return;
  }

  // Show body with fade-in on load
  document.body.classList.remove("hidden");

  // Remove loading spinner after load
  const loadingElement = document.getElementById("load_bro");
  if (loadingElement) loadingElement.remove();

  // Province and City selection
  const provinceCityMap = {
    "DKI Jakarta": ["Jakarta"],
    "Jawa Barat": ["Bandung", "Bekasi", "Depok", "Bogor"],
    "Jawa Tengah": ["Semarang", "Surakarta", "Magelang"],
    "Jawa Timur": ["Surabaya", "Malang", "Kediri"],
    "Bali": ["Denpasar", "Ubud"]
  };

  const provinceSelect = document.getElementById("province");
  const citySelect = document.getElementById("city");

  if (provinceSelect && citySelect) {
    provinceSelect.addEventListener("change", () => {
      const cities = provinceCityMap[provinceSelect.value] || [];
      citySelect.innerHTML = cities.length
        ? `<option value="" disabled selected>Select City</option>`
        : `<option value="" disabled selected>No cities available</option>`;

      cities.forEach(city => {
        const opt = document.createElement("option");
        opt.textContent = city;
        opt.value = city;
        citySelect.appendChild(opt);
      });

      citySelect.disabled = !cities.length;
    });
  }

  // Role Selection Transitions
  let currentScreen = "first-role-selection";

  const screenOrder = [
    "first-role-selection",
    "employee-role-part-1",
    "company-role-part-1"
  ];

  function isForward(fromId, toId) {
    return screenOrder.indexOf(toId) > screenOrder.indexOf(fromId);
  }

  window.goTo = function (targetId) {
    if (targetId === currentScreen) return;

    const current = document.getElementById(currentScreen);
    const target = document.getElementById(targetId);
    if (!current || !target) return;

    const goingForward = isForward(currentScreen, targetId);

    // Clean up any existing animation classes
    const classes = [
      "animate-slideInLeft",
      "animate-slideInRight",
      "animate-slideOutLeft",
      "animate-slideOutRight"
    ];
    current.classList.remove(...classes);
    target.classList.remove(...classes);    // Show both temporarily
    current.classList.remove("hidden");
    target.classList.remove("hidden");
    current.classList.add(goingForward ? "animate-slideOutLeft" : "animate-slideOutRight");
    target.classList.add(goingForward ? "animate-slideInRight" : "animate-slideInLeft");

    setTimeout(() => {
      current.classList.add("hidden");
      currentScreen = targetId;
    }, 500);
  };

  // Initialize FormErrorHandler for employee form
  if (document.getElementById("employee-form")) {
    window.formErrorHandler = new FormErrorHandler();
  }
  
});

// Error handling for form input
class FormErrorHandler {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.setupFormValidation();
  }

  initializeElements() {
    // Company form fields
    this.companyForm = document.getElementById("company-form");
    this.companyName = document.getElementById("company-name");
    this.companyEmail = document.getElementById("company-email");
    this.companyFoundationDate = document.getElementById("company-foundation-date");
    this.companyHq = document.getElementById("company-hq");
    this.companyIndustry = document.getElementById("company-industry");
    this.companySize = document.getElementById("company-size");
    this.companyDescription = document.getElementById("company-description");
    // Employee form fields
    this.employeeForm = document.getElementById("employee-form");
    this.employeeFullName = document.getElementById("employee-full-name");
    this.employeeEmail = document.getElementById("employee-email"); 
    this.employeeBirthDate = document.getElementById("employee-birth-date");
    this.employeeCity = document.getElementById("employee-city");
    this.employeeIndustry = document.getElementById("employee-industry");
    this.employeeJobType = document.getElementById("employee-job-type");
    this.employeeStatus = document.getElementById("employee-employment-status");
  }

  attachEventListeners() {
    // Employee form submit
    if (this.employeeForm) {
      this.employeeForm.addEventListener("submit", (event) => {
        event.preventDefault();
        this.handleEmployeeRegistration(event);
      });
    }

    // Company form submit
    if (this.companyForm) {
      this.companyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        this.handleCompanyRegistration(event);
      });
    }

    // Real-time validation
    this.setupRealTimeValidation();
  }
  setupFormValidation() {
    // Add validation styling classes (similar to login.js)
    const style = document.createElement('style');
    style.textContent = `
      .field-error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 1px #ef4444 !important;
      }
      .field-success {
        border-color: #10b981 !important;
      }
      .error-message {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        color: #ef4444;
        font-size: 0.75rem;
        margin-top: 0.125rem;
        padding: 0.125rem 0.5rem;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 0.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        z-index: 10;
        animation: slideDown 0.2s ease-out;
      }
      .dark .error-message {
        background: rgba(31, 41, 55, 0.95);
        color: #f87171;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .form-field-container {
        position: relative;
      }
    `;
    document.head.appendChild(style);
  }

  setupRealTimeValidation() {
    // Full name validation
    if (this.employeeFullName) {
      this.employeeFullName.addEventListener('blur', () => this.validateName(this.employeeFullName));
      this.employeeFullName.addEventListener('input', () => this.clearFieldError(this.employeeFullName));
    }

    // Email validation
    if (this.employeeEmail) {
      this.employeeEmail.addEventListener('blur', () => this.validateEmail(this.employeeEmail));
      this.employeeEmail.addEventListener('input', () => this.clearFieldError(this.employeeEmail));
    }

    // Birth date validation
    if (this.employeeBirthDate) {
      this.employeeBirthDate.addEventListener('blur', () => this.validateBirthDate(this.employeeBirthDate));
      this.employeeBirthDate.addEventListener('input', () => this.clearFieldError(this.employeeBirthDate));
    }

    // City validation
    if (this.employeeCity) {
      this.employeeCity.addEventListener('blur', () => this.validateSelect(this.employeeCity, "Please select your city."));
      this.employeeCity.addEventListener('change', () => this.clearFieldError(this.employeeCity));
    }

    // Industry validation
    if (this.employeeIndustry) {
      this.employeeIndustry.addEventListener('blur', () => this.validateSelect(this.employeeIndustry, "Please select your industry."));
      this.employeeIndustry.addEventListener('change', () => this.clearFieldError(this.employeeIndustry));
    }

    // Job type validation
    if (this.employeeJobType) {
      this.employeeJobType.addEventListener('blur', () => this.validateSelect(this.employeeJobType, "Please select your job type."));
      this.employeeJobType.addEventListener('change', () => this.clearFieldError(this.employeeJobType));
    }

    // Employment status validation
    if (this.employeeStatus) {
      this.employeeStatus.addEventListener('blur', () => this.validateSelect(this.employeeStatus, "Please select your employment status."));
      this.employeeStatus.addEventListener('change', () => this.clearFieldError(this.employeeStatus));
    }
  }

  // Validation methods (similar to login.js)
  validateName(field) {
    const name = field.value.trim();
    
    if (!name) {
      this.showFieldError(field, 'Full name is required');
      return false;
    }
    
    if (name.length < 2) {
      this.showFieldError(field, 'Name must be at least 2 characters');
      return false;
    }
    
    this.showFieldSuccess(field);
    return true;
  }

  validateEmail(field) {
    const email = field.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      this.showFieldError(field, 'Email is required');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      this.showFieldError(field, 'Please enter a valid email address');
      return false;
    }
    
    this.showFieldSuccess(field);
    return true;
  }

  validateBirthDate(field) {
    const birthDate = field.value;
    
    if (!birthDate) {
      this.showFieldError(field, 'Birth date is required');
      return false;
    }

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 16) {
      this.showFieldError(field, 'You must be at least 16 years old');
      return false;
    }

    if (birth > today) {
      this.showFieldError(field, 'Bro wtf');
      return false;
    }
    
    this.showFieldSuccess(field);
    return true;
  }

  validateSelect(field, message) {
    const value = field.value;
    
    if (!value || value === "") {
      this.showFieldError(field, message);
      return false;
    }
    
    this.showFieldSuccess(field);
    return true;
  }

  // UI helper methods (similar to login.js)
  showFieldError(field, message) {
    field.classList.add('field-error');
    field.classList.remove('field-success');
    
    this.removeErrorMessage(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.setAttribute('data-error-for', field.id);
    
    field.parentNode.appendChild(errorDiv);
  }

  showFieldSuccess(field) {
    field.classList.remove('field-error');
    field.classList.add('field-success');
    this.removeErrorMessage(field);
  }

  clearFieldError(field) {
    field.classList.remove('field-error');
    field.classList.remove('field-success');
    this.removeErrorMessage(field);
  }

  removeErrorMessage(field) {
    const existingError = field.parentNode.querySelector(`[data-error-for="${field.id}"]`);
    if (existingError) {
      existingError.remove();
    }
  }

  showNotification(message, type = 'success') {
    // Create notification element (similar to login.js)
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
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
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Main form handler
  async handleEmployeeRegistration(event) {
    event.preventDefault();

    // Validate all fields
    let isValid = true;

    if (!this.validateName(this.employeeFullName)) isValid = false;
    if (!this.validateEmail(this.employeeEmail)) isValid = false;
    if (!this.validateBirthDate(this.employeeBirthDate)) isValid = false;
    if (!this.validateSelect(this.employeeCity, "Please select your city.")) isValid = false;
    if (!this.validateSelect(this.employeeIndustry, "Please select your industry.")) isValid = false;
    if (!this.validateSelect(this.employeeJobType, "Please select your job type.")) isValid = false;
    if (!this.validateSelect(this.employeeStatus, "Please select your employment status.")) isValid = false;

    if (!isValid) {
      this.showNotification('Please fix the errors above before continuing.', 'error');
      return;
    }

    // Show loading state
    const submitBtn = this.employeeForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating profile...';
    submitBtn.disabled = true;    // Get form data
    const fullName = this.employeeFullName.value.trim();
    const email = this.employeeEmail.value.trim();
    const birthDate = this.employeeBirthDate.value;
    const city = this.employeeCity.value;
    const industry = this.employeeIndustry.value;
    const jobType = this.employeeJobType.value;
    console.log('Selected job type:', jobType, 'Character codes:', [...jobType].map(c => c.charCodeAt(0)));
    const employmentStatus = this.employeeStatus.value;

    // Prepare employee data
    const employeeData = {
      fullName,
      email,
      birthDate,
      city,
      industry,
      jobType,
      employmentStatus
    };

    console.log('Preparing to create employee with data:', employeeData);
    console.log('Current user:', apiClient.getCurrentUser());

    try {
      const response = await apiClient.createEmployee(employeeData);

      if (response.success) {

        // Store user type in localStorage
        localStorage.setItem('user_type', 'employee');

        this.showNotification('Employee profile created successfully!', 'success');
          setTimeout(() => {
            window.location.href = 'homepage.html';
          }, 1500);
        } else {
          this.showNotification('Failed to create employee profile. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Employee registration error:', error);
        this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
      } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }

    async handleCompanyRegistration(event) {
      event.preventDefault();
      
      const submitBtn = this.companyForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Registering...';
      submitBtn.disabled = true;

      // Collect form data
      const companyData = {
          companyName: this.companyName.value.trim(),
          email: this.companyEmail.value.trim(),
          foundationDate: this.companyFoundationDate.value,
          hq: this.companyHq.value.trim(),
          industry: this.companyIndustry.value,
          companySize: parseInt(this.companySize.value, 10), // Ensure it's an integer
          description: this.companyDescription.value.trim() || "Please update your company description."
      };

      console.log('Company registration data:', companyData);
      console.log('Current user:', apiClient.getCurrentUser());

      // Validation
      let isValid = true;
      if (!companyData.companyName) {
          this.showNotification('Company name is required', 'error');
          isValid = false;
      }
      if (!companyData.email) {
          this.showNotification('Email is required', 'error');
          isValid = false;
      }
      if (!companyData.foundationDate) {
          this.showNotification('Foundation date is required', 'error');
          isValid = false;
      }
      if (!companyData.hq) {
          this.showNotification('HQ location is required', 'error');
          isValid = false;
      }
      if (!companyData.industry) {
          this.showNotification('Industry is required', 'error');
          isValid = false;
      }
      if (!companyData.companySize || isNaN(companyData.companySize) || companyData.companySize < 1) {
          this.showNotification('Valid company size is required (must be a positive number)', 'error');
          isValid = false;
      }

      if (!isValid) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          return;
      }

      try {
          console.log('Attempting to create company...');
          const response = await apiClient.createCompany(companyData);
          console.log('Company creation response:', response);

          if (response && response.success) {
              localStorage.setItem('user_type', 'company');
              this.showNotification('Company registered successfully!', 'success');
              setTimeout(() => {
                  window.location.href = 'homepage.html';
              }, 1500);
          } else {
              throw new Error(response?.message || 'Failed to register company');
          }
      } catch (error) {
          console.error('Company registration error:', error);
          
          // More detailed error handling
          if (error.message.includes('404')) {
              this.showNotification('Server endpoint not found. Please check if the backend is running on the correct port.', 'error');
          } else if (error.message.includes('User must be logged in')) {
              this.showNotification('Please login first before creating a company profile.', 'error');
              setTimeout(() => {
                  window.location.href = 'login.html';
              }, 2000);
          } else {
              this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
          }
      } finally {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
      }
    }
  }

