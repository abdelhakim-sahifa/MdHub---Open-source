// Search Page Specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Search page elements
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchQueryDisplay = document.getElementById('search-query-display');
    const searchResultsCount = document.getElementById('search-results-count');
    const noResultsSection = document.getElementById('no-results');
    const clearSearchBtn = document.getElementById('clear-search');
    const sortResultsSelect = document.getElementById('sort-results');
    const activeTagsContainer = document.getElementById('active-tags');
    const tagsListContainer = document.getElementById('tags-list');
    const newFileBtn = document.getElementById('new-file-btn');

    // Search parameters
    let searchQuery = '';
    let searchTag = '';
    let activeFilters = new Set();
    let allSearchResults = [];
    
    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    // Update URL without reloading page
                    const url = new URL(window.location);
                    url.searchParams.set('q', query);
                    window.history.pushState({}, '', url);
                    
                    // Execute search
                    searchQuery = query;
                    performSearch();
                }
            }
        });
    }
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (sortResultsSelect) {
        sortResultsSelect.addEventListener('change', () => {
            sortAndDisplayResults();
        });
    }
    
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            window.location.href = 'create-file.html';
        });
    }
    
    // Initialize page
    function initSearchPage() {
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        searchQuery = urlParams.get('q') || '';
        searchTag = urlParams.get('tag') || '';
        
        // Update search input value
        if (searchInput && searchQuery) {
            searchInput.value = searchQuery;
        }
        
        // Add initial tag if provided in URL
        if (searchTag) {
            activeFilters.add(searchTag);
            updateActiveTagsDisplay();
        }
        
        // Load popular tags
        loadPopularTags();
        
        // Perform search based on URL parameters
        performSearch();
    }
    
    // Perform search
    async function performSearch() {
        if (!searchResults) return;
        
        try {
            // Show loading state
            searchResults.innerHTML = '<div class="md-file-placeholder">Searching...</div>';
            noResultsSection.classList.add('hidden');
            
            // Create search query display
            let displayText = '';
            if (searchQuery) {
                displayText = `Results for "${searchQuery}"`;
            } else if (searchTag) {
                displayText = `Results for tag "${searchTag}"`;
            } else if (activeFilters.size > 0) {
                const tags = Array.from(activeFilters).join('", "');
                displayText = `Results for tags "${tags}"`;
            } else {
                displayText = 'All files';
            }
            
            if (searchQueryDisplay) {
                searchQueryDisplay.textContent = displayText;
            }
            
            // Get all files from Firebase
            const snapshot = await database.ref('mdfiles').once('value');
            const files = snapshot.val();
            
            if (!files) {
                showNoResults();
                return;
            }
            
            // Convert to array for filtering
            let results = Object.entries(files)
                .map(([id, file]) => ({ id, ...file }));
            
            // Apply search filters
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                results = results.filter(file => 
                    (file.title && file.title.toLowerCase().includes(query)) || 
                    (file.content && file.content.toLowerCase().includes(query))
                );
            }
            
            // Apply tag filters
            if (searchTag || activeFilters.size > 0) {
                const tagsToFilter = searchTag ? [searchTag, ...activeFilters] : [...activeFilters];
                
                if (tagsToFilter.length > 0) {
                    results = results.filter(file => {
                        if (!file.tags) return false;
                        
                        const fileTags = Array.isArray(file.tags) 
                            ? file.tags 
                            : file.tags.split(',').map(tag => tag.trim());
                        
                        return tagsToFilter.some(filterTag => 
                            fileTags.includes(filterTag) || 
                            fileTags.some(fileTag => fileTag.toLowerCase() === filterTag.toLowerCase())
                        );
                    });
                }
            }
            
            // Store all search results
            allSearchResults = results;
            
            // Update result count
            if (searchResultsCount) {
                searchResultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
            }
            
            // Check if we have results
            if (results.length === 0) {
                showNoResults();
                return;
            }
            
            // Sort and display results
            sortAndDisplayResults();
            
        } catch (error) {
            console.error('Error performing search:', error);
            searchResults.innerHTML = '<div class="md-file-placeholder">Error performing search</div>';
        }
    }
    
    // Sort and display results
    function sortAndDisplayResults() {
        const sortBy = sortResultsSelect ? sortResultsSelect.value : 'relevance';
        let sortedResults = [...allSearchResults];
        
        switch (sortBy) {
            case 'recent':
                // Sort by timestamp (newest first)
                sortedResults = sortedResults.sort((a, b) => b.timestamp - a.timestamp);
                break;
                
            case 'popular':
                // Sort by views/popularity
                sortedResults = sortedResults.sort((a, b) => {
                    const aPopularity = a.views || 0;
                    const bPopularity = b.views || 0;
                    return bPopularity - aPopularity;
                });
                break;
                
            case 'relevance':
            default:
                // For relevance sorting with search query
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    
                    // Custom relevance scoring
                    sortedResults = sortedResults.sort((a, b) => {
                        // Title exact match gets highest priority
                        const aTitleExact = a.title && a.title.toLowerCase() === query ? 100 : 0;
                        const bTitleExact = b.title && b.title.toLowerCase() === query ? 100 : 0;
                        
                        if (aTitleExact !== bTitleExact) return bTitleExact - aTitleExact;
                        
                        // Title contains query gets second priority
                        const aTitleContains = a.title && a.title.toLowerCase().includes(query) ? 50 : 0;
                        const bTitleContains = b.title && b.title.toLowerCase().includes(query) ? 50 : 0;
                        
                        if (aTitleContains !== bTitleContains) return bTitleContains - aTitleContains;
                        
                        // Content relevance is third priority
                        const aContentScore = a.content ? 
                            (a.content.toLowerCase().split(query).length - 1) : 0;
                        const bContentScore = b.content ? 
                            (b.content.toLowerCase().split(query).length - 1) : 0;
                            
                        return bContentScore - aContentScore;
                    });
                } else {
                    // Default to recent if no query
                    sortedResults = sortedResults.sort((a, b) => b.timestamp - a.timestamp);
                }
                break;
        }
        
        // Render results
        renderSearchResults(sortedResults);
    }
    
  
   // Render search results
