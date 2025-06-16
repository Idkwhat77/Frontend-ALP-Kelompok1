/**
 * Login/Register Form Controller
 * Handles all form interactions and validation
 * Connects the UI to the API layer
 */

class AuthFormController {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.setupFormValidation();
    }

    initializeElements() {
        // Forms
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');

        // Login form fields
        this.loginEmailField = document.getElementById('login-email');
        this.loginPasswordField = document.getElementById('login-password');

        // Register form fields
        this.registerEmailField = document.getElementById('register-email');
        this.registerPasswordField = document.getElementById('register-password');
        this.registerConfirmField = document.getElementById('register-confirm');

        // Form switching buttons
        this.showRegisterBtn = document.getElementById('show-register');
        this.showLoginBtn = document.getElementById('show-login');

        // Form containers
        this.loginFormContainer = document.getElementById('login-form');
        this.registerFormContainer = document.getElementById('register-form');
    }

    attachEventListeners() {
        // Form submissions
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Form switching
        if (this.showRegisterBtn) {
            this.showRegisterBtn.addEventListener('click', () => this.switchToRegister());
        }

        if (this.showLoginBtn) {
            this.showLoginBtn.addEventListener('click', () => this.switchToLogin());
        }

        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Email validation for both forms
        const emailFields = [this.loginEmailField, this.registerEmailField];
        emailFields.forEach(field => {
            if (field) {
                field.addEventListener('blur', () => this.validateEmail(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            }
        });

        // Password validation
        if (this.registerPasswordField) {
            this.registerPasswordField.addEventListener('blur', () => this.validatePassword(this.registerPasswordField));
            this.registerPasswordField.addEventListener('input', () => this.clearFieldError(this.registerPasswordField));
        }

        // Confirm password validation
        if (this.registerConfirmField) {
            this.registerConfirmField.addEventListener('blur', () => this.validatePasswordConfirm());
            this.registerConfirmField.addEventListener('input', () => this.clearFieldError(this.registerConfirmField));
        }
    }

    setupFormValidation() {
        // Add validation styling classes
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
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: block;
            }
        `;
        document.head.appendChild(style);
    }

    // Validation methods
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

    validatePassword(field) {
        const password = field.value;
        
        if (!password) {
            this.showFieldError(field, 'Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError(field, 'Password must be at least 6 characters');
            return false;
        }
        
        // Check for at least one number (as per backend validation)
        if (!/\d/.test(password)) {
            this.showFieldError(field, 'Password must contain at least one number');
            return false;
        }
        
        this.showFieldSuccess(field);
        return true;
    }

    validatePasswordConfirm() {
        const password = this.registerPasswordField.value;
        const confirm = this.registerConfirmField.value;
        
        if (!confirm) {
            this.showFieldError(this.registerConfirmField, 'Please confirm your password');
            return false;
        }
        
        if (password !== confirm) {
            this.showFieldError(this.registerConfirmField, 'Passwords do not match');
            return false;
        }
        
        this.showFieldSuccess(this.registerConfirmField);
        return true;
    }

    // UI helper methods
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
        // Create notification element
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

    // Form switching animations
    switchToRegister() {
        this.loginFormContainer.classList.add('opacity-0', 'form-hidden');
        this.loginFormContainer.classList.remove('form-active');
        
        setTimeout(() => {
            this.loginFormContainer.classList.add('rotate-y-180');
            this.registerFormContainer.classList.remove('rotate-y-180', 'opacity-0', 'form-hidden');
            this.registerFormContainer.classList.add('form-active');
        }, 300);
    }

    switchToLogin() {
        this.registerFormContainer.classList.add('opacity-0', 'form-hidden');
        this.registerFormContainer.classList.remove('form-active');
        
        setTimeout(() => {
            this.registerFormContainer.classList.add('rotate-y-180');
            this.loginFormContainer.classList.remove('rotate-y-180', 'opacity-0', 'form-hidden');
            this.loginFormContainer.classList.add('form-active');
        }, 300);
    }

    // Main event handlers
    async handleLogin(event) {
        event.preventDefault();

        // Get form data
        const identifier = this.loginEmailField.value.trim();
        const password = this.loginPasswordField.value;

        // Validate fields
        let isValid = true;
        
        if (!identifier) {
            this.showFieldError(this.loginEmailField, 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(this.loginEmailField)) {
            isValid = false;
        }

        if (!password) {
            this.showFieldError(this.loginPasswordField, 'Password is required');
            isValid = false;
        }

        if (!isValid) return;

        // Show loading state
        const submitBtn = this.loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        try {
        const response = await apiClient.login({
            identifier: identifier,
            password: password
        });

        if (response.success && response.user) {
            // After successful login, check what type of profile exists
            try {
                const candidateResponse = await apiClient.getCandidateByUserId(response.user.id);
                if (candidateResponse && candidateResponse.candidate) {
                    apiClient.setCurrentUser(response.user, 'employee');
                    this.showNotification('Login successful! Redirecting...', 'success');
                
                    // Redirect to homepage or dashboard
                    setTimeout(() => {
                        window.location.href = 'homepage.html';
                    }, 1000);
                    return;
                }
            } catch (error) {
                // No candidate profile found, check for company
            }

            try {
                const companyResponse = await apiClient.getCompanyByUserId(response.user.id);
                if (companyResponse && companyResponse.company) {
                    apiClient.setCurrentUser(response.user, 'company');
                    window.location.href = 'homepage.html';
                    return;
                }
            } catch (error) {
                // No company profile found
            }

            // No profile found, redirect to role selection
            apiClient.setCurrentUser(response.user);
            window.location.href = 'chooserole.html';
        }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(event) {
        event.preventDefault();        
        // Get form data
        const email = this.registerEmailField.value.trim();
        const password = this.registerPasswordField.value;

        // Validate all fields
        let isValid = true;

        if (!this.validateEmail(this.registerEmailField)) isValid = false;
        if (!this.validatePassword(this.registerPasswordField)) isValid = false;
        if (!this.validatePasswordConfirm()) isValid = false;

        if (!isValid) return;

        // Show loading state
        const submitBtn = this.registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;        try {
            const response = await apiClient.register({
                email: email,
                password: password
            });

            if (response.success) {
                // If registration returns user data, store it (auto-login after registration)
                if (response.user) {
                    apiClient.setCurrentUser(response.user);
                    this.showNotification('Registration successful! Redirecting to profile setup...', 'success');
                } else {
                    this.showNotification('Registration successful! Please login with your credentials.', 'success');
                }
                
                // Clear form and redirect
                this.registerForm.reset();
                setTimeout(() => {
                    window.location.href = 'chooserole.html';
                }, 1000);
            } else {
                throw new Error(response.message || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the login page
    if (document.getElementById('loginForm') || document.getElementById('registerForm')) {
        window.authController = new AuthFormController();
    }
});

// Auto-redirect if already authenticated
if (typeof apiClient !== 'undefined' && apiClient.isAuthenticated()) {
    window.location.href = 'homepage.html';
}