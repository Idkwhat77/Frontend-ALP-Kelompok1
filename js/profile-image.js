let selectedFile = null;
let currentUserId = null;

// Get current user ID from local storage or API client
const user = window.apiClient.getCurrentUser();
if (user && user.id) {
    currentUserId = user.id;
}

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('profile-image-input'); // Updated ID
const uploadBtn = document.getElementById('uploadBtn');
const deleteBtn = document.getElementById('deleteBtn');
const preview = document.getElementById('preview');

// File upload handling
document.addEventListener('DOMContentLoaded', () => {
    if (!uploadArea || !fileInput || !uploadBtn || !deleteBtn) {
        console.error('Required elements not found');
        return;
    }

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Upload button handler
    uploadBtn.addEventListener('click', uploadImage);

    // Delete button handler
    deleteBtn.addEventListener('click', deleteImage);
});

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

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    uploadArea.classList.add('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
}

function unhighlight() {
    uploadArea.classList.remove('border-purple-500', 'bg-purple-100', 'dark:bg-purple-900');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
}

function handleFileSelect(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }
    
    selectedFile = file;
    uploadBtn.disabled = false;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        if (preview) {
            const previewText = window.currentLanguage === 'id' ? 'Pratinjau' : 'Preview';
            const fileInfoText = window.currentLanguage === 'id' ? 'KB' : 'KB';
            
            preview.innerHTML = `
                <div class="text-center">
                    <img src="${e.target.result}" class="max-w-32 max-h-32 mx-auto rounded-lg mb-2" alt="${previewText}" data-i18n-alt="image.preview">
                    <p class="text-sm text-gray-600 dark:text-gray-400">${file.name} (${(file.size / 1024).toFixed(1)} ${fileInfoText})</p>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
    
    // Update upload area
    const uploadContent = uploadArea.querySelector('div');
    uploadContent.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5" class="mx-auto mb-4">
            <path d="M9 12l2 2 4-4"></path>
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        <p class="text-green-600 dark:text-green-400 mb-2"><strong>File selected:</strong> ${file.name}</p>
        <p class="text-gray-500 dark:text-gray-400 text-sm">Click upload to save</p>
    `;
}

async function uploadImage() {
    if (!selectedFile) {
        showNotification('No file selected', 'error');
        return;
    }
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        // If you have an API client, use it
        if (window.apiClient && window.apiClient.uploadProfileImage) {
            const response = await window.apiClient.uploadProfileImage(currentUserId, formData);
            
            if (response && response.success) {
                showNotification('Image uploaded successfully!', 'success');
                
                // Update profile image on page using background-image
                updateProfileImages(response.imageUrl);
                
                resetUploadArea();
                closeModal('modal-upload');
            } else {
                showNotification(`Upload failed: ${response ? response.message : 'Unknown error'}`, 'error');
            }
        } else {
            // Fallback: simulate upload for demo
            setTimeout(() => {
                showNotification('Image uploaded successfully! (Demo mode)', 'success');
                
                // Update profile image with selected file using FileReader
                const reader = new FileReader();
                reader.onload = (e) => {
                    updateProfileImages(e.target.result);
                };
                reader.readAsDataURL(selectedFile);
                
                resetUploadArea();
                closeModal('modal-upload');
            }, 1000);
        }
    } catch (error) {
        showNotification(`Upload error: ${error.message}`, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Image';
    }
}

async function deleteImage() {
    // Show confirmation modal instead of browser confirm
    showDeleteConfirmationModal(() => {
        // Proceed with deletion if confirmed
        proceedWithDelete();
    });
    return;
}

// Add this new function to show the confirmation modal
function showDeleteConfirmationModal(onConfirm) {
    // Create modal HTML
    const modalHTML = `
        <div id="delete-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 shadow-xl">
                <div class="flex items-center mb-4">
                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
                </div>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to delete your profile image? This action cannot be undone.
                </p>
                <div class="flex justify-end space-x-3">
                    <button id="cancel-delete" class="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Cancel
                    </button>
                    <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Delete Image
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('delete-confirmation-modal');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    // Handle cancel
    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    // Handle confirm
    confirmBtn.addEventListener('click', () => {
        modal.remove();
        onConfirm();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Separate the actual delete logic
async function proceedWithDelete() {
    
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    try {
        if (window.apiClient && window.apiClient.deleteProfileImage) {
            const response = await window.apiClient.deleteProfileImage(currentUserId);
            
            if (response && response.success) {
                showNotification('Image deleted successfully!', 'success');
                
                // Reset to default image
                updateProfileImages('img/default-profile.png');
            } else {
                showNotification(`Delete failed: ${response ? response.message : 'Unknown error'}`, 'error');
            }
        } else {
            // Fallback: simulate delete for demo
            setTimeout(() => {
                showNotification('Image deleted successfully! (Demo mode)', 'success');
                
                // Reset to default image
                updateProfileImages('img/default-profile.png');
            }, 500);
        }
    } catch (error) {
        showNotification(`Delete error: ${error.message}`, 'error');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete Image';
    }
}

// Helper function to update all profile images on the page
function updateProfileImages(imageUrl) {
    // Ensure the image URL is absolute for API responses
    let finalImageUrl = imageUrl;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('img/')) {
        finalImageUrl = `http://localhost:8080/${imageUrl.replace(/^\/+/, '')}`;
    }
    
    // Update main profile image (background-image)
    const profileImg = document.getElementById('profile-image');
    if (profileImg) {
        profileImg.style.backgroundImage = `url('${finalImageUrl}')`;
    }
    
    // Update navbar profile images (background-image for nav, src for mobile)
    const profileImgNav = document.getElementById('profile-image-nav');
    if (profileImgNav) {
        profileImgNav.style.backgroundImage = `url('${finalImageUrl}')`;
    }
    
    const profileImgMobile = document.getElementById('profile-image-mobile');
    if (profileImgMobile) {
        profileImgMobile.style.backgroundImage = `url('${finalImageUrl}')`;
    }
}

function resetUploadArea() {
    selectedFile = null;
    fileInput.value = '';
    uploadBtn.disabled = true;
    
    if (preview) {
        preview.innerHTML = '';
    }
    
    // Reset upload area content
    const uploadContent = uploadArea.querySelector('div');
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