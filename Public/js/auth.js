// Auth State and User Management
let currentUser = null;

// Initialize Firebase Auth persistence first
if (firebase.auth) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .catch((error) => {
            console.error("Auth persistence error:", error);
        });
}

// DOM Elements for Auth UI
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userStatus = document.getElementById('user-status');
const loginModal = document.getElementById('login-modal');

// Check if DOM elements exist on the current page
if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// If anonymous login button exists in the modal
const anonLoginBtn = document.getElementById('anon-login');
if (anonLoginBtn) anonLoginBtn.addEventListener('click', loginAnonymously);

// Google login button
const googleLoginBtn = document.getElementById('google-login');
if (googleLoginBtn) googleLoginBtn.addEventListener('click', loginWithGoogle);

// Modal close buttons
const modalCloseButtons = document.querySelectorAll('.modal-close');
modalCloseButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Find the closest parent modal
        const modal = button.closest('.modal');
        if (modal) modal.classList.add('hidden');
    });
});

// Auth State Change Listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        currentUser = user;
        
        // Update display name and profile image in UI
        if (userStatus) {
            if (user.isAnonymous) {
                userStatus.textContent = `Anonymous (${user.uid.substring(0, 6)}...)`;
            } else {
                // For Google users, show their display name or email
                const displayName = user.displayName || user.email || `User (${user.uid.substring(0, 6)}...)`;
                const profileImage = user.photoURL ? `<img class="user-avatar" src="${user.photoURL}" alt="Profile Image" class="profile-img">` : '';
                userStatus.innerHTML = `${profileImage} ${displayName}`;
            }
        }
        // Update UI for logged in state
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if( userStatus) {
            userStatus.addEventListener('click', () => {
                window.location.href = "profile.html"
            });
        }
        
        // Call page-specific init functions if they exist
        if (typeof onUserAuthenticated === 'function') {
            onUserAuthenticated(user);
        }
    } else {
        // User is signed out
        currentUser = null;
        if (userStatus) userStatus.textContent = 'Not logged in';
        
        // Update UI for logged out state
        if (loginBtn) loginBtn.style.display = 'flex';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Call page-specific logout functions if they exist
        if (typeof onUserSignedOut === 'function') {
            onUserSignedOut();
        }
    }
});

// Functions
function openLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('hidden');
    } else {
        console.error('Login modal not found');
        // Redirect to login page if modal is not found
        window.location.href = 'index.html?login=true';
    }
}

const urlParams = new URLSearchParams(window.location.search);

// Check if "login=true" exists
if (urlParams.get("login") === "true") {
    openLoginModal();
}  

async function loginAnonymously() {
    try {
        await auth.signInAnonymously();
        // Close login modal if it exists
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error signing in:', error);
        alert(`Error signing in: ${error.message}`);
    }
}

async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        // Add scopes if needed
        provider.addScope('profile');
        provider.addScope('email');
        
        // Set custom parameters to enable one-tap sign-in
        provider.setCustomParameters({
            'prompt': 'select_account'
        });
        
        // Check if the user is on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            try {
                // Try using signInWithPopup first for mobile
                const result = await auth.signInWithPopup(provider);
                console.log('Mobile popup auth successful');
                
                // Close login modal
                if (loginModal) {
                    loginModal.classList.add('hidden');
                }
            } catch (popupError) {
                console.warn('Mobile popup auth failed, trying redirect:', popupError);
                
                // If popup fails, fall back to redirect
                await auth.signInWithRedirect(provider);
            }
        } else {
            // Use signInWithPopup for desktop
            const result = await auth.signInWithPopup(provider);
            
            // Close login modal
            if (loginModal) {
                loginModal.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error signing in with Google:', error);
        
        // Handle specific errors
        if (error.code === 'auth/missing-initial-state') {
            alert('Authentication failed due to browser privacy settings. Please ensure cookies and site data are enabled, or try a different browser.');
        } else {
            alert(`Error signing in with Google: ${error.message}`);
        }
    }
}

// Handle redirect result
// This should run on page load to handle any returning redirects
auth.getRedirectResult().then((result) => {
    if (result.user) {
        // User successfully signed in after redirect
        console.log('User signed in after redirect');
        // Close login modal if it exists
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
    }
}).catch((error) => {
    console.error('Error with redirect sign-in:', error);
    
    // Better error handling for redirect errors
    if (error.code === 'auth/missing-initial-state') {
        console.warn('Missing initial state error - this may happen if browser sessionStorage is inaccessible');
        // Don't show alert here as it can create a loop on page load
    } else if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection and try again.');
    } else if (error.code) {
        console.warn(`Auth redirect error (${error.code}): ${error.message}`);
    }
});

async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
        alert(`Error signing out: ${error.message}`);
    }
}

// Check if user has appropriate permissions
function isOwner(fileUserId) {
    return currentUser && currentUser.uid === fileUserId;
}

// Get current user ID safely
function getCurrentUserId() {
    return currentUser ? currentUser.uid : null;
}

// Get current user display name
function getCurrentUserDisplayName() {
    if (!currentUser) return null;
    
    if (currentUser.isAnonymous) {
        return `Anonymous (${currentUser.uid.substring(0, 6)}...)`;
    }
    
    return currentUser.displayName || currentUser.email || `User (${currentUser.uid.substring(0, 6)}...)`;
}

// GitHub login button
const githubLoginBtn = document.getElementById('github-login');
if (githubLoginBtn) githubLoginBtn.addEventListener('click', loginWithGithub);

async function loginWithGithub() {
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        
        // Add scopes if needed
        provider.addScope('read:user');
        
        // Check if the user is on a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            try {
                // Try using signInWithPopup first for mobile
                const result = await auth.signInWithPopup(provider);
                console.log('Mobile popup auth successful with GitHub');
                
                // Close login modal
                if (loginModal) {
                    loginModal.classList.add('hidden');
                }
            } catch (popupError) {
                console.warn('Mobile popup auth failed, trying redirect:', popupError);
                
                // If popup fails, fall back to redirect
                await auth.signInWithRedirect(provider);
            }
        } else {
            // Use signInWithPopup for desktop
            const result = await auth.signInWithPopup(provider);
            
            // Close login modal
            if (loginModal) {
                loginModal.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error signing in with GitHub:', error);
        
        // Handle specific errors
        if (error.code === 'auth/account-exists-with-different-credential') {
            alert('An account already exists with the same email address but different sign-in credentials. Sign in using the provider associated with this email address.');
        } else {
            alert(`Error signing in with GitHub: ${error.message}`);
        }
    }
}

// Export functions for use in other modules
// Export functions for use in other modules
window.auth = {
    getCurrentUserId,
    getCurrentUserDisplayName,
    isOwner,
    loginAnonymously,
    loginWithGoogle,
    loginWithGithub, // Add this line
    logout,
    openLoginModal
};