document.addEventListener('DOMContentLoaded', function() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const htmlElement = document.documentElement;
    
    // Check for saved user preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
   
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


//?????????????????? Employee Profile Only

// JavaScript for loading funny circle (cut to only its head left) spinning that appears when page contents are being loaded in
  const loading_circle = document.createElement('div');
  loading_circle.id = 'load_bro';
  loading_circle.innerHTML = `
    <div class="fixed flex-col gap-5 inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div class="rounded-full animate-spin h-20 w-20 border-t-4 border-[#B57EDC] border-solid"></div>
    </div>
  `;
  document.body.appendChild(loading_circle);

  window.addEventListener('DOMContentLoaded', () => {
    const l = document.getElementById('load_bro');
    if (l) {
      l.remove();
    }
  });

  // JavaScript for opening and closing le popup boxes (education and skills)
  function openModal(id) {
    const modal = document.getElementById(id);
    const content = modal.querySelector('div');
    const main = document.getElementById('main-container');

    modal.classList.remove('hidden');
    setTimeout(() => {
      content.classList.remove('scale-0', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
      main.classList.add('opacity-80');
    }, 10);

    // Close modal if clicked outside the box
    modal.onclick = (e) => {
      if (e.target === modal) closeModal(id);
    };
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    const content = modal.querySelector('div');
    const main = document.getElementById('main-container');

    setTimeout(() => {
      content.classList.remove('scale-100');
      content.classList.add('scale-0');
      main.classList.remove('opacity-80');
    }, 10);
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);

  }

  // JavaScript for the navigation modal boxes that extends width to the left to show text on hover
  // and shrinks back to icon size when mouse go bye bye
  const btnSkills = document.getElementById('btn-skills');
  const btnEducation = document.getElementById('btn-education');
  const btnChat = document.getElementById('btn-chat');

  btnSkills.addEventListener('mouseover', () => {
    btnSkills.innerHTML = 'Skills';
    btnSkills.classList.remove('w-12');
    btnSkills.classList.add('w-32');
  });
  btnSkills.addEventListener('mouseout', () => {
    btnSkills.classList.remove('w-32');
    btnSkills.classList.add('w-12');
    btnSkills.innerHTML = '<i class="fa fa-dumbbell"></i>';
  });
  btnEducation.addEventListener('mouseover', () => {
    btnEducation.innerHTML = 'Education';
    btnEducation.classList.remove('w-12');
    btnEducation.classList.add('w-32');
  });
  btnEducation.addEventListener('mouseout', () => {
    btnEducation.classList.remove('w-32');
    btnEducation.classList.add('w-12');
    btnEducation.innerHTML = '<i class="fa fa-graduation-cap"></i>';
  });
  btnChat.addEventListener('mouseover', () => {
    btnChat.innerHTML = 'Chat';
    btnChat.classList.remove('w-12');
    btnChat.classList.add('w-32');
  });
  btnChat.addEventListener('mouseout', () => {
    btnChat.classList.remove('w-32');
    btnChat.classList.add('w-12');
    btnChat.innerHTML = '<i class="fa fa-comment-dots"></i>';
  });