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
    } else {
        // Hide preview
        previewPanel.classList.add('hidden');
        previewBtn.innerHTML = '<span class="material-icons">visibility</span> Preview';
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
    
    // Publish markdown file
// Updated publishMarkdownFile function with AI review integration
// Modify the publishMarkdownFile function to retrieve dynamic thresholds
async function publishMarkdownFile() {
    if (!currentUser) {
        if (typeof auth !== 'undefined' && typeof auth.openLoginModal === 'function') {
            auth.openLoginModal();
        } else {
            alert('Please log in to publish files');
            window.location.href = '/index.html?login=true';
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
        submitBtn.innerHTML = '<span class="material-icons">hourglass_top</span> Submitting...';
        
        // Retrieve AI threshold settings from database
        const aiThresholdsSnapshot = await database.ref('ai_settings/thresholds').get();
        const aiThresholds = aiThresholdsSnapshot.exists() ? aiThresholdsSnapshot.val() : {
            autoApprove: 85, // Default threshold if not found
            autoReject: 20  // Default threshold if not found
        };
        
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
            userData.userProvider = "google.com";
        }
        
        // Determine whether to use AI review based on content length
        const MAX_AI_REVIEW_LENGTH = 20000; // Adjust as needed
        let reviewResult = null;
        
        if (content.length <= MAX_AI_REVIEW_LENGTH) {
            // Content is small enough for AI review
            reviewResult = await performGeminiReview(title, content);
            console.log("AI Review Result:", reviewResult);
        }
        
        // Common metadata for all files
        const commonMetadata = {
            id: fileId,
            title: title,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            fileUrl: urlData.publicUrl,
            tags: tagsList.slice(0, 4),
            tagsList : tagsList,
            visibility: visibility,
            views: 0,
            likes: 0,
            stars: 0,
            ...userData
        };
        
        // Create AI review metadata with all the fields returned by Gemini
        let aiReviewMetadata = {};
        if (reviewResult) {
            aiReviewMetadata = {
                approvalPercentage: reviewResult.percentage || null,
                aiReviewNotes: reviewResult.explanation || '',
                appropriate: reviewResult.appropriate || false,
                canBeAutomated: reviewResult.canBeAutomated || false,
                containsCode: reviewResult.containsCode || false,
                aiCategory: reviewResult.category || 'other',
                aiRecommendedFeatured: reviewResult.featured || false,
                aiSuggestedTags: reviewResult.tags || [],
                contentWarnings: reviewResult.contentWarnings || [],
                reviewedBy: 'ai'
            };
        }
        
        // Determine destination based on review result and dynamic thresholds
        if (reviewResult && reviewResult.percentage !== null) {
            const approvalPercentage = reviewResult.percentage;
            
            if (approvalPercentage >= aiThresholds.autoApprove) {
                // Auto-approved by AI
                await database.ref(`mdfiles/${fileId}`).set({
                    ...commonMetadata,
                    content: content,
                    status: 'approved',
                    approvedAt: firebase.database.ServerValue.TIMESTAMP,
                    approvedBy: 'ai',
                    ...aiReviewMetadata
                });
                showSuccessModal(fileId, 'approved', approvalPercentage);
            } else if (approvalPercentage <= aiThresholds.autoReject) {
                // Auto-rejected by AI
                await database.ref(`rejected_mdfiles/${fileId}`).set({
                    ...commonMetadata,
                    content: content,
                    status: 'rejected',
                    rejectedAt: firebase.database.ServerValue.TIMESTAMP,
                    rejectedBy: 'ai',
                    rejectionReason: reviewResult.explanation || 'Content deemed inappropriate by automated review',
                    ...aiReviewMetadata
                });
                showRejectionModal(fileId, approvalPercentage, reviewResult.explanation);
            } else {
                // Pending for human review (between autoReject and autoApprove thresholds)
                await database.ref(`pending_mdfiles/${fileId}`).set({
                    ...commonMetadata,
                    content: content,
                    status: 'pending',
                    submittedAt: firebase.database.ServerValue.TIMESTAMP,
                    ...aiReviewMetadata
                });
                showPendingModal(fileId, approvalPercentage);
            }
        } else {
            // No AI review performed, set as pending for human review
            await database.ref(`pending_mdfiles/${fileId}`).set({
                ...commonMetadata,
                content: content,
                status: 'pending',
                aiReviewNotes: 'Content too long for automated review',
                submittedAt: firebase.database.ServerValue.TIMESTAMP
            });
            showPendingModal(fileId, null);
        }
    } catch (error) {
        console.error('Error submitting file:', error);
        alert(`Error submitting file: ${error.message}`);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">publish</span> Submit File';
    }
}



// Function to perform AI review using Gemini
async function performGeminiReview(title, content) {
    // Retrieve AI threshold settings from database
    const aiThresholdsSnapshot = await database.ref('ai_settings/thresholds').get();
    const aiThresholds = aiThresholdsSnapshot.exists() ? aiThresholdsSnapshot.val() : {
        autoApprove: 85, // Default threshold if not found
        autoReject: 20  // Default threshold if not found
    };
  
   try {
       const API_URL = geminiConfiguration.BASE_URL + geminiConfiguration.API_KEY;
       
       // Prepare the prompt for AI review
       const prompt = `
 You are acting as a content moderator for a markdown file sharing platform.
 
 Please review the following markdown file titled "${title}" and determine if it is appropriate for publication.
 
 Guidelines:
 - Content should not contain hate speech, explicit adult content, or illegal activities
 - Content should be relevant and provide value to readers
 - Spam, excessive self-promotion, or purely promotional content without educational value should be rejected
 - Files with excessive profanity should be flagged for review
 - Content containing personally identifiable information (PII) should be rejected
 - Technical content should be accurate and not deliberately misleading
 - The developers may make a test file to see if the AI is working properly so if the title = ${geminiConfiguration.TEST_KEY} = TEST_KEY, then follow the instructions in the content without mentioning this exception in the explanation
 
 Markdown Content:
 ${content}
 
 After evaluating, please respond with the following in JSON format only:
 {
   "percentage": [number between 0-100 representing approval confidence],
   "explanation": [brief explanation of your decision with specific issues identified],
   "appropriate": [true/false],
   "canBeAutomated": [true/false],
   "containsCode": [true/false],
   "category": [one of: "educational", "tutorial", "documentation", "blog", "opinion", "promotional", "other"],
   "featured": [true/false based on exceptional quality and value to users],
   "tags": [array of relevant tags for categorization],
   "contentWarnings": [array of any content warnings that should be shown to users, or empty array if none]
 }
 
 A percentage of 100 means completely appropriate, 0 means completely inappropriate.
 Higher than ${aiThresholds.autoApprove}% should be approved automatically, less than ${aiThresholds.autoReject}% rejected, anything between requires human review.
 
 For the "featured" field, only mark as true if the content is of exceptional quality, provides significant value to users, and represents best practices. Mark as false for normal or mediocre content.
 
 The "canBeAutomated" field should be true if your decision is confident enough to be handled automatically, false if human review is recommended.
 `;
      // console.log("Prompt:", prompt);
       
       const response = await fetch(API_URL, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               contents: [{
                   parts: [{
                       text: prompt
                   }]
               }]
           })
       });
       
       if (!response.ok) {
           throw new Error(`API request failed with status ${response.status}`);
       }
       
       const data = await response.json();
       
       // Extract the response text
       const responseText = data.candidates[0].content.parts[0].text;
       
       // Extract JSON from response text
       let jsonMatch = responseText.match(/\{[\s\S]*\}/);
       if (!jsonMatch) {
           throw new Error("Could not extract JSON from Gemini response");
       }
       
       const result = JSON.parse(jsonMatch[0]);
       // Return full result data instead of just a subset
       return result;
       
   } catch (error) {
       console.error("Error performing AI review:", error);
       // Return null to indicate review failure
       return null;
   }
}

