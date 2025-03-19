// Create File Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Editor elements
    const mdTitle = document.getElementById('md-title');
    const mdContent = document.getElementById('md-content');
    const mdTags = document.getElementById('md-tags');
    const mdVisibility = document.getElementById('md-visibility');
    const previewBtn = document.getElementById('preview-btn');
    const submitBtn = document.getElementById('submit-btn');
    const previewPanel = document.getElementById('preview-panel');
    const mdPreview = document.getElementById('md-preview');
    const successModal = document.getElementById('success-modal');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const viewFileBtn = document.getElementById('view-file-btn');
    const createNewBtn = document.getElementById('create-new-btn');
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    
    // Event listeners
    if (previewBtn) {
        previewBtn.addEventListener('click', togglePreview);
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', publishMarkdownFile);
    }
    
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyShareLink);
    }
    
    if (viewFileBtn) {
        viewFileBtn.addEventListener('click', viewPublishedFile);
    }
    
    if (createNewBtn) {
        createNewBtn.addEventListener('click', resetEditor);
    }
    
    // Setup toolbar buttons
    toolbarButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            applyMarkdownFormatting(action);
        });
    });
    
    // Track current file state
    let currentFileId = null;
    let isPreviewMode = false;
    
    // Toggle between edit and preview modes
    function togglePreview() {
        if (!mdContent.value.trim()) {
            alert('Nothing to preview');
            return;
        }
        
        isPreviewMode = !isPreviewMode;
        
        if (isPreviewMode) {
            // Show preview
            mdPreview.innerHTML = marked.parse(mdContent.value);
            previewPanel.classList.remove('hidden');
            previewBtn.innerHTML = '<span class="material-icons">edit</span> Edit';
        } else {
            // Hide preview
            previewPanel.classList.add('hidden');
            previewBtn.innerHTML = '<span class="material-icons">visibility</span> Preview';
        }
    }
    
    // Publish markdown file
    async function publishMarkdownFile() {
        if (!currentUser) {
            if (typeof auth !== 'undefined' && typeof auth.openLoginModal === 'function') {
                auth.openLoginModal();
            } else {
                // Fallback - redirect to login page or show a login modal
                alert('Please log in to publish files');
                window.location.href = '/index.html?login=true'; // Adjust path as needed
            }
            return;
        }
        
        const title = mdTitle.value.trim();
        const content = mdContent.value.trim();
        const tags = mdTags.value.trim();
        const visibility = mdVisibility.value;
        
        if (!title || !content) {
            alert('Please provide both title and content');
            return;
        }
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Publishing...';
            
            // Generate a unique ID for the file
            const fileId = generateUniqueId();
            currentFileId = fileId;
            
            // Parse tags
            const tagsList = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            
            // Upload content to Supabase
            const { data, error } = await supabaseClient
                .storage
                .from('mdfiles')
                .upload(`${fileId}.md`, new Blob([content], { type: 'text/markdown' }), {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) throw error;
            
            // Get file URL
            const { data: urlData } = supabaseClient
                .storage
                .from('mdfiles')
                .getPublicUrl(`${fileId}.md`);
            
            // Prepare user data for database
            let userData = {
                userId: currentUser.uid,
                isAnonymous: currentUser.isAnonymous
            };
            
            // Add Google-specific user data if available
            if (!currentUser.isAnonymous) {
                userData.userDisplayName = currentUser.displayName || null;
                userData.userEmail = currentUser.email || null;
                userData.userPhotoURL = currentUser.photoURL || null;
                userData.userProvider = currentUser.providerData.length > 0 ? 
                    currentUser.providerData[0].providerId : 'unknown';
            }
            
            // Store metadata in Firebase
            await database.ref(`mdfiles/${fileId}`).set({
                id: fileId,
                title: title,
                content: content, // Store in Firebase for easier retrieval
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                fileUrl: urlData.publicUrl,
                tags: tagsList,
                visibility: visibility,
                views: 0,
                likes: 0,
                stars: 0,
                ...userData // Spread the user data into the file object
            });
            
            // Show success modal
            showSuccessModal(fileId);
        } catch (error) {
            console.error('Error publishing file:', error);
            alert(`Error publishing file: ${error.message}`);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-icons">publish</span> Share File';
        }
    }
    
    // Show success modal
    function showSuccessModal(fileId) {
        if (!successModal) return;
        
        // Set share link
        const fileUrl = `${window.location.origin}/view-file.html?id=${fileId}`;
        shareLink.value = fileUrl;
        
        // Show modal
        successModal.classList.remove('hidden');
    }
    
    // Copy share link to clipboard
    function copyShareLink() {
        shareLink.select();
        document.execCommand('copy');
        
        // Show feedback
        copyLinkBtn.innerHTML = '<span class="material-icons">check</span>';
        setTimeout(() => {
            copyLinkBtn.innerHTML = '<span class="material-icons">content_copy</span>';
        }, 2000);
    }
    
    // View published file
    function viewPublishedFile() {
        if (currentFileId) {
            window.location.href = `view-file.html?id=${currentFileId}`;
        }
    }
    
    // Reset editor for a new file
    function resetEditor() {
        mdTitle.value = '';
        mdContent.value = '';
        mdTags.value = '';
        mdVisibility.value = 'public';
        currentFileId = null;
        
        // Hide success modal
        if (successModal) {
            successModal.classList.add('hidden');
        }
        
        // Reset preview if needed
        if (isPreviewMode) {
            togglePreview();
        }
    }
    
    // Apply markdown formatting
    function applyMarkdownFormatting(action) {
        const textarea = mdContent;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let insertion = '';
        let selectionOffset = 0;
        
        switch (action) {
            case 'bold':
                insertion = `**${selectedText || 'bold text'}**`;
                selectionOffset = 2;
                break;
            case 'italic':
                insertion = `*${selectedText || 'italic text'}*`;
                selectionOffset = 1;
                break;
            case 'heading':
                insertion = `## ${selectedText || 'Heading'}`;
                selectionOffset = 3;
                break;
            case 'link':
                insertion = `[${selectedText || 'link text'}](url)`;
                selectionOffset = selectedText ? selectedText.length + 3 : 11;
                break;
            case 'list':
                insertion = selectedText ? selectedText.split('\n').map(line => `- ${line}`).join('\n') : '- list item';
                selectionOffset = 2;
                break;
            case 'code':
                insertion = selectedText ? '```\n' + selectedText + '\n```' : '```\ncode block\n```';
                selectionOffset = 4;
                break;
            case 'quote':
                insertion = selectedText ? selectedText.split('\n').map(line => `> ${line}`).join('\n') : '> quote';
                selectionOffset = 2;
                break;
        }
        
        // Insert the formatted text
        textarea.focus();
        document.execCommand('insertText', false, insertion);
        
        // If no text was selected, position cursor appropriately
        if (!selectedText) {
            const newCursorPos = start + insertion.length - selectionOffset;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
    }
    
    // Handle user authentication callback
    window.onUserAuthenticated = function(user) {
        // Enable submit button if it was disabled due to auth
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    };
    
    // Handle user signed out callback
    window.onUserSignedOut = function() {
        // Nothing specific needed for editor when signed out
    };

    document.getElementById("back-btn").addEventListener("click", function() {window.location.href = "index.html";});
});