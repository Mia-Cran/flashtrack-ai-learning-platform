(() => {
  const form = document.querySelector(".contact-form");
  const note = document.querySelector("[data-form-note]");

  if (form && note) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      note.hidden = false;
      form.reset();
    });
  }

  const dropdown = document.querySelector(".nav-dropdown");
  const toggle = document.querySelector(".nav-dropdown-toggle");
  const menu = document.querySelector(".nav-dropdown-menu");

  if (dropdown && toggle && menu) {
    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    };

    const openMenu = () => {
      toggle.setAttribute("aria-expanded", "true");
      menu.hidden = false;
    };

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu();
      else openMenu();
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  const items = document.querySelectorAll(".creation-list li, .product");
  if (!items.length || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((item, index) => {
    item.style.transitionDelay = `${(index % 4) * 90}ms`;
    observer.observe(item);
  });
})();
