// Starred Files JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const starredFiles = document.getElementById('starred-files');
    const sortStarred = document.getElementById('sort-starred');
    const loginPlaceholder = document.getElementById('login-placeholder');
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    const emptyPlaceholder = document.getElementById('empty-placeholder');
    const newFileBtn = document.getElementById('new-file-btn');
    const searchInput = document.getElementById('search-input');
    const tagsList = document.getElementById('tags-list');

    // Current user
    let currentUser = null;
    
    // Files data
    let userStarredFiles = [];
    
    // Initialize
    init();
    
    function init() {
        // Setup event listeners
        if (sortStarred) {
            sortStarred.addEventListener('change', () => {
                sortAndRenderFiles();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                window.location.href = 'create-file.html';
            });
        }
        
        // Check auth state
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            
            if (user) {
                // User is signed in
                showPlaceholder('loading');
                loadStarredFiles();
                loadPopularTags();
            } else {
                // User is not signed in
                showPlaceholder('login');
            }
        });
    }
    
    // Load user's starred files
    async function loadStarredFiles() {
        if (!currentUser) return;
        
        try {
            // Get user's starred file IDs
            const starredRef = database.ref(`user_stars/${currentUser.uid}`);
            const starredSnapshot = await starredRef.once('value');
            const starredData = starredSnapshot.val();
            
            if (!starredData) {
                showPlaceholder('empty');
                return;
            }
            
            // Get the file details for each starred file
            const starredFileIds = Object.keys(starredData);
            const filePromises = starredFileIds.map(async (fileId) => {
                try {
                    const fileRef = database.ref(`mdfiles/${fileId}`);
                    const fileSnapshot = await fileRef
                        .once('value');
                    
                    const fileData = fileSnapshot.val();
                    if (fileData) {
                        return {
                            id: fileId,
                            ...fileData,
                            starredAt: starredData[fileId] === true ? Date.now() : starredData[fileId]
                        };
                    }
                    return null;
                } catch (error) {
                    console.error(`Error loading file ${fileId}:`, error);
                    return null;
                }
            });
            
            // Wait for all promises to resolve
            const files = await Promise.all(filePromises);
            
            // Filter out nulls and update the files array
            userStarredFiles = files.filter(file => file !== null);
            
            if (userStarredFiles.length === 0) {
                showPlaceholder('empty');
                return;
            }
            
            // Sort and render files
            sortAndRenderFiles();
        } catch (error) {
            console.error('Error loading starred files:', error);
            showError('Error loading starred files');
        }
    }
    
    // Sort and render files based on selected sort option
    function sortAndRenderFiles() {
        if (!userStarredFiles || userStarredFiles.length === 0) {
            showPlaceholder('empty');
            return;
        }
        
        const sortOption = sortStarred ? sortStarred.value : 'recent';
        
        // Sort the files
        let sortedFiles = [...userStarredFiles];
        
        switch (sortOption) {
            case 'alpha':
                sortedFiles.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'popular':
                sortedFiles.sort((a, b) => {
                    const aPopularity = (a.views || 0) + (a.likes || 0) * 2 + (a.stars || 0) * 3;
                    const bPopularity = (b.views || 0) + (b.likes || 0) * 2 + (b.stars || 0) * 3;
                    return bPopularity - aPopularity;
                });
                break;
            case 'recent':
            default:
                sortedFiles.sort((a, b) => b.starredAt - a.starredAt);
                break;
        }
        
        // Render the files
        renderFiles(sortedFiles);
    }
    
    // Render files to the grid
    function renderFiles(files) {
        if (!starredFiles) return;
        
        // Clear existing content
        starredFiles.innerHTML = '';
        
        // Add each file to the grid
        files.forEach(file => {
            const fileElement = createFileElement(file);
            starredFiles.appendChild(fileElement);
        });
    }
    
    // Create a file card element
    function createFileElement(file) {
        const fileElement = document.createElement('div');
        fileElement.className = 'md-file-card';
        fileElement.dataset.fileId = file.id;
        
        // Extract preview content (first 100 characters)
        let preview = '';
        if (file.content) {
            // Remove markdown formatting for preview
            const plainText = file.content.replace(/[#*`_~\[\]]/g, '');
            preview = plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
        }
        
        // Format date
        const date = new Date(file.timestamp);
        const dateFormatted = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        // Build tags HTML
        let tagsHtml = '';
        if (file.tags) {
            const tags = Array.isArray(file.tags) ? file.tags : file.tags.split(',').map(tag => tag.trim());
            tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }
        
        // Build author HTML
        let authorHtml = '';
        if (file.userId === "MDHub") {
            authorHtml = `
                <span class="author-info">
                    <span class="material-symbols-outlined">graph_6</span>
                    MDHub
                    <span class="material-icons verified">verified</span>
                </span>`;
        } else if (file.userProvider === "google.com" && file.userPhotoURL) {
            authorHtml = `
                <span class="author-info">
                    <img src="${file.userPhotoURL}" alt="${file.userDisplayName || 'User'}" class="user-avatar" width="20" height="20">
                    ${file.userDisplayName || 'Google User'}
                    <span class="material-icons verified">verified_user</span>
                </span>`;
        } else if (file.userDisplayName) {
            authorHtml = `
                <span class="author-info">
                    <span class="material-icons">person</span>
                    ${file.userDisplayName}
                </span>`;
        } else {
            authorHtml = `
                <span class="author-info">
                    <span class="material-icons">person_outline</span>
                    Anonymous
                </span>`;
        }
        
        fileElement.innerHTML = `
            <div class="file-header">
                <h3 class="file-title">${file.title}</h3>
                <div class="file-actions">
                    <button class="btn-icon unstar-btn" title="Remove from starred">
                        <span class="material-icons">star</span>
                    </button>
                </div>
            </div>
            <div class="file-preview">${preview}</div>
            <div class="file-meta">
                ${authorHtml}
                <span class="file-date">
                    <span class="material-icons">event</span>
                    ${dateFormatted}
                </span>
            </div>
            <div class="file-tags">${tagsHtml}</div>
            <div class="file-stats">
                <span class="stat">
                    <span class="material-icons">visibility</span>
                    ${file.views || 0}
                </span>
                <span class="stat">
                    <span class="material-icons">favorite</span>
                    ${file.likes || 0}
                </span>
                <span class="stat">
                    <span class="material-icons">star</span>
                    ${file.stars || 0}
                </span>
                <span class="stat">
                    <span class="material-icons">comment</span>
                    ${file.comments || 0}
                </span>
            </div>
        `;
        
        // Add click event to open the file
        fileElement.addEventListener('click', (event) => {
            // Don't navigate if clicking on the unstar button
            if (event.target.closest('.unstar-btn')) {
                event.stopPropagation();
                return;
            }
            
            window.location.href = `view-file.html?id=${file.id}`;
        });
        
        // Add click event for unstar button
        const unstarBtn = fileElement.querySelector('.unstar-btn');
        if (unstarBtn) {
            unstarBtn.addEventListener('click', async (event) => {
                event.stopPropagation();
                await unstarFile(file.id);
            });
        }
        
        return fileElement;
    }
    
    // Unstar a file
    async function unstarFile(fileId) {
        if (!currentUser) return;
        
        try {
            // Remove star from user's stars
            await database.ref(`user_stars/${currentUser.uid}/${fileId}`).remove();
            
            // Decrement star count on the file
            await database.ref(`mdfiles/${fileId}/stars`).transaction(currentStars => {
                return Math.max((currentStars || 0) - 1, 0);
            });
            
            // Remove file from the UI
            const fileElement = document.querySelector(`.md-file-card[data-file-id="${fileId}"]`);
            if (fileElement) {
                fileElement.classList.add('removing');
                setTimeout(() => {
                    fileElement.remove();
                    
                    // Remove from the array
                    userStarredFiles = userStarredFiles.filter(file => file.id !== fileId);
                    
                    // Show empty placeholder if no files left
                    if (userStarredFiles.length === 0) {
                        showPlaceholder('empty');
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error unstarring file:', error);
            alert('Error removing file from starred');
        }
    }
    
    // Handle search input
    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (!searchTerm) {
            // If search is empty, show all files
            sortAndRenderFiles();
            return;
        }
        
        // Filter files by search term
        const filteredFiles = userStarredFiles.filter(file => {
            const titleMatch = file.title.toLowerCase().includes(searchTerm);
            const contentMatch = file.content.toLowerCase().includes(searchTerm);
            
            // Check tags
            let tagsMatch = false;
            if (file.tags) {
                const tags = Array.isArray(file.tags) ? file.tags : file.tags.split(',').map(tag => tag.trim());
                tagsMatch = tags.some(tag => tag.toLowerCase().includes(searchTerm));
            }
            
            return titleMatch || contentMatch || tagsMatch;
        });
        
        // Render filtered files
        if (filteredFiles.length === 0) {
            starredFiles.innerHTML = `
                <div class="md-file-placeholder">
                    <span class="material-icons">search_off</span>
                    <p>No starred files found matching "${searchTerm}"</p>
                    <button class="btn btn-secondary" id="clear-search">Clear Search</button>
                </div>
            `;
            
            // Add click event for clear search button
            const clearSearchBtn = document.getElementById('clear-search');
            if (clearSearchBtn) {
                clearSearchBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    sortAndRenderFiles();
                });
            }
        } else {
            renderFiles(filteredFiles);
        }
    }
    
    // Load popular tags
    async function loadPopularTags() {
        if (!tagsList) return;
        
        try {
            // Get top 10 tags from Firebase
            const tagsRef = database.ref('tags').orderByValue().limitToLast(10);
            const snapshot = await tagsRef.once('value');
            const tags = snapshot.val();
            
            // Clear existing tags
            tagsList.innerHTML = '';
            
            if (!tags) {
                tagsList.innerHTML = '<span class="tag">No tags yet</span>';
                return;
            }
            
            // Convert to array and sort by count
            const tagsArray = Object.entries(tags)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);
            
            // Add tags to sidebar
            tagsArray.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag.name;
                tagElement.addEventListener('click', () => {
                    window.location.href = `search.html?q=${encodeURIComponent(tag.name)}`;
                });
                tagsList.appendChild(tagElement);
            });
        } catch (error) {
            console.error('Error loading popular tags:', error);
            tagsList.innerHTML = '<span class="tag">Error loading tags</span>';
        }
    }
    
    // Show placeholder based on type
    function showPlaceholder(type) {
        if (!loginPlaceholder || !loadingPlaceholder || !emptyPlaceholder) return;
        
        // Hide all placeholders
        loginPlaceholder.classList.add('hidden');
        loadingPlaceholder.classList.add('hidden');
        emptyPlaceholder.classList.add('hidden');
        
        // Show the requested placeholder
        switch (type) {
            case 'login':
                loginPlaceholder.classList.remove('hidden');
                break;
            case 'loading':
                loadingPlaceholder.classList.remove('hidden');
                break;
            case 'empty':
                emptyPlaceholder.classList.remove('hidden');
                break;
        }
    }
    
    // Show error message
    function showError(message) {
        if (!starredFiles) return;
        
        starredFiles.innerHTML = `
            <div class="md-file-placeholder">
                <span class="material-icons">error</span>
                <p>${message}</p>
                <button class="btn btn-secondary" id="retry-btn">Retry</button>
            </div>
        `;
        
        // Add click event for retry button
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                showPlaceholder('loading');
                loadStarredFiles();
            });
        }
    }
    
    // Handle user authentication callback from auth.js
    window.onUserAuthenticated = function(user) {
        currentUser = user;
        showPlaceholder('loading');
        loadStarredFiles();
        loadPopularTags();
    };
    
    // Handle user signed out callback from auth.js
    window.onUserSignedOut = function() {
        currentUser = null;
        userStarredFiles = [];
        showPlaceholder('login');
    };
});