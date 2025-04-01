// Preview File JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const fileTitle = document.getElementById('file-title');
    const fileStatus = document.getElementById('file-status');
    const statusText = document.getElementById('status-text');
    const authorName = document.getElementById('author-name');
    const fileDate = document.getElementById('file-date');
    const visibilityIcon = document.getElementById('visibility-icon');
    const visibilityText = document.getElementById('visibility-text');
    const rejectionReason = document.getElementById('rejection-reason');
    const rejectionText = document.getElementById('rejection-text');
    const tagsContainer = document.getElementById('tags-container');
    const mdContent = document.getElementById('md-content');
    const viewCount = document.getElementById('view-count');
    const likeCount = document.getElementById('like-count');
    const starCount = document.getElementById('star-count');
    const likeBtn = document.getElementById('like-btn');
    const starBtn = document.getElementById('star-btn');
    const shareBtn = document.getElementById('share-btn');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const backBtn = document.getElementById('back-btn');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    const deleteFileName = document.getElementById('delete-file-name');
    const shareModal = document.getElementById('share-modal');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const rejectionBox = document.getElementById('rejection-box');

    // Get file ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('id');
    const isPending = urlParams.get('pending') === 'true';
    const isRejected = urlParams.get('rejected') === 'true';

    if(isPending) {
        rejectionBox.style.display = "none";

    }

    // File data
    let fileData = null;
    let isOwner = false;
    let isLiked = false;
    let isStarred = false;

    // Check if user is authenticated
    function checkAuth() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    loadFileData(user);
                } else {
                    showAuthAlert();
                }
            });
        } else {
            // Firebase not loaded yet, try again
            setTimeout(checkAuth, 500);
        }
    }

    // Show auth alert
    function showAuthAlert() {
        mdContent.innerHTML = `
            <div class="auth-alert">
                <span class="material-icons">lock</span>
                <p>Please <a href="#" id="login-link">log in</a> to view this file.</p>
            </div>
        `;

        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof auth !== 'undefined' && typeof auth.openLoginModal === 'function') {
                    auth.openLoginModal();
                } else {
                    window.location.href = 'index.html?login=true';
                }
            });
        }
    }

    // Load file data
    async function loadFileData(user) {
        try {
            let filePath = '';
            
            // Determine which database to query based on file status
            if (isPending) {
                filePath = `pending_mdfiles/${fileId}`;
            } else if (isRejected) {
                filePath = `rejected_mdfiles/${fileId}`;
            } else {
                filePath = `mdfiles/${fileId}`;
            }

            // Fetch file data
            const snapshot = await database.ref(filePath).once('value');
            fileData = snapshot.val();

            if (!fileData) {
                mdContent.innerHTML = '<div class="error-msg">File not found</div>';
                return;
            }

            // Check if user is file owner
            isOwner = user.uid === fileData.userId;

            // Show/hide edit and delete buttons based on ownership
            if (isOwner) {
                editBtn.classList.remove('hidden');
                deleteBtn.classList.remove('hidden');
            } else {
                editBtn.classList.add('hidden');
                deleteBtn.classList.add('hidden');
            }

            // Set file title
            fileTitle.textContent = fileData.title;

            // Set file status and style
            fileStatus.className = 'status-badge ' + (fileData.status || 'approved');
            statusText.textContent = fileData.status ? fileData.status.charAt(0).toUpperCase() + fileData.status.slice(1) : 'Approved';

            // Set author name
            authorName.textContent = fileData.userDisplayName || 'Anonymous';

            // Set file date
            const date = new Date(fileData.timestamp);
            fileDate.textContent = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });

            // Set visibility
            visibilityIcon.textContent = fileData.visibility === 'public' ? 'public' : 'lock';
            visibilityText.textContent = fileData.visibility === 'public' ? 'Public' : 'Private';

            // Show rejection reason if applicable
            if (fileData.status === 'rejected' && fileData.rejectionReason) {
                rejectionText.textContent = fileData.rejectionReason;
                rejectionReason.classList.remove('hidden');
            } else {
                rejectionReason.classList.add('hidden');
            }

            // Set tags
            if (fileData.tags && fileData.tags.length > 0) {
                tagsContainer.innerHTML = '';
                fileData.tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag';
                    tagElement.textContent = tag;
                    tagsContainer.appendChild(tagElement);
                });
            } else {
                tagsContainer.innerHTML = '<span class="no-tags">No tags</span>';
            }

            // Set content
            mdContent.innerHTML = marked.parse(fileData.content);

            // Set stats
            viewCount.textContent = fileData.views || 0;
            likeCount.textContent = fileData.likes || 0;
            starCount.textContent = fileData.stars || 0;

            // Check if user has liked or starred the file
            if (!isPending && !isRejected) {
                const likesRef = database.ref(`user_likes/${user.uid}/${fileId}`);
                const starsRef = database.ref(`user_stars/${user.uid}/${fileId}`);
                
                const likesSnapshot = await likesRef.once('value');
                const starsSnapshot = await starsRef.once('value');
                
                isLiked = likesSnapshot.exists();
                isStarred = starsSnapshot.exists();
                
                updateLikeButton();
                updateStarButton();
            }

            // If not pending or rejected, increment view count
            if (!isPending && !isRejected && !isOwner) {
                await database.ref(`mdfiles/${fileId}/views`).transaction(currentViews => {
                    return (currentViews || 0) + 1;
                });
            }

        } catch (error) {
            console.error('Error loading file:', error);
            mdContent.innerHTML = `<div class="error-msg">Error loading file: ${error.message}</div>`;
        }
    }

    // Update like button state
    function updateLikeButton() {
        if (isLiked) {
            likeBtn.innerHTML = '<span class="material-icons">favorite</span>';
            likeBtn.classList.add('active');
        } else {
            likeBtn.innerHTML = '<span class="material-icons">favorite_border</span>';
            likeBtn.classList.remove('active');
        }
    }

    // Update star button state
    function updateStarButton() {
        if (isStarred) {
            starBtn.innerHTML = '<span class="material-icons">star</span>';
            starBtn.classList.add('active');
        } else {
            starBtn.innerHTML = '<span class="material-icons">star_border</span>';
            starBtn.classList.remove('active');
        }
    }

    // Toggle like
    async function toggleLike() {
        if (!fileData || isPending || isRejected) return;
        
        const user = firebase.auth().currentUser;
        if (!user) {
            if (typeof auth !== 'undefined' && typeof auth.openLoginModal === 'function') {
                auth.openLoginModal();
            }
            return;
        }

        try {
            const likesRef = database.ref(`user_likes/${user.uid}/${fileId}`);
            
            if (isLiked) {
                // Unlike
                await likesRef.remove();
                await database.ref(`mdfiles/${fileId}/likes`).transaction(currentLikes => {
                    return Math.max((currentLikes || 0) - 1, 0);
                });
                isLiked = false;
            } else {
                // Like
                await likesRef.set(true);
                await database.ref(`mdfiles/${fileId}/likes`).transaction(currentLikes => {
                    return (currentLikes || 0) + 1;
                });
                isLiked = true;
            }
            
            // Update button state
            updateLikeButton();
            
            // Update display count
            const likesSnapshot = await database.ref(`mdfiles/${fileId}/likes`).once('value');
            likeCount.textContent = likesSnapshot.val() || 0;
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    // Toggle star
    async function toggleStar() {
        if (!fileData || isPending || isRejected) return;
        
        const user = firebase.auth().currentUser;
        if (!user) {
            if (typeof auth !== 'undefined' && typeof auth.openLoginModal === 'function') {
                auth.openLoginModal();
            }
            return;
        }

        try {
            const starsRef = database.ref(`user_stars/${user.uid}/${fileId}`);
            
            if (isStarred) {
                // Unstar
                await starsRef.remove();
                await database.ref(`mdfiles/${fileId}/stars`).transaction(currentStars => {
                    return Math.max((currentStars || 0) - 1, 0);
                });
                isStarred = false;
            } else {
                // Star
                await starsRef.set(true);
                await database.ref(`mdfiles/${fileId}/stars`).transaction(currentStars => {
                    return (currentStars || 0) + 1;
                });
                isStarred = true;
            }
            
            // Update button state
            updateStarButton();
            
            // Update display count
            const starsSnapshot = await database.ref(`mdfiles/${fileId}/stars`).once('value');
            starCount.textContent = starsSnapshot.val() || 0;
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    }

    // Open delete modal
    function openDeleteModal() {
        if (!fileData) return;
        
        deleteFileName.textContent = fileData.title;
        deleteModal.classList.remove('hidden');
    }

    // Close delete modal
    function closeDeleteModal() {
        deleteModal.classList.add('hidden');
    }

    // Delete file
    async function deleteFile() {
        if (!fileData) return;
        
        try {
            // Determine which database to delete from
            let filePath = '';
            if (isPending) {
                filePath = `pending_mdfiles/${fileId}`;
            } else if (isRejected) {
                filePath = `rejected_mdfiles/${fileId}`;
            } else {
                filePath = `mdfiles/${fileId}`;
            }
            
            // Delete from Firebase
            await database.ref(filePath).remove();
            
            // Delete from Supabase storage
            await supabaseClient
                .storage
                .from('mdfiles')
                .remove([`${fileId}.md`]);
            
            // Close modal
            closeDeleteModal();
            
            // Redirect to my files page
            window.location.href = 'my-files.html?deleted=true';
        } catch (error) {
            console.error('Error deleting file:', error);
            alert(`Error deleting file: ${error.message}`);
        }
    }

    // Open share modal
    function openShareModal() {
        if (!fileData) return;
        
        // Set share link
        const fileUrl = `${window.location.origin}/view-file.html?id=${fileId}`;
        shareLink.value = fileUrl;
        
        // Show modal
        shareModal.classList.remove('hidden');
    }

    // Close share modal
    function closeShareModal() {
        shareModal.classList.add('hidden');
    }

    // Copy share link
    function copyShareLink() {
        shareLink.select();
        document.execCommand('copy');
        
        // Show feedback
        copyLinkBtn.innerHTML = '<span class="material-icons">check</span>';
        setTimeout(() => {
            copyLinkBtn.innerHTML = '<span class="material-icons">content_copy</span>';
        }, 2000);
    }

    // Event listeners
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    if (likeBtn) {
        likeBtn.addEventListener('click', toggleLike);
    }

    if (starBtn) {
        starBtn.addEventListener('click', toggleStar);
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', openShareModal);
    }

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (isPending) {
                window.location.href = `edit-file.html?id=${fileId}&pending=true`;
            } else if (isRejected) {
                window.location.href = `edit-file.html?id=${fileId}&rejected=true`;
            } else {
                window.location.href = `edit-file.html?id=${fileId}`;
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', openDeleteModal);
    }

    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteFile);
    }

    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeDeleteModal);
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyShareLink);
    }

    // Close modals when clicking the X
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            deleteModal.classList.add('hidden');
            shareModal.classList.add('hidden');
        });
    });

    // Initialize page
    checkAuth();

    // Handle user authentication callback
    window.onUserAuthenticated = function(user) {
        loadFileData(user);
    };

    // Handle user signed out callback
    window.onUserSignedOut = function() {
        showAuthAlert();
    };
});