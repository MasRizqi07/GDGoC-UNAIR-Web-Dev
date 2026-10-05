document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        themeToggleBtn.textContent = '☀️ Light Mode';
    }

    themeToggleBtn.addEventListener('click', () => {
        
        let theme = document.documentElement.getAttribute('data-theme');
        
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = '🌙 Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = '☀️ Light Mode';
        }
    });
});