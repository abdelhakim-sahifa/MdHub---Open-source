// Feedback Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Feedback form elements
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackType = document.getElementById('feedback-type');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMessage = document.getElementById('feedback-message');
    const feedbackEmail = document.getElementById('feedback-email');
    const ratingValue = document.getElementById('rating-value');
    const ratingDisplay = document.getElementById('rating-display');
    const stars = document.querySelectorAll('.star');
    const submitFeedback = document.getElementById('submit-feedback');
    const feedbackFormContainer = document.getElementById('feedback-form-container');
    const feedbackSuccess = document.getElementById('feedback-success');
    const submitAnother = document.getElementById('submit-another');
    const searchInput = document.getElementById('search-input');
    const tagsListContainer = document.getElementById('tags-list');
    const newFileBtn = document.getElementById('new-file-btn');

    // Rating functionality
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            ratingValue.value = rating;
            
            // Update stars display
            stars.forEach((s, index) => {
                const starIcon = s.querySelector('i');
                if (index < rating) {
                    starIcon.className = 'fas fa-star';
                } else {
                    starIcon.className = 'far fa-star';
                }
            });
            
            // Update rating text
            const ratingTexts = ['No rating', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
            ratingDisplay.textContent = ratingTexts[rating];
        });
        
        // Hover effect
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            
            stars.forEach((s, index) => {
                const starIcon = s.querySelector('i');
                if (index < rating) {
                    starIcon.className = 'fas fa-star';
                } else {
                    starIcon.className = 'far fa-star';
                }
            });
        });
        
        // Reset to selected rating on mouseleave
        star.addEventListener('mouseleave', () => {
            const selectedRating = parseInt(ratingValue.value);
            
            stars.forEach((s, index) => {
                const starIcon = s.querySelector('i');
                if (index < selectedRating) {
                    starIcon.className = 'fas fa-star';
                } else {
                    starIcon.className = 'far fa-star';
                }
            });
        });
    });

    // Form submission
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disable submit button to prevent multiple submissions
            submitFeedback.disabled = true;
            submitFeedback.innerHTML = '<span class="material-icons rotating">sync</span> Submitting...';
            
            try {
                // Get current user information if available
                let userId = 'anonymous';
                let userEmail = feedbackEmail.value.trim();
                let userDisplayName = 'Anonymous User';
                
                if (window.currentUser) {
                    userId = window.currentUser.uid;
                    userEmail = userEmail || window.currentUser.email || '';
                    userDisplayName = window.currentUser.displayName || 'User ' + userId.substring(0, 6);
                }
                
                // Create feedback object
                const feedback = {
                    type: feedbackType.value,
                    title: feedbackTitle.value.trim(),
                    message: feedbackMessage.value.trim(),
                    email: userEmail,
                    rating: parseInt(ratingValue.value) || 0,
                    userId: userId,
                    userDisplayName: userDisplayName,
                    timestamp: Date.now(),
                    status: 'new',
                    userAgent: navigator.userAgent,
                    pageUrl: window.location.href
                };
                
                // Save to Firebase
                const newFeedbackRef = database.ref('feedback').push();
                await newFeedbackRef.set(feedback);
                
                // Show success message
                feedbackFormContainer.style.display = 'none';
                feedbackSuccess.style.display = 'block';
                
                // Reset form
                feedbackForm.reset();
                stars.forEach(s => {
                    const starIcon = s.querySelector('i');
                    starIcon.className = 'far fa-star';
                });
                ratingValue.value = '0';
                ratingDisplay.textContent = 'No rating';
                
            } catch (error) {
                console.error('Error submitting feedback:', error);
                alert('There was an error submitting your feedback. Please try again later.');
                
                // Re-enable submit button
                submitFeedback.disabled = false;
                submitFeedback.innerHTML = '<span class="material-icons">send</span> Submit Feedback';
            }
        });
    }
    
    // Submit another feedback button
    if (submitAnother) {
        submitAnother.addEventListener('click', () => {
            feedbackSuccess.style.display = 'none';
            feedbackFormContainer.style.display = 'block';
            submitFeedback.disabled = false;
            submitFeedback.innerHTML = '<span class="material-icons">send</span> Submit Feedback';
        });
    }
    
    // Navigation functionality
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            window.location.href = 'create-file.html';
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    
    // Load popular tags for sidebar
    async function loadPopularTags() {
        if (!tagsListContainer) return;
        
        try {
            // Get all approved files to extract tags
            const snapshot = await database.ref('mdfiles').once('value');
            const files = snapshot.val();
            
            if (!files) return;
            
            // Count tag occurrences (only from approved files)
            const tagCounts = {};
            Object.values(files).forEach(file => {
                // Skip pending or rejected files
                if (file.status === 'pending' || file.status === 'rejected') {
                    return;
                }
                
                if (file.tags) {
                    const fileTags = Array.isArray(file.tags) 
                        ? file.tags 
                        : file.tags.split(',').map(tag => tag.trim());
                    
                    fileTags.forEach(tag => {
                        if (tag) {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        }
                    });
                }
            });
            
            // Sort tags by frequency
            const sortedTags = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10) // Take top 10 tags
                .map(([tag]) => tag);
            
            // Render tags
            tagsListContainer.innerHTML = '';
            sortedTags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    window.location.href = `search.html?q=${encodeURIComponent(tag)}`;
                });
                tagsListContainer.appendChild(tagElement);
            });
            
            // If no tags yet, show defaults
            if (sortedTags.length === 0) {
                tagsListContainer.innerHTML = `
                    <span class="tag">javascript</span>
                    <span class="tag">tutorial</span>
                    <span class="tag">guide</span>
                `;
            }
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }
    
    // Handle user authentication callback
    window.onUserAuthenticated = function(user) {
        // Auto-fill email if available
        if (user.email && feedbackEmail) {
            feedbackEmail.value = user.email;
        }
    };

    // Initialize page
    loadPopularTags();
});