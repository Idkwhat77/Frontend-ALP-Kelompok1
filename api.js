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
            if (userType) {
                localStorage.setItem('user_type', userType);
            }
        } else {
            localStorage.removeItem('current_user');
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser || JSON.parse(localStorage.getItem('current_user') || 'null');
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

    // Set current user with type
    setCurrentUser(user, userType = null) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('current_user', JSON.stringify(user));
            if (userType) {
                localStorage.setItem('user_type', userType);
            }
        } else {
            localStorage.removeItem('current_user');
            localStorage.removeItem('user_type');
        }
    }

    // Get user type
    getUserType() {
        return localStorage.getItem('user_type');
    }

    // Clear user data and logout
    clearCurrentUser() {
        this.currentUser = null;
        localStorage.removeItem('current_user');
        localStorage.removeItem('user_type');
    }

    // Check if user is employee
    isEmployee() {
        return this.getUserType() === 'employee';
    }

    // Check if user is company
    isCompany() {
        return this.getUserType() === 'company';
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

    async createCompany(companyData) {
        const user = this.getCurrentUser();
        console.log('createCompany: Current user:', user);

        if (!user || !user.id) {
            throw new Error('User must be logged in to create company profile. Please login first.');
        }

        // Don't add user_id to the body - it's passed in the header
        console.log('createCompany: Data being sent to API:', companyData);
        
        // Make sure we're using the correct endpoint path
        const response = await this.makeRequest('/company', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id.toString() // Ensure it's a string
            },
            body: JSON.stringify(companyData)
        });
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

    // Skills API methods
    async createSkill(candidateId, skillData) {
        return this.makeRequest(`/candidates/${candidateId}/skills`, {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
    }

    async getCandidateSkills(candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/skills`, {
            method: 'GET'
        });
    }

    async getSkillById(skillId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/skills/${skillId}`, {
            method: 'GET'
        });
    }

    async updateSkill(skillId, skillData, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/skills/${skillId}`, {
            method: 'PUT',
            body: JSON.stringify(skillData)
        });
    }

    async deleteSkill(skillId, candidateId) {
        return this.makeRequest(`/candidates/${candidateId}/skills/${skillId}`, {
            method: 'DELETE'
        });
    }

    async getAllSkills() {
        return this.makeRequest('/candidates/1/skills/all', {
            method: 'GET'
        });
    }

    async getCompanyByUserId(userId) {
        // Adjust the endpoint if your backend uses a different route
        return this.makeRequest(`/company/user/${userId}`, {
            method: 'GET'
        });
    }

    async getCompanyById(companyId) {
        return this.makeRequest(`/company/${companyId}`, {
            method: 'GET'
        });
    }

    async updateCompany(companyId, companyData) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to update company profile');
        }

        // Handle company size conversion
        let processedData = { ...companyData };
        if (processedData.companySize && typeof processedData.companySize === 'string') {
            // Extract number from size range like "1-10" -> 10, "1000+" -> 1000
            const sizeMatch = processedData.companySize.match(/(\d+)/);
            if (sizeMatch) {
                processedData.companySize = parseInt(sizeMatch[1], 10);
            }
        }

        return this.makeRequest(`/company/${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id
            },
            body: JSON.stringify(processedData)
        });
    }

    async uploadCompanyImage(companyId, formData) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to upload image');
        }

        const url = `${this.baseURL}/company/upload-image/${companyId}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-User-Id': user.id
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('Company image upload failed:', error);
            throw error;
        }
    }

    async deleteCompanyImage(companyId) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to delete image');
        }

        return this.makeRequest(`/company/delete-image/${companyId}`, {
            method: 'DELETE',
            headers: {
                'X-User-Id': user.id
            }
        });
    }

    async updateCompanyDescription(companyId, description) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to update description');
        }

        return this.makeRequest(`/company/${companyId}/description`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id
            },
            body: JSON.stringify({ description })
        });
    }

    async deleteCompany(companyId) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to delete company');
        }

        return this.makeRequest(`/company/${companyId}`, {
            method: 'DELETE',
            headers: {
                'X-User-Id': user.id
            }
        });
    }

    async getAllCompanies() {
        return this.makeRequest('/company', {
            method: 'GET'
        });
    }

    // Chat API methods
    async getUserConversations(userId) {
        return this.makeRequest(`/chat/conversations/${userId}`, {
            method: 'GET'
        });
    }

    async getMessagesBetweenUsers(user1Id, user2Id, page = 0, size = 20) {
        return this.makeRequest(`/chat/messages/${user1Id}/${user2Id}?page=${page}&size=${size}`, {
            method: 'GET'
        });
    }

    async sendMessage(messageData) {
        return this.makeRequest('/chat/send', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    async markMessagesAsRead(senderId, receiverId) {
        return this.makeRequest(`/chat/mark-read/${senderId}/${receiverId}`, {
            method: 'PUT'
        });
    }

    // Social Media endpoints
    async getCandidateSocials(candidateId) {
        try {
            return await this.makeRequest(`/candidates/${candidateId}/socials`, {
                method: 'GET'
            });
        } catch (error) {
            console.error('Error fetching candidate socials:', error);
            // Return empty response structure on error
            return {
                success: false,
                socials: [],
                message: 'Failed to fetch social media links'
            };
        }
    }

    async addCandidateSocial(socialData) {
        return this.makeRequest('/candidates/socials', {
            method: 'POST',
            body: JSON.stringify(socialData)
        });
    }

    async updateCandidateSocial(socialId, socialData) {
        return this.makeRequest(`/candidates/socials/${socialId}`, {
            method: 'PUT',
            body: JSON.stringify(socialData)
        });
    }

    async deleteCandidateSocial(socialId) {
        return this.makeRequest(`/candidates/socials/${socialId}`, {
            method: 'DELETE'
        });
    }

    // Portfolio endpoints
    async getCandidatePortfolio(candidateId) {
        try {
            return await this.makeRequest(`/candidates/${candidateId}/portfolio`, {
                method: 'GET'
            });
        } catch (error) {
            console.error('Error fetching candidate portfolio:', error);
            return {
                success: false,
                portfolio: [],
                message: 'Failed to fetch portfolio items'
            };
        }
    }

    async addCandidatePortfolio(portfolioData) {
        return this.makeRequest('/candidates/portfolio', {
            method: 'POST',
            body: JSON.stringify(portfolioData)
        });
    }

    async updateCandidatePortfolio(portfolioId, portfolioData) {
        return this.makeRequest(`/candidates/portfolio/${portfolioId}`, {
            method: 'PUT',
            body: JSON.stringify(portfolioData)
        });
    }

    async deleteCandidatePortfolio(portfolioId) {
        return this.makeRequest(`/candidates/portfolio/${portfolioId}`, {
            method: 'DELETE'
        });
    }

    async uploadPortfolioImage(portfolioId, formData) {
        return this.makeRequest(`/candidates/portfolio/${portfolioId}/upload-image`, {
            method: 'POST',
            body: formData
        });
    }

    async deletePortfolioImage(portfolioId) {
        return this.makeRequest(`/candidates/portfolio/${portfolioId}/delete-image`, {
            method: 'DELETE'
        });
    }    // Company employees API methods - UPDATED TO MATCH BACKEND CONTROLLER
    async getCompanyEmployees(companyId) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to get company employees');
        }

        try {
            const response = await this.makeRequest(`/company/${companyId}/employees`, {
                method: 'GET',
                headers: {
                    'X-User-Id': user.id
                }
            });
            
            // Ensure consistent response structure
            if (response && response.success) {
                return {
                    success: true,
                    employees: response.employees || []
                };
            } else {
                return {
                    success: false,
                    employees: [],
                    message: response?.message || 'Failed to fetch employees'
                };
            }
        } catch (error) {
            console.error('Error fetching company employees:', error);
            return {
                success: false,
                employees: [],
                message: error.message || 'Failed to fetch employees'
            };
        }
    }

    async addEmployeeToCompany(companyId, employeeData) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to add employee');
        }

        return this.makeRequest(`/company/${companyId}/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id
            },
            body: JSON.stringify(employeeData)
        });
    }

    async removeEmployeeFromCompany(companyId, candidateId) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to remove employee');
        }

        return this.makeRequest(`/company/${companyId}/employees/${candidateId}`, {
            method: 'DELETE',
            headers: {
                'X-User-Id': user.id
            }
        });
    }

    // Job API methods
    async createJob(jobData) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to create jobs');
        }

        return this.makeRequest('/jobs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id
            },
            body: JSON.stringify(jobData)
        });
    }

    async getJobById(jobId) {
        return this.makeRequest(`/jobs/${jobId}`, {
            method: 'GET'
        });
    }

    async updateJob(jobId, jobData) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to update jobs');
        }

        return this.makeRequest(`/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': user.id
            },
            body: JSON.stringify(jobData)
        });
    }

    // Job deletion API method
    async deleteJob(jobId) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to delete jobs');
        }

        try {
            const response = await this.makeRequest(`/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': user.id
                }
            });
            
            return {
                success: response.success || false,
                message: response.message || 'Job deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting job:', error);
            return {
                success: false,
                message: error.message || 'Failed to delete job'
            };
        }
    }

    // Company rating deletion
    async deleteCompanyRating(companyId, ratingId) {
        const user = this.getCurrentUser();
        if (!user || !user.id) {
            throw new Error('User must be logged in to delete reviews');
        }

        return this.makeRequest(`/companies/${companyId}/ratings/${ratingId}`, {
            method: 'DELETE',
            headers: {
                'X-User-Id': user.id
            }
        });
    }
}

// Create and export API client instance
const apiClient = new ApiClient();

// Make it globally available
window.apiClient = apiClient;