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
    const fullScreenBtn = document.getElementById("fullScreen-btn") 
    const downloadPdfBtn = document.getElementById("pdf-download-btn")

    

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

    function openFullscreen() {
        if (!currentFile) return;
        
        // Construct the embed URL with the current file ID
        const fileUrl = `${window.location.origin}/embed.html?id=${fileId}`;
        
        // Redirect to the embed page
        window.location.href = fileUrl;
    }

    // Add event listener for the fullscreen button
   
    if (fullScreenBtn) {
        fullScreenBtn.addEventListener('click', 
            ()=> {
                openFullscreen();
            }
        );
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
    if (fileTags) {
        fileTags.innerHTML = '';
        
        let tags = [];
        
        if (file.tags && file.tags.length > 0) {
            tags = Array.isArray(file.tags) ? file.tags : file.tags.split(',').map(tag => tag.trim());
        } else if (file.aiSuggestedTags && file.aiSuggestedTags.length > 0) {
            tags = Array.isArray(file.aiSuggestedTags) ? file.aiSuggestedTags : file.aiSuggestedTags.split(',').map(tag => tag.trim());
        }
        
        tags.forEach(tag => {
            if (tag) {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    window.location.href = `search.html?q=${encodeURIComponent(tag)}`;
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
        
        // Process math expressions if MathJax is available
        if (window.MathJax) {
            MathJax.typeset();
        } else {
            // Dynamically load MathJax if not already available
            loadMathJax();
        }
    } catch (error) {
        console.error('Error rendering markdown:', error);
        markdownContent.innerHTML = `<p>Error rendering markdown: ${error.message}</p>`;
    }
}

// Helper function to load MathJax
function loadMathJax() {
    // Create script element for MathJax
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;
    
    // Configure MathJax before loading
    window.MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\(', '\\)']],
            displayMath: [['$$', '$$'], ['\\[', '\\]']],
            processEscapes: true
        },
        svg: {
            fontCache: 'global'
        },
        options: {
            renderActions: {
                addMenu: []
            }
        },
        startup: {
            pageReady: () => {
                MathJax.typeset();
            }
        }
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    
    // Add event listener to reprocess math when script is loaded
    script.onload = function() {
        if (window.MathJax) {
            MathJax.typeset();
        }
    };
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
        
        // Set share link ${window.location.origin}/embed.html?id=${fileId}
        const fileUrl = `${window.location.origin}/view-file.html?id=${fileId}`;
        const fileUrlE = `${window.location.origin}/embed.html?id=${fileId}`;

        shareLink.value = fileUrl;
        
        // Set embed code
        embedCode.value = `<iframe src="${fileUrlE}&embed=true" width="100%" height="500" frameborder="0"></iframe>`;
        
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

    // Add this to your viewer.js file, alongside the other functions
// Function to download the markdown content as PDF
async function downloadAsPdf() {
    if (!currentFile) return;
   
    try {
        // Store original button HTML and show initial loading state
        const originalBtnHtml = downloadPdfBtn.innerHTML;
        downloadPdfBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Preparing... 0%';
        downloadPdfBtn.disabled = true;
        
        // Helper function to update progress indicator
       // Helper function to update progress indicator with animated dots
const updateProgress = (percentage, message) => {
    if (!downloadPdfBtn) return;
    
    // Clear any existing animation
    if (window.progressAnimation) {
        clearInterval(window.progressAnimation);
    }
    
    // Initialize dot animation
    let dotCount = 0;
    const baseText = message ? `${message} ${percentage}%` : `Generating PDF... ${percentage}%`;
    if(percentage == 100){return}
    // Create animation interval
    window.progressAnimation = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        const dots = '.'.repeat(dotCount);
        const progressText = `${baseText}${dots}`;
        downloadPdfBtn.innerHTML = `<span class="material-icons">hourglass_top</span> ${progressText}`;
    }, 300);
    
    // Initial update
    downloadPdfBtn.innerHTML = `<span class="material-icons">hourglass_top</span> ${baseText}`;
};
       
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true,
            compress: true
        });
       
        updateProgress(10, 'Setting up document...');
       
        // Set document properties
        doc.setProperties({
            title: currentFile.title,
            subject: 'Markdown Document',
            author: currentFile.userDisplayName || 'MDHub User',
            keywords: currentFile.tags ? currentFile.tags.join(', ') : '',
            creator: 'MDHub'
        });
        
        // IMPROVED: Chunking approach for large documents
        // Create a clone of the content for manipulation
        const contentClone = markdownContent.cloneNode(true);
        const container = document.createElement('div');
        container.appendChild(contentClone);
        
        updateProgress(20, 'Processing content...');
        
        // Clean up MathJax elements
        // Clean up MathJax elements function integrated here
        const cleanupMathJaxElements = (container) => {
            // 1. First pass - Remove all preview elements and script elements
            container.querySelectorAll('.MathJax_Preview, script[type="math/tex"], script[type="math/tex; mode=display"]').forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
            
            // 2. Handle display equations (block equations)
            container.querySelectorAll('.MathJax_Display').forEach(displayEl => {
                if (!displayEl) return;
                
                // Find all MathJax elements inside this container
                const mathJaxElements = displayEl.querySelectorAll('.MathJax');
                
                if (mathJaxElements && mathJaxElements.length > 0) {
                    // Keep only the first rendered MathJax element
                    const elementToKeep = mathJaxElements[0];
                    
                    // Remove ALL children from the display container
                    while (displayEl.firstChild) {
                        displayEl.removeChild(displayEl.firstChild);
                    }
                    
                    // Add back only the element we want to keep
                    if (elementToKeep) {
                        displayEl.appendChild(elementToKeep.cloneNode(true));
                    }
                }
            });
            
            // 3. Handle inline equations - A more direct approach
            container.querySelectorAll('.MathJax').forEach(mathEl => {
                if (!mathEl) return;
                
                // Skip if already inside a cleaned MathJax_Display
                const parent = mathEl.parentNode;
                if (!parent || parent.classList.contains('MathJax_Display')) return;
                
                // Find and remove any duplicate MathJax elements in the same container
                const siblings = parent.querySelectorAll('.MathJax');
                if (siblings.length > 1) {
                    // Keep only the first MathJax element
                    for (let i = 1; i < siblings.length; i++) {
                        if (siblings[i] && parent.contains(siblings[i])) {
                            parent.removeChild(siblings[i]);
                        }
                    }
                }
            });
            
            // 4. Remove any remaining hidden or auxiliary MathJax elements
            container.querySelectorAll('.MathJax_Hidden, .MathJax_strut, .MathJax_Error').forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
            
            // Fix code blocks and pre-formatting for PDF
            container.querySelectorAll('pre code').forEach(block => {
                if (block) {
                    block.style.whiteSpace = 'pre-wrap';
                    block.style.wordBreak = 'break-word';
                }
            });
            
            // Fix image sizes
            container.querySelectorAll('img').forEach(img => {
                if (img) {
                    img.style.maxWidth = '100%';
                    if (img.width > 500) {
                        img.style.width = '500px';
                    }
                }
            });
        };
        
        cleanupMathJaxElements(container);
        
        // Apply PDF-specific styling to the clone
        // Apply PDF styling function integrated here
        const applyPdfStyling = (container) => {
            const style = document.createElement('style');
            style.textContent = `
            * {
                color: #2D3748;
            }
            body {
                font-family: 'Inter', -apple-system, sans-serif;
                line-height: 1.5;
                color: #2D3748;
                background-color: white;
                padding: 20px;
            }
            pre, code {
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
                background-color: #F1F5F9;
                border-radius: 4px;
            }
            pre {
                padding: 10px;
                overflow-x: hidden;
                max-width: 100%;
                white-space: pre-wrap;
            }
            img {
                max-width: 100%;
                height: auto;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin: 15px 0;
            }
            th, td {
                border: 1px solid #E2E8F0;
                padding: 8px 12px;
                text-align: left;
            }
            th {
                background-color: #F7FAFC;
                font-weight: bold;
            }
            blockquote {
                border-left: 4px solid #8E9BF5;
                padding: 5px 0 5px 15px;
                margin: 15px 0;
                background-color: #F7FAFC;
                border-radius: 0 4px 4px 0;
            }
            a {
                color: #5C6BC0;
                text-decoration: none;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #1A202C;
                margin-top: 20px;
                margin-bottom: 10px;
                line-height: 1.3;
            }
            .mermaid, canvas, svg {
                max-width: 100%;
            }
            /* Improved MathJax styling for PDF */
            .MathJax_Display {
                margin: 10px 0 !important;
                text-align: center !important;
                position: relative !important;
            }
            .MathJax {
                display: inline-block !important;
                margin: 0 3px !important;
            }
            .inline-math {
                display: inline-block;
                margin: 0 2px;
            }
            `;
            container.prepend(style);
        };
        
        applyPdfStyling(container);
        
        // Add to document body temporarily to ensure proper rendering
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '170mm'; // Slightly narrower than A4 to account for margins
        tempDiv.appendChild(container);
        document.body.appendChild(tempDiv);
        
        updateProgress(30, 'Preparing layout...');
        
        // IMPROVED: Progressive rendering for large documents
        // Estimate content size to determine if chunking is needed
        const contentSize = tempDiv.innerHTML.length;
        const needsChunking = contentSize > 500000; // Threshold for large documents (adjust as needed)
        
        // Add title page - function integrated here
        const createTitlePage = (doc, currentFile) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(26, 32, 44); // Dark heading color
            
            // Center the title
            const titleWidth = doc.getStringUnitWidth(currentFile.title) * 24 / doc.internal.scaleFactor;
            const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
            doc.text(currentFile.title, titleX > 0 ? titleX : 14, 60);
            
            // Add metadata with better formatting
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(113, 128, 150); // Muted text color
            
            const date = new Date(currentFile.timestamp);
            const dateString = `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
            const authorText = `Created by: ${currentFile.userDisplayName || 'MDHub User'}`;
            const dateText = `Date: ${dateString}`;
            
            doc.text(authorText, 14, 80);
            doc.text(dateText, 14, 88);
            
            // Add tags if available
            if (currentFile.tags && currentFile.tags.length > 0) {
                const tagsText = `Tags: ${Array.isArray(currentFile.tags) ? currentFile.tags.join(', ') : currentFile.tags}`;
                doc.text(tagsText, 14, 96);
            }
            
            // Add MDHub logo
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(92, 107, 192); // Primary color
            doc.text('MDHub', 14, 120);
            
            // Add divider
            doc.setDrawColor(226, 232, 240); // Border color
            doc.setLineWidth(0.5);
            doc.line(14, 130, 196, 130);
        };
        
        createTitlePage(doc, currentFile);
        
        // Start content on a new page with consistent text settings
        doc.addPage();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(45, 55, 72); // Text color
        
        updateProgress(40, 'Rendering content...');
        
        // Define constants used by both processing methods
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margins = 20; // mm margins
        const contentWidth = pageWidth - (margins * 2);
        
        if (needsChunking) {
            // Process large documents in chunks
            // Get child elements to split into manageable chunks
            const children = Array.from(tempDiv.firstChild.children);
            const chunks = [];
            let currentChunk = [];
            let currentSize = 0;
            const MAX_CHUNK_SIZE = 150000; // Size threshold for each chunk
            
            updateProgress(45, 'Chunking document');
            
            // Create chunks based on estimated size
            for (const child of children) {
                const childSize = child.outerHTML.length;
                if (currentSize + childSize > MAX_CHUNK_SIZE && currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = [child];
                    currentSize = childSize;
                } else {
                    currentChunk.push(child);
                    currentSize += childSize;
                }
            }
            
            // Add any remaining elements as the last chunk
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            
            // Process each chunk
            for (let i = 0; i < chunks.length; i++) {
                // Calculate and show progress based on chunk position
                const chunkProgress = Math.floor(50 + ((i / chunks.length) * 40));
                updateProgress(chunkProgress, `Processing section ${i+1}/${chunks.length}`);
                
                // Create a temporary container for this chunk
                const chunkContainer = document.createElement('div');
                chunkContainer.style.width = '170mm';
                
                // Add the CSS style from the original container
                const style = tempDiv.querySelector('style');
                if (style) {
                    chunkContainer.appendChild(style.cloneNode(true));
                }
                
                // Add the chunk's elements
                chunks[i].forEach(element => {
                    chunkContainer.appendChild(element.cloneNode(true));
                });
                
                // Create a temporary div for this chunk
                const chunkDiv = document.createElement('div');
                chunkDiv.style.position = 'absolute';
                chunkDiv.style.left = '-9999px';
                chunkDiv.style.width = '170mm';
                chunkDiv.appendChild(chunkContainer);
                document.body.appendChild(chunkDiv);
                
                // Wait for rendering
                await new Promise(resolve => setTimeout(resolve, 800));
                
                try {
                    // Render this chunk
                    const canvas = await html2canvas(chunkDiv, {
                        scale: 1.5,
                        useCORS: true,
                        logging: false,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        windowWidth: 1200,
                        // Avoid OOM errors
                        x: 0,
                        y: 0,
                        width: chunkDiv.scrollWidth,
                        height: chunkDiv.scrollHeight
                    });
                    
                    // Scale the image to fit within page width
                    const imgWidth = contentWidth;
                    const imgHeight = canvas.height * contentWidth / canvas.width;
                    
                    // Add new page for each chunk except the first one
                    if (i > 0) {
                        doc.addPage();
                    }
                    
                    // Add the content image
                    const imgData = canvas.toDataURL('image/jpeg', 0.92);
                    
                    // Add the chunk image across multiple pages if needed
                    let heightLeft = imgHeight;
                    let position = 0;
                    
                    // First page of chunk
                    doc.addImage(
                        imgData,
                        'JPEG',
                        margins,
                        margins,
                        imgWidth,
                        imgHeight,
                        'chunk' + i,
                        'FAST'
                    );
                    
                    // If content doesn't fit on one page, split it across multiple pages
                    heightLeft -= (pageHeight - margins * 2);
                    position += (pageHeight - margins * 2);
                    
                    while (heightLeft > 0) {
                        doc.addPage();
                        doc.addImage(
                            imgData,
                            'JPEG',
                            margins,
                            -(position) + margins,
                            imgWidth,
                            imgHeight,
                            'chunk' + i + '_continued',
                            'FAST'
                        );
                        heightLeft -= (pageHeight - margins * 2);
                        position += (pageHeight - margins * 2);
                    }
                } catch (error) {
                    console.error(`Error processing chunk ${i}:`, error);
                    // Add error message to PDF instead of failing completely
                    doc.addPage();
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(220, 38, 38); // Red color for error
                    doc.text(`Error processing content section ${i+1}: ${error.message}`, margins, margins + 10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(45, 55, 72); // Reset text color
                }
                
                // Clean up
                document.body.removeChild(chunkDiv);
            }
        } else {
            // Process standard (smaller) documents
            // Wait longer for complex content to render
            updateProgress(50, 'Rendering');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Use html2canvas with optimized settings
            updateProgress(60, 'Capturing content');
            const canvas = await html2canvas(tempDiv, {
                scale: 1.5, // Reduced scale for better performance
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff',
                windowWidth: 1200,
                onclone: function(clonedDoc) {
                    // Additional processing if needed for the clone
                },
                // Avoid OOM errors on large pages
                x: 0,
                y: 0,
                width: tempDiv.scrollWidth,
                height: tempDiv.scrollHeight
            });
            
            updateProgress(70, 'Adding to document');
            
            // Scale the image to fit within page width while maintaining aspect ratio
            const imgWidth = contentWidth;
            const imgHeight = canvas.height * contentWidth / canvas.width;
            
            // Add the content image across multiple pages if needed
            let heightLeft = imgHeight;
            let position = 0;
            let pageCount = 1;
            
            // First page already added
            doc.addImage(
                canvas.toDataURL('image/jpeg', 0.92), // Slightly reduce quality for better performance
                'JPEG',
                margins,
                margins,
                imgWidth,
                imgHeight,
                'content',
                'FAST'
            );
            
            // If content doesn't fit on one page, split it across multiple pages
            heightLeft -= (pageHeight - margins * 2);
            position += (pageHeight - margins * 2);
            
            updateProgress(80, 'Adding pages');
            
            while (heightLeft > 0) {
                doc.addPage();
                pageCount++;
                doc.addImage(
                    canvas.toDataURL('image/jpeg', 0.92),
                    'JPEG',
                    margins,
                    -(position) + margins,
                    imgWidth,
                    imgHeight,
                    'content' + pageCount,
                    'FAST'
                );
                heightLeft -= (pageHeight - margins * 2);
                position += (pageHeight - margins * 2);
            }
        }
        
        // Remove the temporary element
        document.body.removeChild(tempDiv);
        
        updateProgress(90, 'Finalizing document...');
        
        // Add page numbers at the bottom - function integrated here
        const addPageNumbers = (doc) => {
            const totalPages = doc.internal.getNumberOfPages();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(113, 128, 150); // Muted text color
                doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
            }
        };
        
        addPageNumbers(doc);
        
        updateProgress(95, 'Saving file...');
        
        // Save the PDF
        doc.save(`${currentFile.title}.pdf`);
        
        // Complete progress and restore button
        updateProgress(100, 'Complete!');
        
        // Restore button state after a short delay to show completion
        setTimeout(() => {
            downloadPdfBtn.innerHTML = originalBtnHtml;
            downloadPdfBtn.disabled = false;
        }, 1000);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Error generating PDF: ${error.message}. Make sure the PDF libraries are loaded.`);
        
        // Restore button state
        if (downloadPdfBtn) {
            downloadPdfBtn.innerHTML = '<span class="material-icons">file_download</span> Save as pdf';
            downloadPdfBtn.disabled = false;
        }
    }
}

// Add this to your event listeners section
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', downloadAsPdf);
}

});
