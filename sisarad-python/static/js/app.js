document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const navBar = document.getElementById("navBar");
  const backdrop = document.getElementById("navBackdrop");
  const closeBtn = document.getElementById("closeNavBtn");

  function setOpen(open) {
    if (!navBar) return;
    navBar.classList.toggle("open", open);
    backdrop?.classList.toggle("visible", open);
    menuBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("navOpen", open);
  }

  menuBtn?.addEventListener("click", () => setOpen(!navBar?.classList.contains("open")));
  closeBtn?.addEventListener("click", () => setOpen(false));
  backdrop?.addEventListener("click", () => setOpen(false));

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
