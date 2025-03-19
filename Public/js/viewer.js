// View File Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Viewer elements
    const fileTitle = document.getElementById('file-title');
    const breadcrumbTitle = document.getElementById('breadcrumb-title');
    const authorInfo = document.getElementById('author-info');
    const dateInfo = document.getElementById('date-info');
    const fileTags = document.getElementById('file-tags');
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    const starBtn = document.getElementById('star-btn');
    const starCount = document.getElementById('star-count');
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-btn');
    const editBtn = document.getElementById('edit-btn');
    const markdownContent = document.getElementById('markdown-content');
    const tocList = document.getElementById('toc-list');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const submitComment = document.getElementById('submit-comment');
    const commentsList = document.getElementById('comments-list');
    const commentCount = document.getElementById('comment-count');
    const shareModal = document.getElementById('share-modal');
    const shareLink = document.getElementById('share-link');
    const embedCode = document.getElementById('embed-code');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const copyEmbedBtn = document.getElementById('copy-embed-btn');
    const newFileBtn = document.getElementById('new-file-btn');

    

    // Current file data
    let currentFile = null;
    
    // Get file ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('id');
    
    if (!fileId) {
        showError('No file ID provided');
        return;
    }
    
    // Event listeners

    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            window.location.href = 'create-file.html';
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
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadFile);
    }
    
    if (editBtn) {
        editBtn.addEventListener('click', editFile);
    }
    
    if (submitComment) {
        submitComment.addEventListener('click', addComment);
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyToClipboard.bind(null, shareLink));
    }
    
    if (copyEmbedBtn) {
        copyEmbedBtn.addEventListener('click', copyToClipboard.bind(null, embedCode));
    }
    
    // Close buttons for modals
    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });
    
    // Load file
    loadFile();
    
    // Functions
    async function loadFile() {
        try {
            // Show loading state
            if (markdownContent) {
                markdownContent.innerHTML = '<div class="loading-spinner"></div>';
            }
            
            // Get file from Firebase
            const snapshot = await database.ref(`mdfiles/${fileId}`).once('value');
            const file = snapshot.val();
            
            if (!file) {
                showError('File not found');
                return;
            }
            
            currentFile = file;
            
            // Update view count
            incrementViewCount(fileId);
            
            // Render file details
            renderFileDetails(file);
            
            // Render markdown content
            renderMarkdownContent(file.content);
            
            // Generate table of contents
            generateTableOfContents();
            
            // Load comments
            loadComments();
            
            // Check if current user is the file owner
            checkFileOwnership(file.userId);
            
            // Check if user has liked/starred the file
            checkUserInteractions();
        } catch (error) {
            console.error('Error loading file:', error);
            showError('Error loading file');
        }
    }
    
    // Render file details
   // Render file details
