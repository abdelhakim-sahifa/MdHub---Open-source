// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const themeIcon = themeToggle?.querySelector('.material-icons');

// Check user preference or localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Set theme to either 'light' or 'dark'
function setTheme(theme) {

    if (theme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.textContent = 'light_mode';
    } else {
        htmlElement.setAttribute('data-theme', 'light');
        if (themeIcon) themeIcon.textContent = 'dark_mode';
    }
    localStorage.setItem('theme', theme);
  
}

// Toggle theme
function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Add event listener if theme toggle exists
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Initialize theme on page load
initTheme();

// Export functions for use in other modules
window.theme = {
    setTheme,
    toggleTheme
};