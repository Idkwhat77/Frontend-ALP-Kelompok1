(function () {
  const html = document.documentElement;

  // Immediately apply saved preference on load (BEFORE anything renders)
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") {
    html.classList.add("dark");
  } else if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    html.classList.add("dark");
  }

  // Setup toggle behavior once DOM is loaded
  window.addEventListener("DOMContentLoaded", () => {
    const darkToggle = document.getElementById("darkModeToggle");
    const mobileDarkToggle = document.getElementById("mobileDarkModeToggle");

    const toggleDarkMode = () => {
      html.classList.toggle("dark");
      localStorage.setItem("darkMode", html.classList.contains("dark"));
    };

    if (darkToggle) darkToggle.addEventListener("click", toggleDarkMode);
    if (mobileDarkToggle) mobileDarkToggle.addEventListener("click", toggleDarkMode);
  });
})();
