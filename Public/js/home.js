// Home Page Specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Home page elements
    const trendingFiles = document.getElementById('trending-files');
    const recentFiles = document.getElementById('recent-files');
    const newFileBtn = document.getElementById('new-file-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const sortTrending = document.getElementById('sort-trending');
    const tagsListContainer = document.getElementById('tags-list');
    const searchInput = document.getElementById('search-input');

    // Event listeners
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            window.location.href = 'create-file.html';
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadRecentFiles();
        });
    }

    if (sortTrending) {
        sortTrending.addEventListener('change', () => {
            loadTrendingFiles(sortTrending.value);
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

    // Initialize page
    function initHomePage() {
        loadTrendingFiles('popular');
        loadPopularTags();
        
        // If user is authenticated, load recent files
        if (currentUser) {
            loadRecentFiles();
        }
    }

    // Load trending files
// Load trending files
async function loadTrendingFiles(sortBy = 'popular') {
    if (!trendingFiles) return;
    
    try {
        // Show loading state
        trendingFiles.innerHTML = '<div class="md-file-placeholder">Loading trending files...</div>';
        
        // Get all approved files from Firebase
        const snapshot = await database.ref('mdfiles').once('value');
        const files = snapshot.val();
        
        if (!files) {
            trendingFiles.innerHTML = '<div class="md-file-placeholder">No markdown files shared yet</div>';
            return;
        }
        
        // Convert to array and sort
        let sortedFiles = Object.entries(files)
            .map(([id, file]) => ({ id, ...file }))
            // Filter out any files that might not be approved or are unlisted
            .filter(file => 
                file.status !== 'pending' && 
                file.status !== 'rejected' && 
                file.visibility !== 'unlisted'
            );
        
        if (sortBy === 'popular') {
            // Sort by views/likes (if available) or fallback to timestamp
            sortedFiles = sortedFiles.sort((a, b) => {
                const aPopularity = a.views || 0;
                const bPopularity = b.views || 0;
                return bPopularity - aPopularity;
            });
        } else if (sortBy === 'recent') {
            // Sort by timestamp (newest first)
            sortedFiles = sortedFiles.sort((a, b) => b.timestamp - a.timestamp);
        }
        
        // Limit to 6 trending files
        sortedFiles = sortedFiles.slice(0, 6);
        
        // Render files
        renderFileGrid(trendingFiles, sortedFiles);
    } catch (error) {
        console.error('Error loading trending files:', error);
        trendingFiles.innerHTML = '<div class="md-file-placeholder">Error loading trending files</div>';
    }
}

// Load recent files
async function loadRecentFiles() {
    if (!recentFiles) return;
    
    if (!currentUser) {
        recentFiles.innerHTML = '<div class="md-file-placeholder">Login to view recent files</div>';
        return;
    }
    
    try {
        // Show loading state
        recentFiles.innerHTML = '<div class="md-file-placeholder">Loading recent files...</div>';
        
        // Get recent files (limit to 12)
        const snapshot = await database.ref('mdfiles')
            .orderByChild('timestamp')
            .limitToLast(12)
            .once('value');
            
        const files = snapshot.val();
        
        if (!files) {
            recentFiles.innerHTML = '<div class="md-file-placeholder">No recent files available</div>';
            return;
        }
        
        // Convert to array and sort by timestamp (newest first)
        const sortedFiles = Object.entries(files)
            .map(([id, file]) => ({ id, ...file }))
            // Filter out any files that might not be approved or are unlisted
            .filter(file => 
                file.status !== 'pending' && 
                file.status !== 'rejected' && 
                file.visibility !== 'unlisted'
            )
            .sort((a, b) => b.timestamp - a.timestamp);
        
        // Render files
        renderFileGrid(recentFiles, sortedFiles);
    } catch (error) {
        console.error('Error loading recent files:', error);
        recentFiles.innerHTML = '<div class="md-file-placeholder">Error loading recent files</div>';
    }
}

    // Load popular tags
   // Load popular tags
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
            
            if (file.tags || file.aiSuggestedTags) {
                const fileTags = Array.isArray(file.tags) 
                    ? file.tags 
                    : (file.tags ? file.tags.split(',').map(tag => tag.trim()) : []);
                
                // If no file.tags, use aiSuggestedTags as fallback
                const tagsToUse = fileTags.length > 0 ? fileTags : (
                    Array.isArray(file.aiSuggestedTags)
                        ? file.aiSuggestedTags
                        : (file.aiSuggestedTags ? file.aiSuggestedTags.split(',').map(tag => tag.trim()) : [])
                );
                
                tagsToUse.forEach(tag => {
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
   
  // Helper function to render file grid
function renderFileGrid(container, files) {
    container.innerHTML = '';
    
    files.forEach(file => {
        const fileCard = document.createElement('div');
        fileCard.className = 'md-file-card';
        
        // Calculate relative time
        const date = new Date(file.timestamp);
        const relativeTime = getRelativeTime(date);
        
        // Get first 100 characters of content as preview
        const contentPreview = file.content 
            ? file.content.substring(0, 100) + (file.content.length > 100 ? '...' : '')
            : 'No preview available';
        
        // Determine author display
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
            verifiedIcon = '<span class="material-icons check">how_to_reg</span>';
            
            // Add user photo if available
            if (file.userPhotoURL) {
                authorIcon = '';
                authorClass = '';
                verifiedIcon = `<img src="${file.userPhotoURL}" alt="${authorDisplay}" class="user-avatar" width="20" height="20"><span class="material-icons check">verified_user</span>`;
            }
        } else if (file.userDisplayName) {
            // For other users with display names
            authorDisplay = file.userDisplayName;
            verifiedIcon = '<span class="material-icons check">person</span>';
        } else {
            // For anonymous users
            authorDisplay = `Anonymous (${file.userId.substring(0, 6)}...)`;
        }
        
        fileCard.innerHTML = `
            <h3 class="file-title">${file.title}</h3>
            <div class="file-preview">${contentPreview}</div>
            <div class="file-meta">
                <div class="file-author">
                    ${authorClass ? `<span class="${authorClass}">${authorIcon}</span>` : ''}
                    ${verifiedIcon}
                    ${authorDisplay}
                    </div>
                <div class="file-date">
                    <span class="material-icons"></span>
                    ${relativeTime}
                </div>
            </div>
        `;
        
        // Handle click to view file
        fileCard.addEventListener('click', () => {
            window.location.href = `view-file.html?id=${file.id}`;
        });
        
        container.appendChild(fileCard);
    });
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

    // Handle user authentication callback
    window.onUserAuthenticated = function(user) {
        loadRecentFiles();
    };

    // Handle user signed out callback
    window.onUserSignedOut = function() {
        if (recentFiles) {
            recentFiles.innerHTML = '<div class="md-file-placeholder">Login to view recent files</div>';
        }
    };

    // Initialize page
    initHomePage();
});