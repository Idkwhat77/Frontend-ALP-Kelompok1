// Show body with fade-in on load
window.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("hidden");

  // Remove loading spinner after load
  const loadingElement = document.getElementById("load_bro");
  if (loadingElement) loadingElement.remove();

  // Province and City selection
  const provinceCityMap = {
    "DKI Jakarta": ["Jakarta"],
    "Jawa Barat": ["Bandung", "Bekasi", "Depok", "Bogor"],
    "Jawa Tengah": ["Semarang", "Surakarta", "Magelang"],
    "Jawa Timur": ["Surabaya", "Malang", "Kediri"],
    "Bali": ["Denpasar", "Ubud"]
  };

  const provinceSelect = document.getElementById("province");
  const citySelect = document.getElementById("city");

  if (provinceSelect && citySelect) {
    provinceSelect.addEventListener("change", () => {
      const cities = provinceCityMap[provinceSelect.value] || [];
      citySelect.innerHTML = cities.length
        ? `<option value="" disabled selected>Select City</option>`
        : `<option value="" disabled selected>No cities available</option>`;

      cities.forEach(city => {
        const opt = document.createElement("option");
        opt.textContent = city;
        opt.value = city;
        citySelect.appendChild(opt);
      });

      citySelect.disabled = !cities.length;
    });
  }

  // Role Selection Transitions
  let currentScreen = "first-role-selection";

  const screenOrder = [
    "first-role-selection",
    "employee-role-part-1",
    "company-role-part-1"
  ];

  function isForward(fromId, toId) {
    return screenOrder.indexOf(toId) > screenOrder.indexOf(fromId);
  }

  window.goTo = function (targetId) {
    if (targetId === currentScreen) return;

    const current = document.getElementById(currentScreen);
    const target = document.getElementById(targetId);
    if (!current || !target) return;

    const goingForward = isForward(currentScreen, targetId);

    // Clean up any existing animation classes
    const classes = [
      "animate-slideInLeft",
      "animate-slideInRight",
      "animate-slideOutLeft",
      "animate-slideOutRight"
    ];
    current.classList.remove(...classes);
    target.classList.remove(...classes);

    // Show both temporarily
    current.classList.remove("hidden");
    target.classList.remove("hidden");
    current.classList.add(goingForward ? "animate-slideOutLeft" : "animate-slideOutRight");
    target.classList.add(goingForward ? "animate-slideInRight" : "animate-slideInLeft");

    setTimeout(() => {
      current.classList.add("hidden");
      currentScreen = targetId;
    }, 500);
  };
});
