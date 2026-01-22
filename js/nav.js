// js/nav.js
import { getLang, setLang } from "/js/site.js";

const COPY = {
  es: {
    home: "Home",
    projects: "Proyectos",
    about: "Acerca",
    contact: "Contacto",
    lang: "EN",
  },
  en: {
    home: "Home",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    lang: "ES",
  },
};

export function mountNav() {
  const lang = getLang();
  const c = COPY[lang] || COPY.es;

  // Create nav element
  const nav = document.createElement("header");
  nav.className = "nav";

  nav.innerHTML = `
    <div class="nav-inner container">
      <a class="brand" href="/">${c.home}</a>

      <nav class="nav-links">
        <a href="/projects/">${c.projects}</a>
        <a href="/about.html">${c.about}</a>
        <a href="/contact.html">${c.contact}</a>
        <button class="lang" id="langBtn" aria-label="language">${c.lang}</button>
      </nav>
    </div>
  `;

  // Inject into DOM first so styles apply
  document.body.prepend(nav);

  // Transparent only on Home while at top
  const isHome = document.body.classList.contains("home") || location.pathname === "/";

  const onScroll = () => {
    if (!isHome) {
      // other pages: always solid
      nav.classList.add("is-solid");
      return;
    }
    // home: solid only after scroll
    nav.classList.toggle("is-solid", window.scrollY > 30);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // run once on load

  // Language toggle
  const btn = document.getElementById("langBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = lang === "es" ? "en" : "es";
      setLang(next);
      location.reload();
    });
  }
}
