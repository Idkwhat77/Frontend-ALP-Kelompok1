/**
 * API Configuration and Base Setup
 * This file handles all API communication with the backend
 * Simplified version without JWT authentication
 */

class ApiClient {    constructor() {
        this.baseURL = 'http://localhost:8080/api';
        this.currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');
    }

    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('current_user');
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser || JSON.parse(localStorage.getItem('current_user') || 'null');
    }

    // Clear user data and logout
    clearCurrentUser() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
    }

    // Generic API request method
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        const response = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        return response;
    }

    async login(credentials) {
        const response = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        // Store user data if login successful
        if (response.success && response.user) {
            this.setCurrentUser(response.user);
        }

        return response;
    }

    async getUserById(userId) {
        return this.makeRequest(`/auth/me?userId=${userId}`);
    }

    async getCandidateByUserId(userId) {
        // Ensure user is authenticated
        const user = this.getCurrentUser();
        console.log('getCandidateByUserId: Current user:', user);
        if (!user || !user.id) {
            throw new Error('User must be logged in to fetch candidate data. Please login first.');
        }
        console.log('getCandidateByUserId: Fetching candidate for user ID:', userId);

        // Fetch candidate data by user ID
        return this.makeRequest(`/candidates/by-user/${userId}`, {
            method: 'GET'
        });
    }

    async createEmployee(employeeData) {
        // Ensure user is authenticated and get user ID from localStorage
        const user = this.getCurrentUser();
        console.log('createEmployee: Current user:', user);
        
        if (!user || !user.id) {
            throw new Error('User must be logged in to create employee profile. Please login first.');
        }

        // Don't add user_id to the body - it's passed in the header
        console.log('createEmployee: Data being sent to API:', employeeData);

        const response = await this.makeRequest(`/candidates/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id
            },
            body: JSON.stringify(employeeData) // Remove user_id from here
        });
        
        console.log('createEmployee: API response:', response);
        return response;
    }

    // Logout method
    logout() {
        this.clearCurrentUser();
        // Optionally redirect to login page
        window.location.href = 'login.html';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    // Profile management methods (simplified)
    async updateProfile(userData) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        return this.makeRequest(`/v1/user/profile/${user.id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async uploadProfileImage(userId, formData) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const url = `${this.baseURL}/v1/user/upload-image/${userId}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData // Don't set Content-Type for FormData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    async deleteProfileImage(userId) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const url = `${this.baseURL}/v1/user/delete-image/${userId}`;
        
        try {
            const response = await fetch(url, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Image delete failed:', error);
            throw error;
        }
    }
}

// Create and export API client instance
const apiClient = new ApiClient();

// Make it globally available
window.apiClient = apiClient;
