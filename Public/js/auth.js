// Auth State and User Management
let currentUser = null;

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
        
        // Update display name in UI
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
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
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

// Check if "embed=true" exists
if (urlParams.get("login") === "true") {
    openLoginModal();
}  

async function loginAnonymously() {
    try {
        await auth.signInAnonymously();
      //  console.log('User signed in anonymously');
        
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
        await auth.signInWithPopup(provider);
       // console.log('User signed in with Google');
        
        // Close login modal
        if (loginModal) {
            loginModal.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert(`Error signing in with Google: ${error.message}`);
    }
}

async function logout() {
    try {
        await auth.signOut();
        //console.log('User signed out');
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

// Export functions for use in other modules
// These will be accessible as auth.functionName
window.auth = {
    getCurrentUserId,
    getCurrentUserDisplayName,
    isOwner,
    loginAnonymously,
    loginWithGoogle,
    logout,
    openLoginModal
};