function renderFileDetails(file) {

    if (fileTitle) fileTitle.textContent = file.title;
    if (breadcrumbTitle) breadcrumbTitle.textContent = file.title;
    

    // Author info
if (authorInfo) {
    
    let authorDisplay = '';
    let authorIcon = 'account_circle';
    let authorClass = 'material-icons';
    let verifiedIcon = '';
    
    if (file.userId === "MDHub") {
        authorDisplay = 'MDHub';
        authorIcon = 'graph_6';
        authorClass = 'material-symbols-outlined';
        verifiedIcon = '<span class="material-icons check">verified</span>';
    } else if (file.userProvider === "google.com") {
        // For Google users with display names
        authorDisplay = file.userDisplayName || `Google User (${file.userId.substring(0, 6)}...)`;
        authorIcon = 'person';
        verifiedIcon = '<span class="material-icons check">verified_user</span>';
        
        // Add user photo if available
        if (file.userPhotoURL) {
            authorIcon = '';
            authorClass = '';
            authorInfo.innerHTML = `
                <img src="${file.userPhotoURL}" alt="${authorDisplay}" class="user-avatar" width="24" height="24">
                ${authorDisplay}
                <span class="material-icons check">verified_user</span>
            `;
          
            // Remove this line below - it's causing the early exit
            // return; // Exit early if we're using photo
        }
    } else if (file.userDisplayName) {
        // For other users with display names
        authorDisplay = file.userDisplayName;
        verifiedIcon = '<span class="material-icons check">person</span>';
    } else {
        // For anonymous users
        authorDisplay = `Anonymous (${file.userId.substring(0, 6)}...)`;
    }
   
    
    // Only set innerHTML if it wasn't already set for photo URL case
    if (!(file.userProvider === "google.com" && file.userPhotoURL)) {
        authorInfo.innerHTML = `
            ${authorClass ? `<span class="${authorClass}">${authorIcon}</span>` : ''}
            ${authorDisplay}
            ${verifiedIcon}
        `;
    }
   
}


    
    // Date info
    if (dateInfo) {
        const date = new Date(file.timestamp);
        

        dateInfo.innerHTML = `
            <span class="material-icons">event</span>
            <span>${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</span>
        `;
    }
    
    // Tags
    if (fileTags && file.tags) {
        fileTags.innerHTML = '';
        
        const tags = Array.isArray(file.tags) ? file.tags : file.tags.split(',').map(tag => tag.trim());
        tags.forEach(tag => {
            if (tag) {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    window.location.href = `search.html?tag=${encodeURIComponent(tag)}`;
                });
                fileTags.appendChild(tagElement);
            }
        });
    }
    
    // Like and star counts
    if (likeCount) likeCount.textContent = file.likes || 0;
    if (starCount) starCount.textContent = file.stars || 0;
}
    
    // Render markdown content
    function renderMarkdownContent(content) {
        if (!markdownContent) return;
        
        try {
            // Use marked.js to render markdown
            markdownContent.innerHTML = marked.parse(content);
            localStorage.setItem("mdContent", marked.parse(content));
             // Get the current URL
            const urlParams = new URLSearchParams(window.location.search);

                // Check if "embed=true" exists
            if (urlParams.get("embed") === "true") {
                    // Redirect to another page
                    window.location.href = "embed.html";
            }  

            
            // Add syntax highlighting if available
            if (window.hljs) {
                document.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightBlock(block);
                });
            }
        } catch (error) {
            console.error('Error rendering markdown:', error);
            markdownContent.innerHTML = `<p>Error rendering markdown: ${error.message}</p>`;
        }
    }
    
    // Generate table of contents
    function generateTableOfContents() {
        if (!tocList || !markdownContent) return;
        
        tocList.innerHTML = '';
        
        // Get all headings
        const headings = markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        if (headings.length === 0) {
            tocList.innerHTML = '<p>No headings found</p>';
            return;
        }
        
        // Create TOC items
        headings.forEach((heading, index) => {
            // Create unique ID for heading if it doesn't have one
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }
            
            const tocItem = document.createElement('a');
            tocItem.href = `#${heading.id}`;
            tocItem.className = `toc-item toc-${heading.tagName.toLowerCase()}`;
            tocItem.textContent = heading.textContent;
            
            tocList.appendChild(tocItem);
        });
    }
    
    // Increment view count
    async function incrementViewCount(fileId) {
        try {
            const viewCountRef = database.ref(`mdfiles/${fileId}/views`);
            await viewCountRef.transaction(currentViews => {
                return (currentViews || 0) + 1;
            });
        } catch (error) {
            console.error('Error updating view count:', error);
        }
    }
    
    // Check if current user is the file owner
    function checkFileOwnership(fileUserId) {
        if (editBtn) {
            if (currentUser && currentUser.uid === fileUserId) {
                editBtn.style.display = 'inline-block';
            } else {
                editBtn.style.display = 'none';
            }
        }
    }
    
    // Check if user has liked/starred the file
    async function checkUserInteractions() {
        if (!currentUser) return;
        
        try {
            // Check likes
            const likeRef = database.ref(`user_likes/${currentUser.uid}/${fileId}`);
            const likeSnapshot = await likeRef.once('value');
            const hasLiked = likeSnapshot.val();
            
            if (likeBtn && hasLiked) {
                likeBtn.querySelector('.material-icons').textContent = 'favorite';
                likeBtn.classList.add('active');
            }
            
            // Check stars
            const starRef = database.ref(`user_stars/${currentUser.uid}/${fileId}`);
            const starSnapshot = await starRef.once('value');
            const hasStarred = starSnapshot.val();
            
            if (starBtn && hasStarred) {
                starBtn.querySelector('.material-icons').textContent = 'star';
                starBtn.classList.add('active');
            }
        } catch (error) {
            console.error('Error checking user interactions:', error);
        }
    }
    
    // Toggle like
    async function toggleLike() {
        if (!currentUser) {
            auth.openLoginModal();
            return;
        }
        
        if (!currentFile) return;
        
        try {
            const likeRef = database.ref(`user_likes/${currentUser.uid}/${fileId}`);
            const likeSnapshot = await likeRef.once('value');
            const hasLiked = likeSnapshot.val();
            
            if (hasLiked) {
                // Unlike
                await likeRef.remove();
                await database.ref(`mdfiles/${fileId}/likes`).transaction(currentLikes => {
                    return Math.max((currentLikes || 0) - 1, 0);
                });
                
                likeBtn.querySelector('.material-icons').textContent = 'favorite_border';
                likeBtn.classList.remove('active');
            } else {
                // Like
                await likeRef.set(true);
                await database.ref(`mdfiles/${fileId}/likes`).transaction(currentLikes => {
                    return (currentLikes || 0) + 1;
                });
                
                likeBtn.querySelector('.material-icons').textContent = 'favorite';
                likeBtn.classList.add('active');
            }
            
            // Update like count display
            const likesSnapshot = await database.ref(`mdfiles/${fileId}/likes`).once('value');
            likeCount.textContent = likesSnapshot.val() || 0;
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }
    
    // Toggle star
    async function toggleStar() {
        if (!currentUser) {
            auth.openLoginModal();
            return;
        }
        
        if (!currentFile) return;
        
        try {
            const starRef = database.ref(`user_stars/${currentUser.uid}/${fileId}`);
            const starSnapshot = await starRef.once('value');
            const hasStarred = starSnapshot.val();
            
            if (hasStarred) {
                // Unstar
                await starRef.remove();
                await database.ref(`mdfiles/${fileId}/stars`).transaction(currentStars => {
                    return Math.max((currentStars || 0) - 1, 0);
                });
                
                starBtn.querySelector('.material-icons').textContent = 'star_border';
                starBtn.classList.remove('active');
            } else {
                // Star
                await starRef.set(true);
                await database.ref(`mdfiles/${fileId}/stars`).transaction(currentStars => {
                    return (currentStars || 0) + 1;
                });
                
                starBtn.querySelector('.material-icons').textContent = 'star';
                starBtn.classList.add('active');
            }
            
            // Update star count display
            const starsSnapshot = await database.ref(`mdfiles/${fileId}/stars`).once('value');
            starCount.textContent = starsSnapshot.val() || 0;
        } catch (error) {
            console.error('Error toggling star:', error);
        }
    }
    
    // Open share modal
    function openShareModal() {
        if (!shareModal || !currentFile) return;
        
        // Set share link
        const fileUrl = `${window.location.origin}/view-file.html?id=${fileId}`;
        shareLink.value = fileUrl;
        
        // Set embed code
        embedCode.value = `<iframe src="${fileUrl}&embed=true" width="100%" height="500" frameborder="0"></iframe>`;
        
        // Update social links
        document.querySelector('.share-option.twitter').href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fileUrl)}&text=${encodeURIComponent(currentFile.title)}`;
        document.querySelector('.share-option.facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fileUrl)}`;
        document.querySelector('.share-option.linkedin').href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fileUrl)}`;
        
        // Show modal
        shareModal.classList.remove('hidden');
    }
    
    // Download file
    function downloadFile() {
        if (!currentFile) return;
        
        // Create blob from content
        const blob = new Blob([currentFile.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentFile.title}.md`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Edit file
    function editFile() {
        if (!currentFile) return;
        
        // Redirect to edit page
        window.location.href = `edit-file.html?id=${fileId}`;
    }
    
    // Load comments
    async function loadComments() {
        if (!commentsList || !commentCount) return;
        
        try {
            const commentsRef = database.ref(`file_comments/${fileId}`).orderByChild('timestamp');
            const snapshot = await commentsRef.once('value');
            const comments = snapshot.val();
            
            commentsList.innerHTML = '';
            
            if (!comments) {
                commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to comment!</div>';
                commentCount.textContent = '(0)';
                return;
            }
            
            // Convert to array and sort by timestamp
            const commentsArray = Object.entries(comments)
                .map(([id, comment]) => ({ id, ...comment }))
                .sort((a, b) => a.timestamp - b.timestamp);
            
            // Update comment count
            commentCount.textContent = `(${commentsArray.length})`;
            
            // Render comments
            commentsArray.forEach(comment => {
                renderComment(comment);
            });
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<div class="error-message">Error loading comments</div>';
        }
    }
    
    // Add comment
    async function addComment() {
        if (!currentUser) {
            auth.openLoginModal();
            return;
        }
        
        if (!commentInput || !commentInput.value.trim()) {
            return;
        }
        
        try {
            // Disable submit button
            if (submitComment) {
                submitComment.disabled = true;
            }
            
            // Create comment object
            const commentId = generateUniqueId();
            const comment = {
                id: commentId,
                userId: currentUser.uid,
                content: commentInput.value.trim(),
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Add Google user information if available
            if (currentUser.providerData && currentUser.providerData[0]) {
                const provider = currentUser.providerData[0].providerId;
                if (provider === 'google.com') {
                    comment.userProvider = 'google.com';
                    comment.userDisplayName = currentUser.displayName || null;
                    comment.userPhotoURL = currentUser.photoURL || null;
                }
            }
            
            // Save comment to Firebase
            await database.ref(`file_comments/${fileId}/${commentId}`).set(comment);
            
            // Clear input
            commentInput.value = '';
            
            // Reload comments
            loadComments();
        } catch (error) {
            console.error('Error adding comment:', error);
            alert(`Error adding comment: ${error.message}`);
        } finally {
            // Re-enable submit button
            if (submitComment) {
                submitComment.disabled = false;
            }
        }
    }
    
   
  
// Render a single comment
function renderComment(comment) {
    if (!commentsList) return;
    
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    
    const date = new Date(comment.timestamp);
    const relativeTime = getRelativeTime(date);

    // Determine comment author display
    let authorDisplay = '';
    let authorIcon = 'account_circle';
    let authorClass = 'material-icons';
    let verifiedIcon = '';
    let authorHtml = '';
    
    if (comment.userId === "MDHub") {
        authorDisplay = 'MDHub';
        authorIcon = 'graph_6';
        authorClass = 'material-symbols-outlined';
        verifiedIcon = '<span class="material-icons check">verified</span>';
    } else if (comment.userProvider === "google.com") {
        // For Google users with display names
        authorDisplay = comment.userDisplayName || `Google User (${comment.userId.substring(0, 6)}...)`;
        authorIcon = 'person';
        verifiedIcon = '<span class="material-icons check">verified_user</span>';
        
        // Add user photo if available
        if (comment.userPhotoURL) {
            authorHtml = `
                <div class="comment-author">
                    <img src="${comment.userPhotoURL}" alt="${authorDisplay}" class="user-avatar" width="24" height="24">
                    ${authorDisplay}
                    <span class="material-icons check">verified_user</span>
                </div>`;
        } 
    } else if (comment.userDisplayName) {
        // For other users with display names
        authorDisplay = comment.userDisplayName;
        verifiedIcon = '<span class="material-icons check">person</span>';
    } else {
        // For anonymous users
        authorDisplay = `Anonymous (${comment.userId.substring(0, 6)}...)`;
    }
    
    // If authorHtml wasn't set for photo URL case, set it now
    if (!authorHtml) {
        authorHtml = `
            <div class="comment-author">
                ${authorClass ? `<span class="${authorClass}">${authorIcon}</span>` : ''}
                ${authorDisplay}
                ${verifiedIcon}
            </div>`;
    }
    
    commentElement.innerHTML = `
        <div class="comment-header">
            ${authorHtml}
            <div class="comment-date">${relativeTime}</div>
        </div>
        <div class="comment-content">${marked.parse(comment.content)}</div>
    `;
    
    commentsList.appendChild(commentElement);
}
    

    // Copy to clipboard helper
    function copyToClipboard(element) {
        element.select();
        document.execCommand('copy');
        
        // Show feedback
        const btn = event.target.closest('button');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons">check</span> Copied!';
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    }
    
    // Helper function to get relative time string
    function getRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return date.toLocaleDateString();
    }
    
    // Show error message
    function showError(message) {
        if (markdownContent) {
            markdownContent.innerHTML = `<div class="error-message">${message}</div>`;
        }
        
        if (fileTitle) {
            fileTitle.textContent = 'Error';
        }
        
        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = 'Error';
        }
    }
    
    // Generate unique ID helper function
    function generateUniqueId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    // Handle user authentication callback
    window.onUserAuthenticated = function(user) {
        // Re-check file ownership if file is loaded
        if (currentFile) {
            checkFileOwnership(currentFile.userId);
            checkUserInteractions();
        }
    };
    
    // Handle user signed out callback
    window.onUserSignedOut = function() {
        // Update UI for logged out state
        if (editBtn) {
            editBtn.style.display = 'none';
        }
    };
});