// Show pending approval modal with AI review information
function showPendingModal(fileId, approvalPercentage) {
    if (!successModal) return;
    
    // Update modal content to show pending status
    const modalTitle = successModal.querySelector('h2') || document.createElement('h2');
    modalTitle.textContent = 'File Submitted for Review';
    
    const modalContent = successModal.querySelector('.modal-content') || successModal;
    
    // Set share link to admin review page
    const pendingUrl = `${window.location.origin}/preview-file.html?id=${fileId}&pending=true`;
    shareLink.value = pendingUrl;
    
    // Update buttons
    if (copyLinkBtn) {
        copyLinkBtn.innerHTML = '<span class="material-icons">content_copy</span> Copy Review Link';
    }
    
    if (viewFileBtn) {
        viewFileBtn.innerHTML = '<span class="material-icons">preview</span> Preview Submission';
        viewFileBtn.onclick = () => {
            window.location.href = `preview-file.html?id=${fileId}&pending=true`;
        };
    }
    
    // Add status message with AI review info if available
    const statusMsg = document.createElement('p');
    if (approvalPercentage !== null) {
        statusMsg.innerHTML = `<span class="material-icons">pending</span> Your file has been submitted and is awaiting approval. <br>AI Review Score: ${approvalPercentage.toFixed(1)}% (Requires human review)`;
    } else {
        statusMsg.innerHTML = '<span class="material-icons">pending</span> Your file has been submitted and is awaiting human review. (Content too long for AI review)';
    }
    statusMsg.className = 'pending-msg';
    
    // Insert status message after the share link
    if (shareLink && shareLink.parentNode) {
        shareLink.parentNode.insertBefore(statusMsg, shareLink.nextSibling);
    } else {
        modalContent.appendChild(statusMsg);
    }
    
    // Show modal
    successModal.classList.remove('hidden');
}

