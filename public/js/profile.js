// profile.js - Simplified to handle only user profile data
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileEmail = document.getElementById('profile-email');
    const profileWebsite = document.getElementById('profile-website');
    const profileGithub = document.getElementById('profile-github');
    const profileTwitter = document.getElementById('profile-twitter');
    const profileEditBtn = document.getElementById('profile-edit-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const editProfileForm = document.getElementById('edit-profile-form');
    
    // Edit profile button
    if (profileEditBtn) {
        profileEditBtn.addEventListener('click', openEditProfileModal);
    }
    
    // Edit profile form submission
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Function to open the edit profile modal
    function openEditProfileModal() {
        editProfileModal.classList.remove('hidden');
    }
    
    // Close modal when clicking the close button
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });
    
    // Function to be called when user is authenticated
    function onUserAuthenticated(user) {
        // Show edit profile button
        if (profileEditBtn) profileEditBtn.style.display = 'flex';
        
        // Load profile data
        loadUserProfile(user);
    }
    
    // Function to be called when user is signed out
    function onUserSignedOut() {
        // Hide edit profile button
        if (profileEditBtn) profileEditBtn.style.display = 'none';
        
        // Show not logged in message
        profileName.textContent = 'Not logged in';
        profileBio.textContent = 'Please login to view your profile.';
        profileEmail.textContent = 'N/A';
        profileWebsite.textContent = 'N/A';
        profileGithub.textContent = 'N/A';
        profileTwitter.textContent = 'N/A';
        
        // Reset profile image
        profileAvatar.src = '/api/placeholder/100/100';
    }
    
    // Load user profile data
    async function loadUserProfile(user) {
        if (!user) return;
        
        try {
            // Set basic info from auth
            if (user.photoURL) {
                profileAvatar.src = user.photoURL;
            } else {
                // Use placeholder with user initials if no photo
                profileAvatar.src = '/api/placeholder/100/100';
            }
            
            profileName.textContent = user.displayName || user.email || `User (${user.uid.substring(0, 6)}...)`;
            profileEmail.textContent = user.email || 'No email available';
            
            // Fetch extended profile data from database
            const profileRef = database.ref(`users/${user.uid}/profile`);
            const snapshot = await profileRef.once('value');
            const profileData = snapshot.val() || {};
            
            // Update UI with profile data
            if (profileData.bio) {
                profileBio.textContent = profileData.bio;
            } else {
                profileBio.textContent = 'No bio added yet. Click Edit Profile to add one!';
            }
            
            // Update social links
            profileWebsite.textContent = profileData.website || 'Not specified';
            if (profileData.website) {
                profileWebsite.href = profileData.website.startsWith('http') ? 
                    profileData.website : `https://${profileData.website}`;
            } else {
                profileWebsite.removeAttribute('href');
            }
            
            profileGithub.textContent = profileData.github || 'Not specified';
            if (profileData.github) {
                profileGithub.href = `https://github.com/${profileData.github}`;
            } else {
                profileGithub.removeAttribute('href');
            }
            
            profileTwitter.textContent = profileData.twitter || 'Not specified';
            if (profileData.twitter) {
                profileTwitter.href = `https://twitter.com/${profileData.twitter}`;
            } else {
                profileTwitter.removeAttribute('href');
            }
            
            // Prepare form data for edit profile modal
            document.getElementById('display-name').value = user.displayName || '';
            document.getElementById('bio').value = profileData.bio || '';
            document.getElementById('website').value = profileData.website || '';
            document.getElementById('github').value = profileData.github || '';
            document.getElementById('twitter').value = profileData.twitter || '';
            
        } catch (error) {
            console.error('Error loading profile:', error);
            profileBio.textContent = 'Error loading profile data. Please try again later.';
        }
    }
    
    // Handle profile update submission
    async function handleProfileUpdate(event) {
        event.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to update your profile.');
            return;
        }
        
        // Show loading state
        const submitButton = editProfileForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;
        
        try {
            // Get form values
            const displayName = document.getElementById('display-name').value.trim();
            const bio = document.getElementById('bio').value.trim();
            const website = document.getElementById('website').value.trim();
            const github = document.getElementById('github').value.trim();
            const twitter = document.getElementById('twitter').value.trim();
            
            // Update display name in Firebase Auth
            if (displayName) {
                await user.updateProfile({
                    displayName: displayName
                });
            }
            
            // Save profile data to database
            await database.ref(`users/${user.uid}/profile`).update({
                bio: bio,
                website: website,
                github: github,
                twitter: twitter,
                updatedAt: Date.now()
            });
            
            // Close modal and reload profile
            editProfileModal.classList.add('hidden');
            loadUserProfile(auth.currentUser);
            
            // Show success message
            alert('Profile updated successfully!');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Error updating profile: ${error.message}`);
        } finally {
            // Reset button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    }
    
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (user) {
            onUserAuthenticated(user);
        } else {
            onUserSignedOut();
        }
    });


    document.getElementById('back-btn').addEventListener('click', function() {
        console.log("clickez")

        window.history.back();

    })

});
