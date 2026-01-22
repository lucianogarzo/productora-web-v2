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

export function mountNav(){
  const lang = getLang();
  const c = COPY[lang] || COPY.es;

  const nav = document.createElement("header");
  nav.className = "nav";

  nav.innerHTML = `
    <div class="nav-inner container">
      <a class="brand" href="/">${c.home}</a>
      <nav class="nav-links">
        <a href="/projects/">${c.projects}</a>
        <a href="/about.html">${c.about}</a>
        <a href="/contact.html">${c.contact}</a>
        <button class="lang" id="langBtn">${c.lang}</button>
      </nav>
    </div>
  `;

  document.body.prepend(nav);

  const isHome = document.body.classList.contains("home");

  const onScroll = () => {
    if (!isHome) {
      nav.classList.add("is-solid");
    } else {
      nav.classList.toggle("is-solid", window.scrollY > 30);
    }
  };

  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  const btn = document.getElementById("langBtn");
  if (btn){
    btn.addEventListener("click", () => {
      setLang(lang === "es" ? "en" : "es");
      location.reload();
    });
  }
}
