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
  const c = COPY[lang];

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
  // nav: transparent -> solid on scroll
  const onScroll = () => {
    const solid = window.scrollY > 30;
    nav.classList.toggle("is-solid", solid);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.body.prepend(nav);

  const btn = document.getElementById("langBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = lang === "es" ? "en" : "es";
      setLang(next);
      location.reload();
    });
  }
}
