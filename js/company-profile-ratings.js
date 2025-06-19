class CompanyRatingsManager {
    constructor() {
        this.currentPage = 0;
        this.pageSize = 10;
        this.totalPages = 0;
        this.companyId = null;
        this.reviews = [];
        this.currentUser = null;
        this.userType = null;
        this.isOwnProfile = false;
        this.init();
    }

    async init() {
        this.currentUser = window.apiClient?.getCurrentUser();
        this.userType = window.apiClient?.getUserType();
        
        this.checkIfOwnProfile();
        this.setupEventListeners();
        
        if (window.currentCompany?.id) {
            this.setCompanyId(window.currentCompany.id);
        }
    }

    // Notification system - consistent with other classes in the codebase
    showNotification(message, type = 'success') {
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

    checkIfOwnProfile() {
        this.isOwnProfile = window.location.pathname.includes('profilecom.html');
    }

    setupEventListeners() {
        // Add rating button
        const addRatingBtn = document.getElementById('add-rating-btn');
        const firstReviewBtn = document.getElementById('first-review-btn');
        
        if (addRatingBtn) {
            addRatingBtn.addEventListener('click', () => this.openRatingModal());
        }
        
        if (firstReviewBtn) {
            firstReviewBtn.addEventListener('click', () => this.openRatingModal());
        }

        // Pagination buttons
        const prevBtn = document.getElementById('reviews-prev-btn');
        const nextBtn = document.getElementById('reviews-next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    setCompanyId(companyId) {
        console.log('Setting company ID for ratings:', companyId);
        this.companyId = companyId;
        this.updateRatingButtonVisibility();
        
        // Auto-load if ratings tab is visible
        const ratingsContent = document.getElementById('ratings-content');
        if (ratingsContent && !ratingsContent.classList.contains('hidden')) {
            this.loadCompanyRatings();
        }
    }

    updateRatingButtonVisibility() {
        const addRatingBtn = document.getElementById('add-rating-btn');
        const firstReviewBtn = document.getElementById('first-review-btn');
        
        const canRate = this.currentUser && 
                       this.userType === 'employee' && 
                       !this.isOwnProfile;
        
        if (addRatingBtn) {
            addRatingBtn.style.display = canRate ? 'block' : 'none';
        }
        
        if (firstReviewBtn) {
            firstReviewBtn.style.display = canRate ? 'inline-block' : 'none';
        }
    }

    async loadCompanyRatings() {
        if (!this.companyId) return;

        this.showLoading();
        
        try {
            // Fetch ratings and summary
            const response = await fetch(`http://localhost:8080/api/companies/${this.companyId}/ratings?page=${this.currentPage}&size=${this.pageSize}`);
            const data = await response.json();
            
            if (data.success) {
                this.reviews = data.ratings;
                this.totalPages = data.totalPages;
                
                // Display summary
                this.displayRatingSummary(data.summary);
                
                // Display reviews
                this.displayReviews(data.ratings);
                
                // Update pagination
                this.updatePagination(data.currentPage, data.totalPages, data.totalElements);
                
                this.hideLoading();
            } else {
                throw new Error(data.message || 'Failed to load ratings');
            }
        } catch (error) {
            console.error('Error loading company ratings:', error);
            this.showError('Failed to load company ratings');
        }
    }

    displayRatingSummary(summary) {
        const averageRating = document.getElementById('average-rating');
        const averageStars = document.getElementById('average-stars');
        const totalReviews = document.getElementById('total-reviews');
        const ratingBreakdown = document.getElementById('rating-breakdown');

        if (averageRating) {
            averageRating.textContent = summary.averageRating?.toFixed(1) || '0.0';
        }

        if (averageStars) {
            averageStars.innerHTML = this.generateStars(summary.averageRating || 0);
        }

        if (totalReviews) {
            const count = summary.totalReviews || 0;
            totalReviews.textContent = `${count} review${count !== 1 ? 's' : ''}`;
        }

        if (ratingBreakdown && summary.breakdown) {
            this.displayRatingBreakdown(summary.breakdown, summary.totalReviews || 0);
        }
    }

    displayRatingBreakdown(breakdown, totalReviews) {
        const container = document.getElementById('rating-breakdown');
        if (!container) return;

        container.innerHTML = '';

        for (let i = 5; i >= 1; i--) {
            const count = breakdown[i] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            const breakdownItem = document.createElement('div');
            breakdownItem.className = 'flex items-center space-x-2';
            breakdownItem.innerHTML = `
                <span class="text-sm text-gray-600 dark:text-gray-300">${i}</span>
                <i class="fas fa-star text-yellow-400 text-xs"></i>
                <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div class="bg-yellow-400 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-300">${count}</span>
            `;
            container.appendChild(breakdownItem);
        }
    }

    displayReviews(reviews) {
        const container = document.getElementById('reviews-container');
        const emptyState = document.getElementById('reviews-empty-state');

        if (!reviews || reviews.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.classList.remove('hidden');
        container.innerHTML = '';

        reviews.forEach(review => {
            const reviewElement = this.createReviewElement(review);
            container.appendChild(reviewElement);
        });
    }

    createDeleteButton(review) {
        // Only show delete button if it's the user's own review or they're an admin
        const currentUser = window.apiClient?.getCurrentUser();
        if (!currentUser) return '';
        
        const isOwnReview = review.reviewer?.id === currentUser.id || 
                           review.reviewerId === currentUser.id;
        
        if (isOwnReview || this.isOwnProfile) {
            return `
                <button onclick="companyRatingsManager.deleteReview(${review.id})" 
                        class="text-red-500 hover:text-red-700 text-sm p-1" 
                        title="Delete Review">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        return '';
    }

    async deleteReview(reviewId) {
        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const response = await window.apiClient.deleteCompanyRating(this.companyId, reviewId);

            if (response.success) {
                // Reload ratings
                this.currentPage = 0;
                await this.loadCompanyRatings();
                showNotification('Review deleted successfully!', 'success');
            } else {
                throw new Error(response.message || 'Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            showNotification('Failed to delete review: ' + error.message, 'error');
        }
    }

    createReviewElement(review) {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4';
        
        const createdAt = new Date(review.createdAt).toLocaleDateString();
        
        // Better reviewer name extraction - handle user ID to candidate mapping
        let reviewerName = 'Anonymous';
        let reviewerInitial = 'A';
        
        // First check if we have direct reviewer data
        if (review.reviewer?.fullName) {
            reviewerName = review.reviewer.fullName;
            reviewerInitial = reviewerName.charAt(0).toUpperCase();
        } else if (review.reviewer?.name) {
            reviewerName = review.reviewer.name;
            reviewerInitial = reviewerName.charAt(0).toUpperCase();
        } else if (review.reviewerName) {
            reviewerName = review.reviewerName;
            reviewerInitial = reviewerName.charAt(0).toUpperCase();
        } else if (review.reviewerId) {
            // If we only have reviewer ID (which is actually user ID), 
            // we need to fetch candidate data asynchronously
            this.fetchReviewerName(review.reviewerId, reviewDiv);
        }
        
        reviewDiv.innerHTML = `
            <div class="flex items-start justify-between mb-2">
            <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-lilac-400 rounded-full flex items-center justify-center text-white font-bold text-sm reviewer-image" 
                 style="background-image: url('${review.reviewer?.profileImageUrl ? `http://localhost:8080${review.reviewer.profileImageUrl}` : 'img/default-profile.png'}'); background-size: cover; background-position: center;">
                <span style="display: ${review.reviewer?.profileImageUrl ? 'none' : 'block'}"></span>
                </div>
                <div>
                <h4 class="font-medium text-gray-900 dark:text-white reviewer-name">${reviewerName}</h4>
                <div class="flex items-center space-x-2">
                    <div class="flex text-yellow-400">
                    ${this.generateStars(review.rating)}
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${createdAt}</span>
                </div>
                </div>
            </div>
            ${this.createDeleteButton(review)}
            </div>
            ${review.review ? `<p class="text-gray-600 dark:text-gray-300 mt-2">${review.review}</p>` : ''}
        `;
        
        return reviewDiv;
    }

    async fetchReviewerName(userId, reviewElement) {
        try {
            // Try to get candidate data for this user ID
            const response = await window.apiClient.getCandidateByUserId(userId);
            if (response && response.candidate && response.candidate.fullName) {
                const fullName = response.candidate.fullName;
                const initial = fullName.charAt(0).toUpperCase();
                const profileImageUrl = response.candidate.profileImageUrl;
                
                // Update the review element
                const nameElement = reviewElement.querySelector('.reviewer-name');
                const initialElement = reviewElement.querySelector('.reviewer-initial');
                const imageElement = reviewElement.querySelector('.reviewer-image');
                if (imageElement) {
                    imageElement.style.backgroundImage = `url('${profileImageUrl ? `http://localhost:8080${profileImageUrl}` : 'img/default-profile.png'}')`;
                }
                if (nameElement) {
                    nameElement.textContent = fullName;
                }
                if (initialElement) {
                    initialElement.textContent = initial;
                }
            }
        } catch (error) {
            console.warn('Could not fetch reviewer name for user ID:', userId, error);
            // Keep showing "Anonymous" as fallback
        }
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        return starsHTML;
    }

    updatePagination(currentPage, totalPages, totalElements) {
        const pagination = document.getElementById('reviews-pagination');
        const prevBtn = document.getElementById('reviews-prev-btn');
        const nextBtn = document.getElementById('reviews-next-btn');
        const showingStart = document.getElementById('reviews-showing-start');
        const showingEnd = document.getElementById('reviews-showing-end');
        const totalReviewsSpan = document.getElementById('reviews-total');

        if (totalElements === 0) {
            pagination.classList.add('hidden');
            return;
        }

        pagination.classList.remove('hidden');

        const start = currentPage * this.pageSize + 1;
        const end = Math.min((currentPage + 1) * this.pageSize, totalElements);

        if (showingStart) showingStart.textContent = start;
        if (showingEnd) showingEnd.textContent = end;
        if (totalReviewsSpan) totalReviewsSpan.textContent = totalElements;

        if (prevBtn) {
            prevBtn.disabled = currentPage === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages - 1;
        }
    }

    async previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            await this.loadCompanyRatings();
        }
    }

    async nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            this.currentPage++;
            await this.loadCompanyRatings();
        }
    }

    openRatingModal() {
        // Create and show rating modal
        this.createRatingModal();
    }

    createRatingModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('rating-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div id="rating-modal" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-[90%] max-w-md">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Write a Review</h3>
                    
                    <form id="rating-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                            <div class="flex space-x-1" id="star-rating">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400 transition-colors" data-rating="${i}">
                                        <i class="far fa-star"></i>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review (Optional)</label>
                            <textarea id="review-text" rows="4" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lilac-500 focus:border-transparent resize-none" placeholder="Share your experience..."></textarea>
                        </div>
                        
                        <div class="flex space-x-3 pt-4">
                            <button type="submit" class="flex-1 bg-lilac-500 hover:bg-lilac-600 text-white px-4 py-2 rounded-lg transition-colors">
                                Submit Review
                            </button>
                            <button type="button" onclick="this.closest('#rating-modal').remove()" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Setup star rating interaction
        this.setupStarRating();

        // Setup form submission
        document.getElementById('rating-form').addEventListener('submit', (e) => this.handleRatingSubmit(e));
    }

    setupStarRating() {
        const starButtons = document.querySelectorAll('.star-btn');
        let selectedRating = 0;

        starButtons.forEach((button, index) => {
            button.addEventListener('mouseover', () => {
                this.highlightStars(index + 1);
            });

            button.addEventListener('click', () => {
                selectedRating = index + 1;
                this.selectStars(selectedRating);
            });
        });

        document.getElementById('star-rating').addEventListener('mouseleave', () => {
            this.selectStars(selectedRating);
        });

        window.getSelectedRating = () => selectedRating;
    }

    highlightStars(rating) {
        const starButtons = document.querySelectorAll('.star-btn');
        starButtons.forEach((button, index) => {
            const icon = button.querySelector('i');
            if (index < rating) {
                icon.className = 'fas fa-star';
                button.classList.add('text-yellow-400');
                button.classList.remove('text-gray-300');
            } else {
                icon.className = 'far fa-star';
                button.classList.add('text-gray-300');
                button.classList.remove('text-yellow-400');
            }
        });
    }

    selectStars(rating) {
        this.highlightStars(rating);
    }

    async handleRatingSubmit(event) {
        event.preventDefault();

        const rating = window.getSelectedRating();
        const review = document.getElementById('review-text').value.trim();

        if (rating === 0) {
            showNotification('Please select a rating', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/companies/${this.companyId}/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    rating: rating,
                    review: review
                })
            });

            const data = await response.json();

            if (data.success) {
                // Close modal
                document.getElementById('rating-modal').remove();
                
                // Reload ratings
                this.currentPage = 0;
                await this.loadCompanyRatings();

                showNotification('Review submitted successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('Failed to submit review: ' + error.message, 'error');
        }
    }

    showLoading() {
        document.getElementById('ratings-loading').classList.remove('hidden');
        document.getElementById('reviews-container').classList.add('hidden');
        document.getElementById('reviews-empty-state').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('ratings-loading').classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        // You can implement a proper error display here
        console.error(message);
    }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Initializing Company Ratings Manager ===');
    
    window.companyRatingsManager = new CompanyRatingsManager();
    
    const initializeRatingsData = () => {
        if (window.currentCompany?.id) {
            window.companyRatingsManager.setCompanyId(window.currentCompany.id);
        } else if (window.companyProfileManager?.currentCompany?.id) {
            window.companyRatingsManager.setCompanyId(window.companyProfileManager.currentCompany.id);
        } else {
            setTimeout(initializeRatingsData, 100);
        }
    };
    
    initializeRatingsData();
});
