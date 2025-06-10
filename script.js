document.addEventListener('DOMContentLoaded', function() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const htmlElement = document.documentElement;
    
    // Check for saved user preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        htmlElement.classList.add('dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    darkModeToggle.addEventListener('click', function() {
        htmlElement.classList.toggle('dark');
        
        if (htmlElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
    
    // Card click handlers (would be replaced with actual navigation in a real app)
    document.querySelectorAll('.card button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            // In a real app, this would navigate to the profile/company page
            alert('This would navigate to the profile/company page in a real application');
        });
    });
    
    // Search functionality (mock implementation)
    const searchInput = document.querySelector('.form-control');
    const searchButton = document.querySelector('.btn-accent');
    
    searchButton.addEventListener('click', function() {
        if (searchInput.value.trim()) {
            alert(`Searching for: ${searchInput.value}`);
            // In a real app, this would trigger a search API call
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            alert(`Searching for: ${searchInput.value}`);
            // In a real app, this would trigger a search API call
        }
    });
    
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});