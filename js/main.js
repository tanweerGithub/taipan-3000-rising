/**
 * Taipan 3000: Rising — shell navigation only.
 * No game logic at this stage (trading, travel, saves, etc. come later).
 */
(function () {
  var SCREEN_IDS = ["station", "galaxy", "tavern", "ship"];

  function showScreen(id) {
    if (SCREEN_IDS.indexOf(id) === -1) return;

    SCREEN_IDS.forEach(function (name) {
      var section = document.getElementById("screen-" + name);
      var navBtn = document.querySelector('.nav-btn[data-screen="' + name + '"]');
      var active = name === id;

      if (section) {
        section.classList.toggle("is-active", active);
        if (active) {
          section.removeAttribute("hidden");
        } else {
          section.setAttribute("hidden", "");
        }
      }

      if (navBtn) {
        navBtn.classList.toggle("is-active", active);
        if (active) {
          navBtn.setAttribute("aria-current", "page");
        } else {
          navBtn.removeAttribute("aria-current");
        }
      }
    });
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-screen]");
    if (!trigger || trigger.disabled) return;

    // Only treat as navigation when it's a nav control, not a disabled game action
    var id = trigger.getAttribute("data-screen");
    if (!id) return;

    // Buttons that are both data-screen and disabled game actions are skipped above
    if (trigger.matches("button.nav-btn, button.text-link, button.btn-ghost[data-screen]")) {
      event.preventDefault();
      showScreen(id);
    }
  });

  // Default screen
  showScreen("station");
})();
