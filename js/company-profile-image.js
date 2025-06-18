// Company Profile Image Management - Similar to profile-image.js

let selectedFile = null;
let currentCompanyId = null;
let isOwnProfile = false;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('company-image-input');
const uploadBtn = document.getElementById('uploadCompanyBtn');
const deleteBtn = document.getElementById('deleteCompanyBtn');
const preview = document.getElementById('preview');

// File upload handling
document.addEventListener('DOMContentLoaded', () => {
    if (!uploadArea || !fileInput || !uploadBtn || !deleteBtn) {
        console.warn('Company image upload elements not found - normal for viewing other profiles');
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
    uploadBtn.addEventListener('click', uploadCompanyImage);

    // Delete button handler
    deleteBtn.addEventListener('click', deleteCompanyImage);
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
}

async function uploadCompanyImage() {
    if (!selectedFile) {
        alert('No file selected');
        return;
    }

    if (!currentCompanyId || !isOwnProfile) {
        alert('You can only upload images to your own company profile');
        return;
    }
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        // Use API client to upload
        if (window.apiClient && window.apiClient.uploadCompanyImage) {
            const response = await window.apiClient.uploadCompanyImage(currentCompanyId, formData);
            
            if (response && response.success) {
                alert('✅ Company logo uploaded successfully!');
                
                // Update profile image on page
                updateCompanyProfileImages(response.company.profileImageUrl);
                
                resetUploadArea();
                closeModal('modal-upload');
            } else {
                alert(`❌ Upload failed: ${response ? response.message : 'Unknown error'}`);
            }
        } else {
            // Fallback: simulate upload for demo
            setTimeout(() => {
                alert('✅ Company logo uploaded successfully! (Demo mode)');
                
                // Update profile image with selected file using FileReader
                const reader = new FileReader();
                reader.onload = (e) => {
                    updateCompanyProfileImages(e.target.result);
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
        uploadBtn.textContent = 'Upload Logo';
    }
}

async function deleteCompanyImage() {
    if (!currentCompanyId || !isOwnProfile) {
        alert('You can only delete your own company logo');
        return;
    }

    if (!confirm('Are you sure you want to delete your company logo?')) {
        return;
    }
    
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    
    try {
        if (window.apiClient && window.apiClient.deleteCompanyImage) {
            const response = await window.apiClient.deleteCompanyImage(currentCompanyId);
            
            if (response && response.success) {
                alert('✅ Company logo deleted successfully!');
                
                // Reset to default image
                updateCompanyProfileImages('img/default-profile.png');
            } else {
                alert(`❌ Delete failed: ${response ? response.message : 'Unknown error'}`);
            }
        } else {
            // Fallback: simulate delete for demo
            setTimeout(() => {
                alert('✅ Company logo deleted successfully! (Demo mode)');
                
                // Reset to default image
                updateCompanyProfileImages('img/default-profile.png');
            }, 500);
        }
    } catch (error) {
        alert(`❌ Delete error: ${error.message}`);
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete Logo';
    }
}

// Helper function to update all company profile images on the page
function updateCompanyProfileImages(imageUrl) {
    // Ensure the image URL is absolute for API responses
    let finalImageUrl = imageUrl;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('img/')) {
        finalImageUrl = `http://localhost:8080${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    }
    
    // Update main company profile image (background-image)
    const companyImg = document.getElementById('company-profile-image');
    if (companyImg) {
        companyImg.style.backgroundImage = `url('${finalImageUrl}')`;
    }
}

function resetUploadArea() {
    selectedFile = null;
    uploadBtn.disabled = true;
    
    if (fileInput) fileInput.value = '';
    if (preview) preview.innerHTML = '';
    
    // Reset upload area
    if (uploadArea) {
        uploadArea.innerHTML = `
        <div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9f7aea" stroke-width="1.5" class="mx-auto mb-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17,8 12,3 7,8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p class="text-gray-700 dark:text-gray-300 mb-2">
            <strong>Click to upload</strong> or drag and drop
          </p>
          <p class="text-gray-500 dark:text-gray-400 text-sm">PNG, JPG or GIF (max 5MB)</p>
        </div>
    `;
    }
}

// Function to set company context (called from main company profile script)
function setCompanyContext(companyId, canEdit) {
    currentCompanyId = companyId;
    isOwnProfile = canEdit;
}