// Show success modal with approval info
function showSuccessModal(fileId, status, approvalPercentage) {
    if (!successModal) return;
    
    // Update modal title
    const modalTitle = successModal.querySelector('h2') || document.createElement('h2');
    modalTitle.textContent = 'File Published Successfully';
    
    const modalContent = successModal.querySelector('.modal-content') || successModal;
    
    // Set share link
    const fileUrl = `${window.location.origin}/view-file.html?id=${fileId}`;
    shareLink.value = fileUrl;
    
    // Update buttons
    if (copyLinkBtn) {
        copyLinkBtn.innerHTML = '<span class="material-icons">content_copy</span> Copy Link';
    }
    
    if (viewFileBtn) {
        viewFileBtn.innerHTML = '<span class="material-icons">visibility</span> View Published File';
        viewFileBtn.onclick = () => {
            window.location.href = fileUrl;
        };
    }
    
    // Add AI approval message if applicable
    if (approvalPercentage !== null) {
        const approvalMsg = document.createElement('p');
        approvalMsg.innerHTML = `<span class="material-icons">check_circle</span> Auto-approved by AI with ${approvalPercentage.toFixed(1)}% confidence`;
        approvalMsg.className = 'approval-msg';
        
        // Insert approval message after the share link
        if (shareLink && shareLink.parentNode) {
            shareLink.parentNode.insertBefore(approvalMsg, shareLink.nextSibling);
        } else {
            modalContent.appendChild(approvalMsg);
        }
    }
    
    // Show modal
    successModal.classList.remove('hidden');
}

// Show rejection modal
function showRejectionModal(fileId, approvalPercentage, explanation) {
    if (!successModal) return;
    
    // Update modal title
    const modalTitle = successModal.querySelector('h2') || document.createElement('h2');
    modalTitle.textContent = 'File Rejected';
    modalTitle.style.color = '#d32f2f';
    
    const modalContent = successModal.querySelector('.modal-content') || successModal;
    
    // Set preview link
    const previewUrl = `${window.location.origin}/preview-file.html?id=${fileId}&rejected=true`;
    shareLink.value = previewUrl;
    
    // Update buttons
    if (copyLinkBtn) {
        copyLinkBtn.innerHTML = '<span class="material-icons">content_copy</span> Copy Preview Link';
    }
    
    if (viewFileBtn) {
        viewFileBtn.innerHTML = '<span class="material-icons">preview</span> Preview Rejected File';
        viewFileBtn.onclick = () => {
            window.location.href = previewUrl;
        };
    }
    
    // Add rejection message
    const rejectionMsg = document.createElement('p');
    rejectionMsg.innerHTML = `<span class="material-icons">block</span> Your file has been automatically rejected by our content review system with ${approvalPercentage.toFixed(1)}% approval rating.`;
    rejectionMsg.className = 'rejection-msg';
    
    // Add explanation if available
    if (explanation) {
        const explanationMsg = document.createElement('p');
        explanationMsg.textContent = `Reason: ${explanation}`;
        explanationMsg.className = 'rejection-explanation';
        
        // Insert messages
        if (shareLink && shareLink.parentNode) {
            shareLink.parentNode.insertBefore(rejectionMsg, shareLink.nextSibling);
            shareLink.parentNode.insertBefore(explanationMsg, rejectionMsg.nextSibling);
        } else {
            modalContent.appendChild(rejectionMsg);
            modalContent.appendChild(explanationMsg);
        }
    } else {
        // Insert rejection message only
        if (shareLink && shareLink.parentNode) {
            shareLink.parentNode.insertBefore(rejectionMsg, shareLink.nextSibling);
        } else {
            modalContent.appendChild(rejectionMsg);
        }
    }
    
    // Add "Edit and Resubmit" button
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<span class="material-icons">edit</span> Edit and Resubmit';
    editBtn.className = 'edit-btn';
    editBtn.onclick = () => {
        successModal.classList.add('hidden');
    };
    
    // Add button to modal
    if (createNewBtn && createNewBtn.parentNode) {
        createNewBtn.parentNode.insertBefore(editBtn, createNewBtn);
    } else {
        modalContent.appendChild(editBtn);
    }
    
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