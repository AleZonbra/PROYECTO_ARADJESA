document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuToggleBtn");
  const navBar = document.getElementById("navBar");
  const backdrop = document.getElementById("navBackdrop");
  const closeBtn = document.getElementById("closeNavBtn");
  const appBody = document.querySelector(".appBody");
  const mobileQuery = window.matchMedia("(max-width: 992px)");
  const storageKey = "sisaradSidebarOpen";

  function isMobileView() {
    return mobileQuery.matches;
  }

  function isMenuOpen() {
    if (!navBar || !appBody) return false;
    if (isMobileView()) return navBar.classList.contains("open");
    return !appBody.classList.contains("sidebarCollapsed");
  }

  function setMenuOpen(open) {
    if (!navBar || !appBody) return;

    if (isMobileView()) {
      navBar.classList.toggle("open", open);
      backdrop?.classList.toggle("visible", open);
      document.body.classList.toggle("navOpen", open);
    } else {
      appBody.classList.toggle("sidebarCollapsed", !open);
      localStorage.setItem(storageKey, open ? "1" : "0");
    }

    menuBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn?.setAttribute("aria-label", open ? "Ocultar menú" : "Mostrar menú");
  }

  function toggleMenu() {
    setMenuOpen(!isMenuOpen());
  }

  function applyDesktopPreference() {
    if (isMobileView()) {
      appBody.classList.remove("sidebarCollapsed");
      setMenuOpen(false);
      return;
    }
    const saved = localStorage.getItem(storageKey);
    setMenuOpen(saved !== "0");
  }

  menuBtn?.addEventListener("click", toggleMenu);
  closeBtn?.addEventListener("click", () => setMenuOpen(false));
  backdrop?.addEventListener("click", () => setMenuOpen(false));

  navBar?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (isMobileView()) setMenuOpen(false);
    });
  });

  mobileQuery.addEventListener("change", applyDesktopPreference);
  applyDesktopPreference();

  document.querySelectorAll(".actionMenuBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = btn.closest(".actionMenu");
      const isOpen = menu?.classList.contains("open");
      document.querySelectorAll(".actionMenu.open").forEach((m) => {
        m.classList.remove("open");
        m.querySelector(".actionMenuBtn")?.setAttribute("aria-expanded", "false");
      });
      if (!isOpen && menu) {
        menu.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".actionMenu.open").forEach((m) => {
      m.classList.remove("open");
      m.querySelector(".actionMenuBtn")?.setAttribute("aria-expanded", "false");
    });
    document.getElementById("notificationsContainer")?.classList.remove("open");
    document.getElementById("notificationsBtn")?.setAttribute("aria-expanded", "false");
  });

  const notificationsBtn = document.getElementById("notificationsBtn");
  const notificationsContainer = document.getElementById("notificationsContainer");
  notificationsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = notificationsContainer?.classList.contains("open");
    document.querySelectorAll(".actionMenu.open").forEach((m) => m.classList.remove("open"));
    notificationsContainer?.classList.toggle("open", !isOpen);
    notificationsBtn.setAttribute("aria-expanded", !isOpen ? "true" : "false");
  });
});
