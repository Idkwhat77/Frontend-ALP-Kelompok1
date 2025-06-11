/**
 * RuangKerja API Client
 * Frontend API communication layer for RuangKerja application
 */

class RuangKerjaAPI {
    constructor() {
        // Base API URL - Update this to match your backend server
        this.baseURL = 'http://localhost:8080/api/v1';
        
        // Default headers
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Get authentication token from localStorage
     */
    getAuthToken() {
        return localStorage.getItem('authToken');
    }

    /**
     * Set authentication token in localStorage
     */
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
    }

    /**
     * Remove authentication token from localStorage
     */
    removeAuthToken() {
        localStorage.removeItem('authToken');
    }

    /**
     * Get headers with authentication if available
     */
    getHeaders(includeAuth = true) {
        const headers = { ...this.defaultHeaders };
        
        if (includeAuth) {
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    /**
     * Generic API request method
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getHeaders(options.includeAuth !== false),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return {
                success: true,
                data: data,
                status: response.status
            };
        } catch (error) {
            console.error('API Request Error:', error);
            return {
                success: false,
                error: error.message,
                status: error.status || 500
            };
        }
    }

    /**
     * Authentication Methods
     */

    /**
     * User login
     */
    async login(email, password) {
        const response = await this.makeRequest('/auth/login', {
            method: 'POST',
            includeAuth: false,
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        // If login successful, store user data
        if (response.success && response.data.success) {
            if (response.data.token) {
                this.setAuthToken(response.data.token);
            }
            
            // Store user data
            if (response.data.user) {
                localStorage.setItem('userData', JSON.stringify(response.data.user));
            }
        }

        return response;
    }

    /**
     * User registration
     */
    async register(userData) {
        const response = await this.makeRequest('/auth/register', {
            method: 'POST',
            includeAuth: false,
            body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                confirmPassword: userData.confirmPassword,
                phone: userData.phone || null
            })
        });

        // If registration successful, store user data
        if (response.success && response.data.success) {
            if (response.data.token) {
                this.setAuthToken(response.data.token);
            }
            
            if (response.data.user) {
                localStorage.setItem('userData', JSON.stringify(response.data.user));
            }
        }

        return response;
    }

    /**
     * User logout
     */
    async logout() {
        try {
            // Call logout endpoint if available
            await this.makeRequest('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local storage
            this.removeAuthToken();
            localStorage.removeItem('userData');
        }
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        const token = this.getAuthToken();
        if (!token) {
            return { success: false, error: 'No token found' };
        }

        return await this.makeRequest('/auth/verify', {
            method: 'GET'
        });
    }

    /**
     * User Profile Methods
     */

    /**
     * Get current user profile
     */
    async getProfile() {
        return await this.makeRequest('/user/profile');
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        return await this.makeRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    /**
     * Image Upload Methods
     */

    /**
     * Upload profile image
     */    async uploadProfileImage(userId, imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        return await this.makeRequest(`/user/profile/${userId}/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
                // Don't set Content-Type, let browser set it for FormData
            },
            body: formData
        });
    }    /**
     * Delete profile image
     */
    async deleteProfileImage(userId) {
        return await this.makeRequest(`/user/profile/${userId}/image`, {
            method: 'DELETE'
        });
    }

    /**
     * Company/Job Related Methods (Future expansion)
     */

    /**
     * Get jobs
     */
    async getJobs(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams ? `/jobs?${queryParams}` : '/jobs';
        return await this.makeRequest(endpoint);
    }

    /**
     * Get companies
     */
    async getCompanies(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = queryParams ? `/companies?${queryParams}` : '/companies';
        return await this.makeRequest(endpoint);
    }

    /**
     * Utility Methods
     */

    /**
     * Health check
     */
    async healthCheck() {
        return await this.makeRequest('/health', {
            includeAuth: false
        });
    }

    /**
     * Get stored user data
     */
    getUserData() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getAuthToken();
    }
}

// Create and export the global instance immediately when script loads
(function() {
    'use strict';
    
    console.log('Creating RuangKerjaAPI instance...');
    
    const api = new RuangKerjaAPI();
    
    // Make it globally available
    if (typeof window !== 'undefined') {
        window.RuangKerjaAPI = api;
        console.log('RuangKerjaAPI instance created and attached to window:', window.RuangKerjaAPI);
        console.log('Available methods:', Object.getOwnPropertyNames(RuangKerjaAPI.prototype));
    }
    
    // Also make it available as a module export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})();

// Usage Examples (for development/testing):
/*

// Login example
api.login('user@example.com', 'password123')
    .then(response => {
        if (response.success) {
            console.log('Login successful:', response.data);
            // Redirect to dashboard
        } else {
            console.error('Login failed:', response.error);
            // Show error message
        }
    });

// Registration example
api.register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123',
    phone: '+1234567890'
})
.then(response => {
    if (response.success) {
        console.log('Registration successful:', response.data);
    } else {
        console.error('Registration failed:', response.error);
    }
});

// Profile image upload example
const fileInput = document.getElementById('profile-image-input');
fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const response = await api.uploadProfileImage(file);
        if (response.success) {
            console.log('Image uploaded successfully:', response.data);
            // Update UI with new image URL
        } else {
            console.error('Image upload failed:', response.error);
        }
    }
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (api.isAuthenticated()) {
        const authCheck = await api.checkAuth();
        if (!authCheck.success) {
            // Token is invalid, redirect to login
            api.removeAuthToken();
            window.location.href = '/login.html';
        }
    }
});

*/
