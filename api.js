/**
 * API Configuration and Base Setup
 * This file handles all API communication with the backend
 * Simplified version without JWT authentication
 */

class ApiClient {    
    constructor() {
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
            
            // Check if response has content before trying to parse JSON
            const contentType = response.headers.get('content-type');
            const hasJsonContent = contentType && contentType.includes('application/json');
            
            let data = null;
            
            if (hasJsonContent) {
                const text = await response.text();
                if (text) {
                    data = JSON.parse(text);
                }
            }

            if (!response.ok) {
                throw new Error(data?.message || `HTTP error! status: ${response.status}`);
            }

            // Return appropriate response based on content
            if (data) {
                return data;
            } else {
                // For successful requests without JSON content (like DELETE operations)
                return { success: true, status: response.status };
            }
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

        // Updated endpoint to match your controller
        return this.makeRequest(`/candidates/user/${userId}`, {
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

    // Profile management methods - UPDATED FOR CANDIDATES
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

    // UPDATED: Profile image upload using candidate endpoint with user ID
    async uploadProfileImage(userId, formData) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Ensure userId is provided
        if (!userId) {
            throw new Error('User ID is required for image upload');
        }
        console.log('uploadProfileImage: Current user:', user);
        console.log('uploadProfileImage: User ID:', userId);
        
        // Updated to use candidate endpoint with user ID
        const url = `${this.baseURL}/candidates/upload-image/user/${userId}`;
        
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

    // UPDATED: Profile image delete using candidate endpoint with user ID
    async deleteProfileImage(userId) {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Updated to use candidate endpoint with user ID
        const url = `${this.baseURL}/candidates/delete-image/user/${userId}`;
        
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

    // Additional candidate methods
    async getAllCandidates() {
        return this.makeRequest('/candidates/all', {
            method: 'GET'
        });
    }

    async getCandidateById(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}`, {
            method: 'GET'
        });
    }

    async updateCandidate(candidateId, candidateData) {
        return this.makeRequest(`/candidates/${candidateId}`, {
            method: 'PUT',
            body: JSON.stringify(candidateData)
        });
    }

    async deleteCandidate(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}`, {
            method: 'DELETE'
        });
    }
    
    // Education API methods
    async createEducation(candidateId, educationData) {
        return this.makeRequest(`/candidates/${candidateId}/education`, {
            method: 'POST',
            body: JSON.stringify(educationData)
        });
    }

    async getEducationByCandidate(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/education`, {
            method: 'GET'
        });
    }

    async getEducationById(educationId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/education/${educationId}`, {
            method: 'GET'
        });
    }

    async updateEducation(educationId, educationData, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/education/${educationId}`, {
            method: 'PUT',
            body: JSON.stringify(educationData)
        });
    }

    async deleteEducation(educationId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/education/${educationId}`, {
            method: 'DELETE'
        });
    }

    async getAllEducation(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/education/`, {
            method: 'GET'
        });
    }

    // Hobby API methods
    async createHobby(candidateId, hobbyData) {
        return this.makeRequest(`/candidates/${candidateId}/hobbies`, {
            method: 'POST',
            body: JSON.stringify(hobbyData)
        });
    }

    async getAllHobbies(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/hobbies`, {
            method: 'GET'
        });
    }

    async getHobbyById(hobbyId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/hobbies/${hobbyId}`, {
            method: 'GET'
        });
    }

    async updateHobby(hobbyId, hobbyData, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/hobbies/${hobbyId}`, {
            method: 'PUT',
            body: JSON.stringify(hobbyData)
        });
    }

    async deleteHobby(hobbyId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/hobbies/${hobbyId}`, {
            method: 'DELETE'
        });
    }

    // Experience API methods
    async createExperience(candidateId, experienceData) {
        return this.makeRequest(`/candidates/${candidateId}/experiences`, {
            method: 'POST',
            body: JSON.stringify(experienceData)
        });
    }

    async getExperienceByCandidate(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/experiences`, {
            method: 'GET'
        });
    }

    async getExperienceById(experienceId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/experiences/${experienceId}`, {
            method: 'GET'
        });
    }

    async updateExperience(experienceId, experienceData, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/experiences/${experienceId}`, {
            method: 'PUT',
            body: JSON.stringify(experienceData)
        });
    }

    async deleteExperience(experienceId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/experiences/${experienceId}`, {
            method: 'DELETE'
        });
    }

    async getAllExperience(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/experiences/`, {
            method: 'GET'
        });
    }
}

// Create and export API client instance
const apiClient = new ApiClient();

// Make it globally available
window.apiClient = apiClient;