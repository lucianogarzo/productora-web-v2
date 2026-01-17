import { getLang } from "/js/site.js";
import { fetchProjects, fetchProjectBySlug } from "/js/sanity.js";

const lang = getLang();

const COPY = {
  es: {
    title: "Projects",
    subtitle: "Selección de trabajos. Dirección, producción y post.",
    back: "← Projects",
    notFoundTitle: "Project not found",
    notFoundDesc: (slug) => `No se encontró el proyecto con slug: ${slug}`,
    invalidVideo: "Video URL inválida.",
    filters: ["All", "Featured"],
  },
  en: {
    title: "Projects",
    subtitle: "Selected work. Direction, production and post.",
    back: "← Projects",
    notFoundTitle: "Project not found",
    notFoundDesc: (slug) => `No project found for slug: ${slug}`,
    invalidVideo: "Invalid video URL.",
    filters: ["All", "Featured"],
  },
};

const c = COPY[lang];

// dom
const listView = document.getElementById("listView");
const detailView = document.getElementById("detailView");

const grid = document.getElementById("grid");
const filters = document.getElementById("filters");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const backBtn = document.getElementById("backBtn");
const detailSlug = document.getElementById("detailSlug");
const detailTitle = document.getElementById("detailTitle");
const detailSub = document.getElementById("detailSub");
const detailVideo = document.getElementById("detailVideo");
const detailDesc = document.getElementById("detailDesc");
const gallery = document.getElementById("gallery");

pageTitle.textContent = c.title;
pageSubtitle.textContent = c.subtitle;
backBtn.textContent = c.back;

let projects = [];
let filterMode = "all";

function titleFor(p) {
  return lang === "es" ? p.title_es : p.title_en;
}
function descFor(p) {
  return lang === "es" ? p.description_es : p.description_en;
}

/* Video helpers */
function youtubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

function vimeoId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:vimeo\.com\/(?:video\/)?|\/)(\d{6,12})(?:$|[?/])/);
  return m ? m[1] : null;
}

function videoEmbedHTML(url) {
  const yt = youtubeId(url);
  if (yt) {
    return `<iframe
      src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=0&mute=0&controls=1&modestbranding=1&rel=0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    ></iframe>`;
  }

  const vm = vimeoId(url);
  if (vm) {
    return `<iframe
      src="https://player.vimeo.com/video/${vm}?autoplay=0&muted=0&title=0&byline=0&portrait=0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
    ></iframe>`;
  }
  return null;
}

function renderFilters() {
  filters.innerHTML = `
    <button class="pill ${filterMode === "all" ? "active" : ""}" data-mode="all">${c.filters[0]}</button>
    <button class="pill ${filterMode === "featured" ? "active" : ""}" data-mode="featured">${c.filters[1]}</button>
  `;

  filters.querySelectorAll(".pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterMode = btn.getAttribute("data-mode");
      renderList();
      renderFilters();
    });
  });
}

function renderList() {
  const list =
    filterMode === "featured" ? projects.filter((p) => p.featured) : projects;

  grid.innerHTML = list.map((p) => `
    <a class="card" href="/projects/#/${encodeURIComponent(p.slug)}">
      <img src="${p.thumbnail || ""}" alt="${titleFor(p)}" loading="lazy" />
      <div class="meta">
        <h3 class="display">${titleFor(p)}</h3>
        <p>${[p.client, p.year].filter(Boolean).join(" • ")}</p>
      </div>
    </a>
  `).join("");
}

async function renderDetail(slug) {
  detailSlug.textContent = slug ? `/${slug}` : "";
  detailTitle.textContent = "";
  detailSub.textContent = "";
  detailDesc.textContent = "";
  detailVideo.innerHTML = "";
  if (gallery) gallery.innerHTML = "";

  const project = await fetchProjectBySlug(slug);

  if (!project) {
    detailTitle.textContent = c.notFoundTitle;
    detailDesc.textContent = c.notFoundDesc(slug);
    return;
  }

  const t = titleFor(project);
  detailTitle.textContent = t;
  detailSub.textContent = [project.client, project.year].filter(Boolean).join(" • ");
  detailDesc.textContent = descFor(project) || "";

  const embed = videoEmbedHTML(project.vimeo_url);
  detailVideo.innerHTML = embed
    ? embed
    : `<div style="padding:24px;opacity:.7">${c.invalidVideo}</div>`;

  // gallery
  const imgs = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
  if (gallery) {
    gallery.innerHTML = imgs.length
      ? imgs.map(url => `<img src="${url}" loading="lazy" alt="">`).join("")
      : "";
  }
}

function showList() {
  detailView.classList.add("hidden");
  listView.classList.remove("hidden");
}

function showDetail() {
  listView.classList.add("hidden");
  detailView.classList.remove("hidden");
}

function route() {
  const hash = location.hash || "";
  const m = hash.match(/^#\/(.+)$/);

  if (!m) {
    showList();
    renderList();
    return;
  }

  const slug = decodeURIComponent(m[1]);
  showDetail();
  renderDetail(slug);
}

window.addEventListener("hashchange", route);

(async () => {
  renderFilters();
  projects = await fetchProjects();
  renderList();
  route();
})();
