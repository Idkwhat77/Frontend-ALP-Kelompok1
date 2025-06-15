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
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    selectedFile = file;
    uploadBtn.disabled = false;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        if (preview) {
            preview.innerHTML = `
                <div class="text-center">
                    <img src="${e.target.result}" class="max-w-32 max-h-32 mx-auto rounded-lg mb-2" alt="Preview">
                    <p class="text-sm text-gray-600 dark:text-gray-400">${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
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
        alert('No file selected');
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
                alert('✅ Image uploaded successfully!');
                
                // Update profile image on page using background-image
                updateProfileImages(response.imageUrl);
                
                resetUploadArea();
                closeModal('modal-upload');
            } else {
                alert(`❌ Upload failed: ${response ? response.message : 'Unknown error'}`);
            }
        } else {
            // Fallback: simulate upload for demo
            setTimeout(() => {
                alert('✅ Image uploaded successfully! (Demo mode)');
                
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
        alert(`❌ Upload error: ${error.message}`);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Image';
    }
}

async function deleteImage() {
    if (!confirm('Are you sure you want to delete your profile image?')) {
        return;
    }
    
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    try {
        if (window.apiClient && window.apiClient.deleteProfileImage) {
            const response = await window.apiClient.deleteProfileImage(currentUserId);
            
            if (response && response.success) {
                alert('✅ Image deleted successfully!');
                
                // Reset to default image
                updateProfileImages('img/default-profile.png');
            } else {
                alert(`❌ Delete failed: ${response ? response.message : 'Unknown error'}`);
            }
        } else {
            // Fallback: simulate delete for demo
            setTimeout(() => {
                alert('✅ Image deleted successfully! (Demo mode)');
                
                // Reset to default image
                updateProfileImages('img/default-profile.png');
            }, 500);
        }
    } catch (error) {
        alert(`❌ Delete error: ${error.message}`);
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