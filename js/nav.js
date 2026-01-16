import { getLang, toggleLang } from "/js/site.js";


const COPY = {
  es: {
    brand: "Productora Web",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    lang: "ES",
    footer: "© " + new Date().getFullYear() + " Productora. All rights reserved.",
  },
  en: {
    brand: "Production Studio",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    lang: "EN",
    footer: "© " + new Date().getFullYear() + " Studio. All rights reserved.",
  }
};

export function mountNav() {
  const lang = getLang();
  const c = COPY[lang];

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <div class="nav">
      <div class="container nav-inner">
        <a class="brand" href="/">${c.brand}</a>
        <div class="menu">
          <a href="/projects/">${c.projects}</a>
          <a href="/about.html">${c.about}</a>
          <a href="/contact.html">${c.contact}</a>
          <button class="btn" id="langBtn">${c.lang}</button>
        </div>
      </div>
    </div>
    `
  );

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <footer class="footer">
      <div class="container">${c.footer}</div>
    </footer>
    `
  );

  document.getElementById("langBtn").addEventListener("click", () => {
    toggleLang();
    location.reload(); // simple y efectivo para sitio estático
  });
}