function renderSearchResults(results) {
    if (!searchResults) return;
    
    searchResults.innerHTML = '';
    
    results.forEach(file => {
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
        
        // Add tags if available
        if (file.tags) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'file-tags';
            
            const tags = Array.isArray(file.tags) 
                ? file.tags 
                : file.tags.split(',').map(tag => tag.trim());
            
            tags.forEach(tag => {
                if (!tag) return;
                
                const tagElement = document.createElement('span');
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                
                // Highlight active tags
                if (activeFilters.has(tag) || tag === searchTag) {
                    tagElement.classList.add('active');
                }
                
                // Click to add/remove tag filter
                tagElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    
                    if (activeFilters.has(tag)) {
                        activeFilters.delete(tag);
                    } else {
                        activeFilters.add(tag);
                    }
                    
                    updateActiveTagsDisplay();
                    performSearch();
                });
                
                tagsContainer.appendChild(tagElement);
            });
            
            fileCard.appendChild(tagsContainer);
        }
        
        // Handle click to view file
        fileCard.addEventListener('click', () => {
            window.location.href = `view-file.html?id=${file.id}`;
        });
        
        searchResults.appendChild(fileCard);
    });
}
    
    // Show no results message
    function showNoResults() {
        if (!searchResults || !noResultsSection) return;
        
        searchResults.innerHTML = '';
        noResultsSection.classList.remove('hidden');
        
        if (searchResultsCount) {
            searchResultsCount.textContent = '0 results';
        }
    }
    
    // Update active tags display
    function updateActiveTagsDisplay() {
        if (!activeTagsContainer) return;
        
        activeTagsContainer.innerHTML = '';
        
        // Add search tag if present and not in activeFilters
        if (searchTag && !activeFilters.has(searchTag)) {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag active';
            tagElement.textContent = searchTag;
            
            const removeButton = document.createElement('span');
            removeButton.className = 'material-icons remove-tag';
            removeButton.textContent = 'close';
            removeButton.addEventListener('click', () => {
                // Clear search tag parameter
                const url = new URL(window.location);
                url.searchParams.delete('tag');
                window.history.pushState({}, '', url);
                
                searchTag = '';
                performSearch();
            });
            
            tagElement.appendChild(removeButton);
            activeTagsContainer.appendChild(tagElement);
        }
        
        // Add active filters
        activeFilters.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag active';
            tagElement.textContent = tag;
            
            const removeButton = document.createElement('span');
            removeButton.className = 'material-icons remove-tag';
            removeButton.textContent = 'close';
            removeButton.addEventListener('click', () => {
                activeFilters.delete(tag);
                updateActiveTagsDisplay();
                performSearch();
            });
            
            tagElement.appendChild(removeButton);
            activeTagsContainer.appendChild(tagElement);
        });
        
        // Add clear all button if there are filters
        if ((searchTag && searchTag.length > 0) || activeFilters.size > 0) {
            const clearAllBtn = document.createElement('button');
            clearAllBtn.className = 'btn btn-small clear-filters';
            clearAllBtn.textContent = 'Clear all filters';
            clearAllBtn.addEventListener('click', () => {
                // Clear tag parameter
                const url = new URL(window.location);
                url.searchParams.delete('tag');
                window.history.pushState({}, '', url);
                
                searchTag = '';
                activeFilters.clear();
                updateActiveTagsDisplay();
                performSearch();
            });
            
            activeTagsContainer.appendChild(clearAllBtn);
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
                
                // Highlight active tags
                if (activeFilters.has(tag) || tag === searchTag) {
                    tagElement.classList.add('active');
                }
                
                tagElement.textContent = tag;
                tagElement.addEventListener('click', () => {
                    if (activeFilters.has(tag)) {
                        activeFilters.delete(tag);
                    } else {
                        activeFilters.add(tag);
                    }
                    
                    updateActiveTagsDisplay();
                    performSearch();
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
        // Nothing specific needed for search page
    };
    
    // Handle user signed out callback
    window.onUserSignedOut = function() {
        // Nothing specific needed for search page
    };
    
    // Initialize page
    initSearchPage();
});