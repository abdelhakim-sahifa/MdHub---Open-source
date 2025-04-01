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


const isAnimated = localStorage.getItem("advancedAnimation") || "false"; 


if (isAnimated === "true") {

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "css/components-animated.css";
    document.head.appendChild(link2);
}





const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
document.head.appendChild(link);





document.querySelector('.footer-content').innerHTML= "" ;
document.querySelector('.footer-content').innerHTML= `
<div>
<p>MDHub © 2025</p>
<p class="sahifa-logo">sahifa.</p>
</div>
            <div class="footer-links">
                <a href="about.html">
                    <i class="fas fa-info-circle"></i>
                    About

                </a>
                <a href="terms.html">
                    <i class="fas fa-file-contract"></i>
                    Terms
                </a>
                <a href="privacy.html">
                    <i class="fas fa-user-shield"></i>
                    Privacy
                </a>
                <a href="feedback.html">
                    <i class="fas fa-comment-dots"></i>
                    Feedback
                </a>
                <a href="https://www.reddit.com/r/MDHub/" target="_blank">
                    <i class="fab fa-reddit"></i>
                    Reddit Community
                </a>
                <a href="https://github.com/abdelhakim-sahifa/MdHub---Open-source" target="_blank">
                    <i class="fas fa-code"></i>
                    Source
                </a>
            </div>

` ;