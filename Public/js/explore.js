// Explore Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const searchInput = document.getElementById('search-input');
    const exploreSearchInput = document.getElementById('explore-search-input');
    const exploreSearchBtn = document.getElementById('explore-search-btn');
    const tagsListContainer = document.getElementById('tags-list');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const timeFilter = document.getElementById('time-filter');
    const featuredCarousel = document.getElementById('featured-carousel');
    const exploreFilesContainer = document.getElementById('explore-files');
    const resultsCount = document.getElementById('results-count');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const newFileBtn = document.getElementById('new-file-btn');

    // Pagination state
    let currentPage = 1;
    const filesPerPage = 12;
    let totalPages = 1;

    // Filter state
    let currentCategory = 'all';
    let currentSort = 'popular';
    let currentTimeFilter = 'all';
    let searchQuery = '';
    let allFiles = [];
    let filteredFiles = [];

    // Initialize page
    function initExplorePage() {
        // Load popular tags
        loadPopularTags();
        
        // Load featured files
        loadFeaturedFiles();
        
        // Load all files
        loadAllFiles();
        
        // Set up event listeners
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // Regular search input (in header)
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
        
        // Explore page search
        if (exploreSearchBtn && exploreSearchInput) {
            exploreSearchBtn.addEventListener('click', () => {
                searchQuery = exploreSearchInput.value.trim();
                currentPage = 1;
                applyFilters();
            });
            
            exploreSearchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    searchQuery = exploreSearchInput.value.trim();
                    currentPage = 1;
                    applyFilters();
                }
            });
        }
        
        // Category filters
        categoryFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                // Update active state
                categoryFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                // Update filter state
                currentCategory = filter.getAttribute('data-category');
                currentPage = 1;
                applyFilters();
            });
        });
        
        // Sort filter
        if (sortFilter) {
            sortFilter.addEventListener('change', () => {
                currentSort = sortFilter.value;
                applyFilters();
            });
        }
        
        // Time filter
        if (timeFilter) {
            timeFilter.addEventListener('change', () => {
                currentTimeFilter = timeFilter.value;
                currentPage = 1;
                applyFilters();
            });
        }
        
        // Pagination
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderCurrentPage();
                }
            });
        }
        
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderCurrentPage();
                }
            });
        }
        
        // New file button
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => {
                window.location.href = 'create-file.html';
            });
        }
    }

    // Load popular tags for sidebar
    async function loadPopularTags() {
        if (!tagsListContainer) return;
        
        try {
            // Get all files to extract tags
            const snapshot = await database.ref('mdfiles').once('value');
            const files = snapshot.val();
            
            if (!files) {
                tagsListContainer.innerHTML = '<span class="tag">No tags yet</span>';
                return;
            }
            
            // Count tag occurrences
            const tagCounts = {};
            Object.values(files).forEach(file => {
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
                
                // Handle tag click
                tagElement.addEventListener('click', () => {
                    window.location.href = `search.html?tag=${encodeURIComponent(tag)}`;
                });
                
                tagsListContainer.appendChild(tagElement);
            });
            
            // If no tags, show message
            if (sortedTags.length === 0) {
                tagsListContainer.innerHTML = '<span class="tag">No tags yet</span>';
            }
        } catch (error) {
            console.error('Error loading tags:', error);
            tagsListContainer.innerHTML = '<span class="tag">Error loading tags</span>';
        }
    }

    // Load featured files
    async function loadFeaturedFiles() {
        if (!featuredCarousel) return;
        
        try {
            // Get featured files from Firebase
            const snapshot = await database.ref('mdfiles')
                .orderByChild('featured')
                .equalTo(true)
                .once('value');
            
            const featuredFiles = snapshot.val();
            
            if (!featuredFiles) {
                featuredCarousel.innerHTML = '<div class="md-file-placeholder">No featured files</div>';
                return;
            }
            
            // Convert to array and sort by timestamp (newest first)
            const featuredFilesArray = Object.entries(featuredFiles)
                .map(([id, file]) => ({ id, ...file }))
                .sort((a, b) => b.timestamp - a.timestamp);
            
            // Render featured files
            featuredCarousel.innerHTML = '';
            
            featuredFilesArray.forEach(file => {
                const fileCard = document.createElement('div');
                fileCard.className = 'featured-card';
                
                // Calculate relative time
                const date = new Date(file.timestamp);
                const relativeTime = getRelativeTime(date);
                
                // Get first 120 characters of content as preview
                const contentPreview = file.content 
                    ? file.content.substring(0, 120) + (file.content.length > 120 ? '...' : '')
                    : 'No preview available';
                
                // Determine author display
                let authorDisplay = determineAuthorDisplay(file);
                
                // Create card content
                fileCard.innerHTML = `
                    <div class="featured-card-content">
                        <h3 class="file-title">${file.title}</h3>
                        <div class="file-preview">${contentPreview}</div>
                        <div class="file-meta">
                            <div class="file-author">${authorDisplay}</div>
                            <div class="file-date">
                                <span class="material-icons">access_time</span>
                                ${relativeTime}
                            </div>
                        </div>
                    </div>
                `;
                
                // Add tags if available
                if (file.tags) {
                    const tagsContainer = document.createElement('div');
                    tagsContainer.className = 'file-tags';
                    
                    const tags = Array.isArray(file.tags) 
                        ? file.tags 
                        : file.tags.split(',').map(tag => tag.trim());
                    
                    tags.slice(0, 3).forEach(tag => {
                        if (!tag) return;
                        
                        const tagElement = document.createElement('span');
                        tagElement.className = 'tag';
                        tagElement.textContent = tag;
                        
                        // Handle tag click within card
                        tagElement.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent card click
                            window.location.href = `search.html?tag=${encodeURIComponent(tag)}`;
                        });
                        
                        tagsContainer.appendChild(tagElement);
                    });
                    
                    // Show count if more tags
                    if (tags.length > 3) {
                        const moreTagsElement = document.createElement('span');
                        moreTagsElement.className = 'tag more-tags';
                        moreTagsElement.textContent = `+${tags.length - 3} more`;
                        tagsContainer.appendChild(moreTagsElement);
                    }
                    
                    fileCard.querySelector('.featured-card-content').appendChild(tagsContainer);
                }
                
                // Handle click to view file
                fileCard.addEventListener('click', () => {
                    window.location.href = `view-file.html?id=${file.id}`;
                });
                
                featuredCarousel.appendChild(fileCard);
            });
            
        } catch (error) {
            console.error('Error loading featured files:', error);
            featuredCarousel.innerHTML = '<div class="md-file-placeholder">Error loading featured files</div>';
        }
    }

    // Load all files
    async function loadAllFiles() {
        if (!exploreFilesContainer) return;
        
        try {
            // Show loading state
            exploreFilesContainer.innerHTML = '<div class="md-file-placeholder">Loading markdown files...</div>';
            
            // Get all files from Firebase
            const snapshot = await database.ref('mdfiles').once('value');
            const files = snapshot.val();
            
            if (!files) {
                exploreFilesContainer.innerHTML = '<div class="md-file-placeholder">No markdown files available</div>';
                return;
            }
            
            // Convert to array for filtering and sorting
            allFiles = Object.entries(files)
                .map(([id, file]) => ({ id, ...file }));
            
            // Apply initial filters
            applyFilters();
            
        } catch (error) {
            console.error('Error loading files:', error);
            exploreFilesContainer.innerHTML = '<div class="md-file-placeholder">Error loading files</div>';
        }
    }

    // Apply filters to files
    function applyFilters() {
        // Start with all files
        let results = [...allFiles];
        
        // Apply category filter
        if (currentCategory !== 'all') {
            results = results.filter(file => {
                // Try to find category in tags
                if (file.tags) {
                    const fileTags = Array.isArray(file.tags) 
                        ? file.tags 
                        : file.tags.split(',').map(tag => tag.trim());
                    
                    return fileTags.some(tag => 
                        tag.toLowerCase() === currentCategory.toLowerCase()
                    );
                }
                return false;
            });
        }
        
        // Apply search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            results = results.filter(file => 
                (file.title && file.title.toLowerCase().includes(query)) || 
                (file.content && file.content.toLowerCase().includes(query))
            );
        }
        
        // Apply time filter
        if (currentTimeFilter !== 'all') {
            const now = new Date();
            let cutoffDate;
            
            switch (currentTimeFilter) {
                case 'day':
                    cutoffDate = new Date(now.setDate(now.getDate() - 1));
                    break;
                case 'week':
                    cutoffDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    cutoffDate = new Date(0); // Beginning of time
            }
            
            results = results.filter(file => file.timestamp > cutoffDate.getTime());
        }
        
        // Apply sorting
        switch (currentSort) {
            case 'recent':
                // Sort by timestamp (newest first)
                results.sort((a, b) => b.timestamp - a.timestamp);
                break;
                
            case 'popular':
                // Sort by likes or popularity
                results.sort((a, b) => {
                    const aPopularity = (a.likes ? Object.keys(a.likes).length : 0) + (a.views || 0);
                    const bPopularity = (b.likes ? Object.keys(b.likes).length : 0) + (b.views || 0);
                    return bPopularity - aPopularity;
                });
                break;
                
            case 'views':
                // Sort by views
                results.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
                
            case 'title':
                // Sort alphabetically by title
                results.sort((a, b) => {
                    if (!a.title) return 1;
                    if (!b.title) return -1;
                    return a.title.localeCompare(b.title);
                });
                break;
        }
        
        // Store filtered results
        filteredFiles = results;
        
        // Update result count
        if (resultsCount) {
            if (searchQuery || currentCategory !== 'all' || currentTimeFilter !== 'all') {
                let filterDescription = '';
                
                if (searchQuery) {
                    filterDescription += ` matching "${searchQuery}"`;
                }
                
                if (currentCategory !== 'all') {
                    filterDescription += ` in ${currentCategory}`;
                }
                
                if (currentTimeFilter !== 'all') {
                    const timeLabels = {
                        day: 'today',
                        week: 'this week',
                        month: 'this month',
                        year: 'this year'
                    };
                    filterDescription += ` from ${timeLabels[currentTimeFilter]}`;
                }
                
                resultsCount.textContent = `Found ${results.length} file${results.length !== 1 ? 's' : ''}${filterDescription}`;
            } else {
                resultsCount.textContent = `Showing all ${results.length} files`;
            }
        }
        
        // Calculate total pages
        totalPages = Math.max(1, Math.ceil(filteredFiles.length / filesPerPage));
        
        // Update pagination UI
        updatePaginationUI();
        
        // Render current page
        renderCurrentPage();
    }

    // Render current page of results
    function renderCurrentPage() {
        if (!exploreFilesContainer) return;
        
        // Calculate slice for current page
        const startIndex = (currentPage - 1) * filesPerPage;
        const endIndex = Math.min(startIndex + filesPerPage, filteredFiles.length);
        const pageResults = filteredFiles.slice(startIndex, endIndex);
        
        // Update page info
        if (pageInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        
        // Update pagination buttons
        updatePaginationUI();
        
        // No results case
        if (pageResults.length === 0) {
            exploreFilesContainer.innerHTML = '<div class="md-file-placeholder">No matching files found</div>';
            return;
        }
        
        // Render files
        exploreFilesContainer.innerHTML = '';
        
        pageResults.forEach(file => {
            const fileCard = createFileCard(file);
            exploreFilesContainer.appendChild(fileCard);
        });
    }

    // Create a file card element
    // Create a file card element
function createFileCard(file) {
    const fileCard = document.createElement('div');
    fileCard.className = 'md-file-card';
    
    // Calculate relative time
    const date = new Date(file.timestamp);
    const relativeTime = getRelativeTime(date);
    
    // Get first 100 characters of content as preview
    const contentPreview = file.content 
        ? file.content.substring(0, 100) + (file.content.length > 100 ? '...' : '')
        : 'No preview available';
    
    // Determine author display - Using the same logic as in home.js
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
    
    // Add stats if available
    const statsContainer = document.createElement('div');
    statsContainer.className = 'file-stats';
    
    // Views
    const viewsEl = document.createElement('div');
    viewsEl.className = 'stat-item';
    viewsEl.innerHTML = `
        <span class="material-icons">visibility</span>
        <span>${file.views || 0}</span>
    `;
    statsContainer.appendChild(viewsEl);
    
    // Likes
    const likesCount = file.likes ? Object.keys(file.likes).length : 0;
    const likesEl = document.createElement('div');
    likesEl.className = 'stat-item';
    likesEl.innerHTML = `
        <span class="material-icons">favorite</span>
        <span>${likesCount}</span>
    `;
    statsContainer.appendChild(likesEl);
    
    fileCard.appendChild(statsContainer);
    
    // Add tags if available
    if (file.tags) {
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'file-tags';
        
        const tags = Array.isArray(file.tags) 
            ? file.tags 
            : file.tags.split(',').map(tag => tag.trim());
        
        tags.slice(0, 3).forEach(tag => {
            if (!tag) return;
            
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.textContent = tag;
            
            // Highlight active category
            if (currentCategory !== 'all' && tag.toLowerCase() === currentCategory.toLowerCase()) {
                tagElement.classList.add('active');
            }
            
            // Handle tag click
            tagElement.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click
                window.location.href = `search.html?tag=${encodeURIComponent(tag)}`;
            });
            
            tagsContainer.appendChild(tagElement);
        });
        
        // Show count if more tags
        if (tags.length > 3) {
            const moreTagsElement = document.createElement('span');
            moreTagsElement.className = 'tag more-tags';
            moreTagsElement.textContent = `+${tags.length - 3} more`;
            tagsContainer.appendChild(moreTagsElement);
        }
        
        fileCard.appendChild(tagsContainer);
    }
    
    // Handle click to view file
    fileCard.addEventListener('click', () => {
        window.location.href = `view-file.html?id=${file.id}`;
    });
    
    return fileCard;
}

// Update pagination UI
function updatePaginationUI() {
    if (!prevPageBtn || !nextPageBtn || !pageInfo) return;
    
    // Update prev button state
    prevPageBtn.disabled = currentPage <= 1;
    
    // Update next button state
    nextPageBtn.disabled = currentPage >= totalPages;
    
    // Update page info text
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

// Helper function to get relative time
function getRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (diffInSeconds < 60) {
        return 'just now';
    }
    
    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a month
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a year
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    }
    
    // More than a year
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

// Helper function to determine author display
function determineAuthorDisplay(file) {
    if (!file.author) {
        return '<span class="anonymous-author">Anonymous</span>';
    }
    
    // Get current user
    const currentUser = firebase.auth().currentUser;
    
    // Check if this is the current user's file
    if (currentUser && file.userId === currentUser.uid) {
        return '<span class="your-file">You</span>';
    }
    
    // Otherwise show author name
    return `<span class="author-name">${file.author}</span>`;
}

// Initialize explore page when DOM is loaded
initExplorePage();
});