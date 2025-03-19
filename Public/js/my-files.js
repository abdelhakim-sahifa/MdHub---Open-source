// My Files Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Page elements
    const myFilesContainer = document.getElementById('my-files-container');
    const authAlert = document.getElementById('auth-alert');
    const emptyState = document.getElementById('empty-state');
    const sortFiles = document.getElementById('sort-files');
    const refreshBtn = document.getElementById('refresh-btn');
    const newFileBtn = document.getElementById('new-file-btn');
    const createFirstFile = document.getElementById('create-first-file');
    const loginLink = document.getElementById('login-link');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');
    const searchInput = document.getElementById('search-input');
    const deleteModal = document.getElementById('delete-modal');
    const deleteFileName = document.getElementById('delete-file-name');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    const modalClose = document.querySelector('.modal-close');
    
    // State management
    let currentFilter = 'all';
    let currentSort = 'recent';
    let currentPage = 1;
    let itemsPerPage = 12;
    let totalPages = 1;
    let allUserFiles = [];
    let fileToDelete = null;
    
    // Event listeners
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            window.location.href = 'create-file.html';
        });
    }
    
    if (createFirstFile) {
        createFirstFile.addEventListener('click', () => {
            window.location.href = 'create-file.html';
        });
    }
    
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
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadUserFiles();
        });
    }
    
    if (sortFiles) {
        sortFiles.addEventListener('change', () => {
            currentSort = sortFiles.value;
            currentPage = 1;
            renderFiles();
        });
    }
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Apply filter
            currentFilter = button.getAttribute('data-filter');
            currentPage = 1;
            renderFiles();
        });
    });
    
    // Pagination handlers
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderFiles();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderFiles();
            }
        });
    }
    
    // Search handling
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
    
    // Delete modal handling
    if (confirmDelete) {
        confirmDelete.addEventListener('click', deleteFile);
    }
    
    if (cancelDelete) {
        cancelDelete.addEventListener('click', closeDeleteModal);
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', closeDeleteModal);
    }
    
    // Check authentication status
