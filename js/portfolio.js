class PortfolioManager {
    constructor() {
        this.currentUserId = null;
        this.portfolio = [];
        this.isEditing = false;
        this.currentPortfolioId = null;
        this.selectedImageFile = null;
        this.init();
    }

    init() {
        const portfolioForm = document.getElementById('portfolio-form');
        if (portfolioForm) {
            portfolioForm.addEventListener('submit', (e) => this.handleSubmitPortfolio(e));
        }

        // Initialize image upload functionality
        this.initImageUpload();

        // Initialize for the logged-in user
        this.initializeForCurrentUser();
    }

    initImageUpload() {
        const uploadArea = document.getElementById('portfolio-upload-area');
        const fileInput = document.getElementById('portfolio-image-input');
        const uploadBtn = document.getElementById('portfolio-upload-btn');
        const deleteImageBtn = document.getElementById('portfolio-delete-image-btn');

        if (!uploadArea || !fileInput || !uploadBtn || !deleteImageBtn) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlightDropArea(uploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlightDropArea(uploadArea), false);
        });

        // Handle dropped files
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageSelect(e.target.files[0]);
            }
        });

        // Upload button handler
        uploadBtn.addEventListener('click', () => this.uploadPortfolioImage());

        // Delete image button handler
        deleteImageBtn.addEventListener('click', () => this.deletePortfolioImage());
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlightDropArea(uploadArea) {
        uploadArea.classList.add('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
    }

    unhighlightDropArea(uploadArea) {
        uploadArea.classList.remove('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            this.handleImageSelect(files[0]);
        }
    }

    handleImageSelect(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select an image file', 'error');
            return;
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('File size must be less than 5MB', 'error');
            return;
        }
        
        this.selectedImageFile = file;
        const uploadBtn = document.getElementById('portfolio-upload-btn');
        const actionsDiv = document.getElementById('portfolio-image-actions');
        
        // Always enable upload button when file is selected
        if (uploadBtn) uploadBtn.disabled = false;
        if (actionsDiv) actionsDiv.classList.remove('hidden');
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('portfolio-image-preview');
            if (preview) {
                const previewText = window.currentLanguage === 'id' ? 'Pratinjau' : 'Preview';
                const fileInfoText = window.currentLanguage === 'id' ? 'KB' : 'KB';
                
                preview.innerHTML = `
                    <div class="text-center">
                        <img src="${e.target.result}" class="max-w-32 max-h-32 mx-auto rounded-lg mb-2 object-cover" alt="${previewText}" data-i18n-alt="image.preview">
                        <p class="text-sm text-gray-600 dark:text-gray-400">${file.name} (${(file.size / 1024).toFixed(1)} ${fileInfoText})</p>
                    </div>
                `;
            }
        };
        reader.readAsDataURL(file);
        
        // Update upload area
        const uploadContent = document.getElementById('portfolio-upload-content');
        if (uploadContent) {
            uploadContent.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5" class="mx-auto mb-4">
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <p class="text-green-600 dark:text-green-400 mb-2"><strong>File selected:</strong> ${file.name}</p>
                <p class="text-gray-500 dark:text-gray-400 text-sm">Click upload to save</p>
            `;
        }
    }

    async uploadPortfolioImage() {
        if (!this.selectedImageFile) {
            this.showMessage('Please select an image file first', 'error');
            return;
        }

        // Auto-save portfolio if not editing
        if (!this.isEditing) {
            try {
                await this.createPortfolioForImageUpload();
            } catch (error) {
                return; // Error already handled in createPortfolioForImageUpload
            }
        }

        if (!this.currentPortfolioId) {
            this.showMessage('No portfolio item selected for image upload', 'error');
            return;
        }

        const uploadBtn = document.getElementById('portfolio-upload-btn');
        const originalText = uploadBtn ? uploadBtn.textContent : '';
        
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';
        }

        try {
            console.log('Starting portfolio image upload...');
            console.log('Portfolio ID:', this.currentPortfolioId);
            console.log('File:', this.selectedImageFile.name, 'Size:', this.selectedImageFile.size, 'Type:', this.selectedImageFile.type);

            const formData = new FormData();
            formData.append('image', this.selectedImageFile);

            const response = await fetch(`http://localhost:8080/api/candidates/portfolio/${this.currentPortfolioId}/upload-image`, {
                method: 'POST',
                body: formData
            });

            console.log('Upload response status:', response.status);

            let responseData;
            try {
                responseData = await response.json();
                console.log('Upload response data:', responseData);
            } catch (jsonError) {
                console.error('Failed to parse response as JSON:', jsonError);
                throw new Error('Server returned invalid response format');
            }

            if (response.ok && responseData.success) {
                this.showMessage('Image uploaded successfully!', 'success');
                
                // CRITICAL FIX: Update the portfolio item immediately in memory
                const portfolioIndex = this.portfolio.findIndex(p => p.id === this.currentPortfolioId);
                if (portfolioIndex !== -1) {
                    this.portfolio[portfolioIndex].imageUrl = responseData.imageUrl;
                    console.log('Updated portfolio item in memory:', this.portfolio[portfolioIndex]);
                } else {
                    // If not found in array, add the updated portfolio item
                    if (responseData.portfolio) {
                        this.portfolio.push(responseData.portfolio);
                        console.log('Added new portfolio item to array:', responseData.portfolio);
                    }
                }
                
                // Clear manual URL input
                const urlInput = document.getElementById('portfolio-image-url');
                if (urlInput) urlInput.value = '';
                
                // IMMEDIATE REFRESH: Update all displays immediately
                this.displayPortfolio();
                this.displayPortfolioInModal();
                
                // FORCE REFRESH: Also reload from server to ensure consistency
                setTimeout(async () => {
                    await this.loadPortfolio();
                    this.displayPortfolio();
                    this.displayPortfolioInModal();
                    console.log('Portfolio refreshed from server');
                }, 500);
                
                this.resetImageUpload();
            } else {
                // Handle detailed error response
                let errorMessage = 'Failed to upload image';
                
                if (responseData) {
                    if (responseData.errorType && responseData.message) {
                        errorMessage = `${responseData.errorType}: ${responseData.message}`;
                        
                        // User-friendly error messages based on error type
                        switch (responseData.errorType) {
                            case 'FILE_TOO_LARGE':
                                errorMessage = 'File is too large. Please choose an image smaller than 5MB.';
                                break;
                            case 'INVALID_FILE_TYPE':
                                errorMessage = 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images only.';
                                break;
                            case 'PORTFOLIO_NOT_FOUND':
                                errorMessage = 'Portfolio item not found. Please refresh the page and try again.';
                                break;
                            case 'FILE_ACCESS_DENIED':
                                errorMessage = 'Server permission error. Please contact administrator.';
                                break;
                            case 'DIRECTORY_CREATION_FAILED':
                                errorMessage = 'Server storage error. Please try again later.';
                                break;
                            case 'FILE_SAVE_FAILED':
                                errorMessage = 'Failed to save file to server. Please try again.';
                                break;
                            case 'DATABASE_UPDATE_FAILED':
                                errorMessage = 'Image uploaded but could not be linked. Please refresh and try again.';
                                break;
                            default:
                                errorMessage = responseData.message || errorMessage;
                        }
                    } else if (responseData.message) {
                        errorMessage = responseData.message;
                    }
                }
                
                console.error('Upload failed:', responseData);
                this.showMessage(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Network/unexpected error uploading portfolio image:', error);
            
            let errorMessage = 'Network error occurred while uploading image';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'Server returned invalid response. Please try again.';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            this.showMessage(`Upload failed: ${errorMessage}`, 'error');
        } finally {
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = originalText;
            }
        }
    }

    async deletePortfolioImage() {
        if (!this.isEditing || !this.currentPortfolioId) {
            this.showMessage('No portfolio item selected', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        const deleteBtn = document.getElementById('portfolio-delete-image-btn');
        const originalText = deleteBtn ? deleteBtn.textContent : '';
        
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.textContent = 'Deleting...';
        }

        try {
            console.log('Starting portfolio image deletion...');
            console.log('Portfolio ID:', this.currentPortfolioId);

            const response = await fetch(`http://localhost:8080/api/candidates/portfolio/${this.currentPortfolioId}/delete-image`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);

            let responseData;
            try {
                responseData = await response.json();
                console.log('Delete response data:', responseData);
            } catch (jsonError) {
                console.error('Failed to parse delete response as JSON:', jsonError);
                throw new Error('Server returned invalid response format');
            }

            if (response.ok && responseData.success) {
                this.showMessage('Image deleted successfully!', 'success');
                
                // CRITICAL FIX: Update the portfolio item immediately in memory
                const portfolioIndex = this.portfolio.findIndex(p => p.id === this.currentPortfolioId);
                if (portfolioIndex !== -1) {
                    this.portfolio[portfolioIndex].imageUrl = null;
                    console.log('Updated portfolio item in memory (removed image):', this.portfolio[portfolioIndex]);
                }
                
                // IMMEDIATE REFRESH: Update all displays immediately
                this.displayPortfolio();
                this.displayPortfolioInModal();
                
                // FORCE REFRESH: Also reload from server to ensure consistency
                setTimeout(async () => {
                    await this.loadPortfolio();
                    this.displayPortfolio();
                    this.displayPortfolioInModal();
                    console.log('Portfolio refreshed from server after deletion');
                }, 500);
                
                this.resetImageUpload();
            } else {
                // Handle detailed error response
                let errorMessage = 'Failed to delete image';
                
                if (responseData) {
                    if (responseData.errorType && responseData.message) {
                        errorMessage = `${responseData.errorType}: ${responseData.message}`;
                        
                        // User-friendly error messages based on error type
                        switch (responseData.errorType) {
                            case 'PORTFOLIO_NOT_FOUND':
                                errorMessage = 'Portfolio item not found. Please refresh the page and try again.';
                                break;
                            case 'DELETE_ERROR':
                                errorMessage = 'Failed to delete image. Please try again.';
                                break;
                            default:
                                errorMessage = responseData.message || errorMessage;
                        }
                    } else if (responseData.message) {
                        errorMessage = responseData.message;
                    }
                }
                
                console.error('Delete failed:', responseData);
                this.showMessage(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Network/unexpected error deleting portfolio image:', error);
            
            let errorMessage = 'Network error occurred while deleting image';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            } else if (error.message.includes('JSON')) {
                errorMessage = 'Server returned invalid response. Please try again.';
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            this.showMessage(`Delete failed: ${errorMessage}`, 'error');
        } finally {
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.textContent = originalText;
            }
        }
    }

    resetImageUpload() {
        this.selectedImageFile = null;
        
        const fileInput = document.getElementById('portfolio-image-input');
        const uploadBtn = document.getElementById('portfolio-upload-btn');
        const actionsDiv = document.getElementById('portfolio-image-actions');
        const preview = document.getElementById('portfolio-image-preview');
        const uploadContent = document.getElementById('portfolio-upload-content');
        
        if (fileInput) fileInput.value = '';
        if (uploadBtn) uploadBtn.disabled = true;
        if (actionsDiv) actionsDiv.classList.add('hidden');
        if (preview) preview.innerHTML = '';
        
        if (uploadContent) {
            uploadContent.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9f7aea" stroke-width="1.5" class="mx-auto mb-4">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17,8 12,3 7,8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p class="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Click to upload</strong> or drag and drop
                </p>
                <p class="text-gray-500 dark:text-gray-400 text-sm">PNG, JPG or GIF (max 5MB)</p>
            `;
        }
    }

    async initializeForCurrentUser() {
        try {
            const storedUser = JSON.parse(localStorage.getItem('current_user'));
            if (!storedUser || !storedUser.id) return;

            this.currentUserId = storedUser.id;
            await this.loadPortfolio();
        } catch (error) {
            console.error('Error initializing portfolio manager:', error);
        }
    }

    async loadPortfolio() {
        try {
            if (!this.currentUserId) return;

            const response = await window.apiClient.getCandidatePortfolio(this.currentUserId);
            
            if (response && response.portfolio) {
                this.portfolio = response.portfolio;
                this.displayPortfolio();
                this.displayPortfolioInModal();
            }
        } catch (error) {
            console.error('Error loading portfolio:', error);
            // Show empty state
            this.displayPortfolio();
            this.displayPortfolioInModal();
        }
    }

    async handleSubmitPortfolio(e) {
        e.preventDefault();

        const title = document.getElementById('portfolio-title').value.trim();
        const type = document.getElementById('portfolio-type').value;
        const description = document.getElementById('portfolio-description').value.trim();
        const url = document.getElementById('portfolio-url').value.trim();
        const imageUrl = document.getElementById('portfolio-image-url').value.trim();

        if (!title || !url) return;

        try {
            const portfolioData = {
                title: title,
                type: type || null,
                description: description || null,
                url: url,
                imageUrl: imageUrl || null, // Manual URL input
                candidateId: this.currentUserId
            };

            let response;
            if (this.isEditing && this.currentPortfolioId) {
                // Update existing portfolio item
                response = await window.apiClient.updateCandidatePortfolio(this.currentPortfolioId, portfolioData);
            } else {
                // Add new portfolio item
                response = await window.apiClient.addCandidatePortfolio(portfolioData);
                
                // Set the new portfolio ID for image uploads
                if (response && response.success && response.portfolio) {
                    this.currentPortfolioId = response.portfolio.id;
                    this.isEditing = true;
                    
                    // Update UI to show editing mode
                    document.getElementById('portfolio-form-title').textContent = 'Edit Portfolio Item';
                    document.getElementById('portfolio-submit-text').textContent = 'Update';
                }
            }
            
            if (response && response.success) {
                // Reload portfolio
                await this.loadPortfolio();
                
                // Show success message
                const message = this.isEditing ? 'Portfolio item updated successfully!' : 'Portfolio item added successfully!';
                this.showMessage(message, 'success');
                
                // Don't reset form if we just created a new item (for image upload)
                if (this.isEditing && this.currentPortfolioId) {
                    // Enable image upload for the saved item
                    const actionsDiv = document.getElementById('portfolio-image-actions');
                    if (actionsDiv) actionsDiv.classList.remove('hidden');
                }
            } else {
                throw new Error(response?.message || 'Failed to save portfolio item');
            }
            
        } catch (error) {
            console.error('Error saving portfolio item:', error);
            this.showMessage('Error saving portfolio item. Please try again.', 'error');
        }
    }

    async editPortfolio(portfolioId) {
        const portfolioItem = this.portfolio.find(p => p.id === portfolioId);
        if (!portfolioItem) return;

        // Set editing mode
        this.isEditing = true;
        this.currentPortfolioId = portfolioId;

        // Populate form
        document.getElementById('portfolio-id').value = portfolioId;
        document.getElementById('portfolio-title').value = portfolioItem.title;
        document.getElementById('portfolio-type').value = portfolioItem.type || '';
        document.getElementById('portfolio-description').value = portfolioItem.description || '';
        document.getElementById('portfolio-url').value = portfolioItem.url;
        document.getElementById('portfolio-image-url').value = portfolioItem.imageUrl || '';

        // Update UI
        document.getElementById('portfolio-form-title').textContent = 'Edit Portfolio Item';
        document.getElementById('portfolio-submit-text').textContent = 'Update';

        // Show image actions for existing item
        const actionsDiv = document.getElementById('portfolio-image-actions');
        if (actionsDiv) actionsDiv.classList.remove('hidden');

        // Show current image if exists
        if (portfolioItem.imageUrl) {
            const preview = document.getElementById('portfolio-image-preview');
            if (preview) {
                const fullImageUrl = portfolioItem.imageUrl.startsWith('http') 
                    ? portfolioItem.imageUrl 
                    : `http://localhost:8080${portfolioItem.imageUrl}`;
                    
                preview.innerHTML = `
                    <div class="text-center">
                        <img src="${fullImageUrl}" class="max-w-32 max-h-32 mx-auto rounded-lg mb-2 object-cover" alt="Current image">
                        <p class="text-sm text-gray-600 dark:text-gray-400">Current image</p>
                    </div>
                `;
            }
        }

        // Open modal if not already open
        if (document.getElementById('portfolio-form-container').classList.contains('hidden')) {
            openModal('portfolio-form-container');
        }
    }

    async deletePortfolio(portfolioId) {
        if (!confirm('Are you sure you want to delete this portfolio item?')) {
            return;
        }

        try {
            const response = await window.apiClient.deleteCandidatePortfolio(portfolioId);
            
            if (response && response.success) {
                await this.loadPortfolio();
                this.showMessage('Portfolio item deleted successfully!', 'success');
            } else {
                throw new Error(response?.message || 'Failed to delete portfolio item');
            }
        } catch (error) {
            console.error('Error deleting portfolio item:', error);
            this.showMessage('Error deleting portfolio item. Please try again.', 'error');
        }
    }

    resetForm() {
        this.isEditing = false;
        this.currentPortfolioId = null;
        document.getElementById('portfolio-form').reset();
        document.getElementById('portfolio-id').value = '';
        document.getElementById('portfolio-form-title').textContent = 'Manage Portfolio';
        document.getElementById('portfolio-submit-text').textContent = 'Add';
        
        // Reset image upload
        this.resetImageUpload();
    }

    // Enhanced displayPortfolio method to ensure images show up
    displayPortfolio() {
        // FIX: Use the correct container ID from profiledesign.html
        const portfolioContainer = document.getElementById('current-portfolio-list');
        
        if (!portfolioContainer) {
            console.warn('Portfolio container not found (current-portfolio-list)');
            return;
        }

        if (this.portfolio.length === 0) {
            portfolioContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-folder-open text-4xl mb-4"></i>
                    <p>No portfolio items yet. Add your first project!</p>
                </div>
            `;
            return;
        }

        portfolioContainer.innerHTML = this.portfolio.map(item => {
            const imageHtml = item.imageUrl ? 
                `<img src="http://localhost:8080${item.imageUrl}" alt="${item.title}" class="w-16 h-16 object-cover rounded-lg mr-3" onload="console.log('Portfolio image loaded:', '${item.imageUrl}')" onerror="console.error('Failed to load portfolio image:', '${item.imageUrl}'); this.src='img/default-portfolio.png';">` :
                `<div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3 flex items-center justify-center">
                    <i class="fas fa-image text-xl text-gray-400"></i>
                </div>`;

            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center flex-1">
                        <div class="w-16 h-16 mr-3 flex-shrink-0">
                            ${imageHtml}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center mb-1">
                                ${this.getTypeIcon(item.type)}
                                <h4 class="font-semibold text-gray-900 dark:text-white ml-2">${item.title}</h4>
                            </div>
                            <p class="text-gray-600 dark:text-gray-300 text-sm mb-1">${item.description || 'No description'}</p>
                            <a href="${this.formatUrl(item.url)}" target="_blank" 
                               class="text-lilac-500 hover:text-lilac-600 dark:hover:text-lilac-400 text-sm flex items-center">
                                <i class="fas fa-external-link-alt mr-1"></i>
                                View Project
                            </a>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="portfolioManager.editPortfolio(${item.id})" 
                                class="text-gray-500 hover:text-blue-500 p-1">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="portfolioManager.deletePortfolio(${item.id})" 
                                class="text-gray-500 hover:text-red-500 p-1">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        console.log('Portfolio display updated with', this.portfolio.length, 'items');
    }

    // Enhanced displayPortfolioInModal method to ensure images show up in modals too
    displayPortfolioInModal() {
        // FIX: Use the correct container ID from profiledesign.html
        const modalContainer = document.getElementById('modal-portfolio-list');
        
        if (!modalContainer) {
            console.warn('Portfolio modal container not found (modal-portfolio-list)');
            return;
        }

        if (this.portfolio.length === 0) {
            modalContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-folder-open text-4xl mb-4"></i>
                    <p>No portfolio items to display</p>
                </div>
            `;
            return;
        }

        modalContainer.innerHTML = this.portfolio.map(item => {
            const imageHtml = item.imageUrl ? 
                `<img src="http://localhost:8080${item.imageUrl}" alt="${item.title}" class="w-full h-32 object-cover rounded-lg mb-3" onload="console.log('Modal portfolio image loaded:', '${item.imageUrl}')" onerror="console.error('Failed to load modal portfolio image:', '${item.imageUrl}'); this.src='img/default-portfolio.png';">` :
                `<div class="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                    <i class="fas fa-image text-2xl text-gray-400"></i>
                </div>`;

            return `
                <div class="bg-lilac-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 mb-3">
                    ${imageHtml}
                    <div class="flex items-center mb-2">
                        ${this.getTypeIcon(item.type)}
                        <h4 class="font-semibold text-gray-900 dark:text-white ml-2">${item.title}</h4>
                    </div>
                    <p class="text-gray-600 dark:text-gray-300 text-sm mb-2">${item.description || 'No description'}</p>
                    <div class="flex justify-between items-center">
                        <a href="${this.formatUrl(item.url)}" target="_blank" 
                           class="text-lilac-500 hover:text-lilac-600 dark:hover:text-lilac-400 text-sm flex items-center">
                            <i class="fas fa-external-link-alt mr-1"></i>
                            View Project
                        </a>
                        <div class="flex space-x-2">
                            <button onclick="portfolioManager.editPortfolio(${item.id})" 
                                    class="text-gray-500 hover:text-blue-500 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="portfolioManager.deletePortfolio(${item.id})" 
                                    class="text-gray-500 hover:text-red-500 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('Portfolio modal display updated with', this.portfolio.length, 'items');
    }

    getTypeIcon(type) {
        const icons = {
            web: 'fas fa-globe',
            mobile: 'fas fa-mobile-alt',
            design: 'fas fa-palette',
            github: 'fab fa-github',
            behance: 'fab fa-behance-square',
            dribbble: 'fab fa-dribbble-square',
            figma: 'fas fa-vector-square',
            website: 'fas fa-external-link-alt',
            other: 'fas fa-file-alt'
        };
        return `<i class="${icons[type] || 'fas fa-briefcase'} text-lilac-500"></i>`;
    }

    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
        } catch {
            return url;
        }
    }

    showMessage(message, type) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-20 right-4 z-50 p-4 rounded-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } transition-all duration-300 transform translate-x-full`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // New method to auto-save portfolio before image upload
    async createPortfolioForImageUpload() {
        const title = document.getElementById('portfolio-title').value.trim();
        const type = document.getElementById('portfolio-type').value;
        const description = document.getElementById('portfolio-description').value.trim();
        const url = document.getElementById('portfolio-url').value.trim();

        // Validate required fields
        if (!title) {
            this.showMessage('Please enter a project title first', 'error');
            document.getElementById('portfolio-title').focus();
            throw new Error('Title is required');
        }

        if (!url) {
            this.showMessage('Please enter a project URL first', 'error');
            document.getElementById('portfolio-url').focus();
            throw new Error('URL is required');
        }

        try {
            // Create the portfolio item
            const portfolioData = {
                title: title,
                type: type || null,
                description: description || null,
                url: url,
                imageUrl: null, // Will be set after image upload
                candidateId: this.currentUserId
            };

            const response = await window.apiClient.addCandidatePortfolio(portfolioData);

            if (response && response.success) {
                // Set the new portfolio ID for image uploads
                this.currentPortfolioId = response.portfolio.id;
                this.isEditing = true;
                
                // Update UI to show editing mode
                document.getElementById('portfolio-form-title').textContent = 'Edit Portfolio Item';
                document.getElementById('portfolio-submit-text').textContent = 'Update';
                
                this.showMessage('Portfolio item created, now uploading image...', 'success');
            } else {
                throw new Error(response?.message || 'Failed to save portfolio item');
            }
        } catch (error) {
            console.error('Error creating portfolio item for image upload:', error);
            throw error; // Re-throw to be handled by uploadPortfolioImage
        }
    }
}

// Initialize portfolio manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioManager = new PortfolioManager();
});

// Function to initialize portfolio for a specific candidate (for viewing other profiles)
window.initializeCandidatePortfolio = function(candidateId) {
    if (window.portfolioManager) {
        window.portfolioManager.currentUserId = candidateId;
        window.portfolioManager.loadPortfolio();
    }
};