function checkAuthStatus() {
    // Check if Firebase auth is available and fully initialized
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth()) {
       // console.log('Firebase auth is ready');
        
        // Set up the auth state listener (only need to do this once)
        firebase.auth().onAuthStateChanged(function(user) {
         //   console.log('Auth state changed. User:', user);
            
            if (user) {
                // User is signed in
           //     console.log('User is authenticated:', user.uid);
                if (authAlert) authAlert.classList.add('hidden');
                loadUserFiles();
            } else {
                // No user is signed in
          //      console.log('No user is authenticated');
                if (authAlert) authAlert.classList.remove('hidden');
                if (myFilesContainer) {
                    myFilesContainer.innerHTML = '<div class="md-file-placeholder">Login to view your files</div>';
                }
                if (emptyState) emptyState.classList.add('hidden');
            }
        });
    } else {
        // Firebase not loaded yet, try again shortly
      //  console.log('Firebase auth not ready yet, retrying...');
        setTimeout(checkAuthStatus, 500);
    }
}
    // Initialize page
    function initMyFilesPage() {
        // Check authentication status directly
        checkAuthStatus();
    }
    
    // Load user files
    async function loadUserFiles() {
        // Get the current user directly from Firebase
        const user = firebase.auth().currentUser;
        
        if (!user) return;
        
        try {
            // Show loading state
            if (myFilesContainer) {
                myFilesContainer.innerHTML = '<div class="md-file-placeholder">Loading your files...</div>';
            }
            
            // Hide empty state while loading
            if (emptyState) emptyState.classList.add('hidden');
            
            // Get all files from Firebase
            const snapshot = await database.ref('mdfiles').orderByChild('userId').equalTo(user.uid).once('value');
            const files = snapshot.val();
            
            if (!files) {
                // Show empty state
                if (emptyState) emptyState.classList.remove('hidden');
                if (myFilesContainer) myFilesContainer.classList.add('hidden');
                return;
            }
            
            // Convert to array
            allUserFiles = Object.entries(files).map(([id, file]) => ({ id, ...file }));
            
            // Hide empty state if we have files
            if (emptyState) emptyState.classList.add('hidden');
            if (myFilesContainer) myFilesContainer.classList.remove('hidden');
            
            // Render files
            renderFiles();
        } catch (error) {
            console.error('Error loading files:', error);
            if (myFilesContainer) {
                myFilesContainer.innerHTML = '<div class="md-file-placeholder">Error loading your files</div>';
            }
        }
    }
    
    // Render files with current filtering and sorting
    function renderFiles() {
        if (!myFilesContainer || !allUserFiles.length) return;
        
        // Filter files based on visibility
        let filteredFiles = allUserFiles;
        if (currentFilter !== 'all') {
            filteredFiles = allUserFiles.filter(file => file.visibility === currentFilter);
        }
        
        // Sort files
        switch (currentSort) {
            case 'recent':
                filteredFiles.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'popular':
                filteredFiles.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'title':
                filteredFiles.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        // Calculate pagination
        totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
        
        // Apply pagination
        const start = (currentPage - 1) * itemsPerPage;
        const paginatedFiles = filteredFiles.slice(start, start + itemsPerPage);
        
        // Update pagination controls
        updatePaginationControls();
        
        // Render file grid
        myFilesContainer.innerHTML = '';
        
        if (paginatedFiles.length === 0) {
            myFilesContainer.innerHTML = `<div class="md-file-placeholder">No ${currentFilter !== 'all' ? currentFilter : ''} files found</div>`;
            return;
        }
        
        paginatedFiles.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'md-file-card';
            
            // Calculate relative time
            const date = new Date(file.timestamp);
            const relativeTime = getRelativeTime(date);
            
            // Get first 100 characters of content as preview
            const contentPreview = file.content 
                ? file.content.substring(0, 100) + (file.content.length > 100 ? '...' : '')
                : 'No preview available';
            
            // Stats display
            const views = file.views || 0;
            const likes = file.likes || 0;
            
            // Visibility icon
            const visibilityIcon = file.visibility === 'public' 
                ? '<span class="material-icons" title="Public">public</span>' 
                : '<span class="material-icons" title="Private">lock</span>';
            
            fileCard.innerHTML = `
                <div class="file-actions">
                    <button class="btn-icon edit-file" data-id="${file.id}" title="Edit">
                        <span class="material-icons">edit</span>
                    </button>
                    <button class="btn-icon delete-file" data-id="${file.id}" data-title="${file.title}" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
                <h3 class="file-title">${file.title}</h3>
                <div class="file-preview">${contentPreview}</div>
                <div class="file-meta">
                    <div class="file-stats">
                        ${visibilityIcon}
                        <span class="icon-title" title="Views"><span class="material-icons">visibility</span> ${views}</span>
                        <span class="icon-title" title="Likes"><span class="material-icons">favorite</span> ${likes}</span>
                    </div>
                    <div class="file-date">
                        <span class="material-icons"></span>
                        ${relativeTime}
                    </div>
                </div>
            `;
            

            // Handle click to view file
            fileCard.addEventListener('click', (e) => {
                // Don't navigate if clicked on action buttons
                if (e.target.closest('.file-actions')) return;
                
                window.location.href = `view-file.html?id=${file.id}`;
            });
            
            // Setup action buttons
            const editBtn = fileCard.querySelector('.edit-file');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `edit-file.html?id=${file.id}`;
                });
            }
            
            const deleteBtn = fileCard.querySelector('.delete-file');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDeleteModal(file.id, file.title);
                });
            }
            
            myFilesContainer.appendChild(fileCard);
        });
    }
    
    // Update pagination controls
    function updatePaginationControls() {
        if (pageIndicator) {
            pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        
        if (prevPageBtn) {
            prevPageBtn.disabled = currentPage <= 1;
        }
        
        if (nextPageBtn) {
            nextPageBtn.disabled = currentPage >= totalPages;
        }
    }
    
    // Open delete confirmation modal
    function openDeleteModal(fileId, fileName) {
        fileToDelete = fileId;
        if (deleteFileName) {
            deleteFileName.textContent = fileName;
        }
        if (deleteModal) {
            deleteModal.classList.remove('hidden');
        }
    }
    
    // Close delete modal
    function closeDeleteModal() {
        fileToDelete = null;
        if (deleteModal) {
            deleteModal.classList.add('hidden');
        }
    }
    
    // Delete file
    async function deleteFile() {
        if (!fileToDelete) return;
        
        try {
            // Delete from Firebase
            await database.ref(`mdfiles/${fileToDelete}`).remove();
            
            // Delete from Supabase storage
            await supabaseClient
                .storage
                .from('mdfiles')
                .remove([`${fileToDelete}.md`]);
            
            // Close modal
            closeDeleteModal();
            
            // Reload files
            loadUserFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert(`Error deleting file: ${error.message}`);
            closeDeleteModal();
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
    
    // Add Firebase auth state listener to reliably detect auth changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                if (authAlert) authAlert.classList.add('hidden');
                loadUserFiles();
            } else {
                // No user is signed in
                if (authAlert) authAlert.classList.remove('hidden');
                if (myFilesContainer) {
                    myFilesContainer.innerHTML = '<div class="md-file-placeholder">Login to view your files</div>';
                }
                if (emptyState) emptyState.classList.add('hidden');
            }
        });
    }
    
    // Handle user authentication callback (keeping for compatibility)
    window.onUserAuthenticated = function(user) {
        if (authAlert) authAlert.classList.add('hidden');
        loadUserFiles();
    };
    
    // Handle user signed out callback (keeping for compatibility)
    window.onUserSignedOut = function() {
        if (authAlert) authAlert.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (myFilesContainer) {
            myFilesContainer.innerHTML = '<div class="md-file-placeholder">Login to view your files</div>';
        }
    };
    
    // Initialize page
    initMyFilesPage();
});