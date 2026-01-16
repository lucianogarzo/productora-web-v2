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
    invalidVideo: "Video URL inválida (YouTube/Vimeo).",
    filters: ["All", "Featured"],
  },
  en: {
    title: "Projects",
    subtitle: "Selected work. Direction, production and post.",
    back: "← Projects",
    notFoundTitle: "Project not found",
    notFoundDesc: (slug) => `No project found for slug: ${slug}`,
    invalidVideo: "Invalid video URL (YouTube/Vimeo).",
    filters: ["All", "Featured"],
  },
};
const c = COPY[lang];

// DOM
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

// Lightbox DOM (must exist in projects/index.html)
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const lightboxCount = document.getElementById("lightboxCount");

// State
let projects = [];
let filterMode = "all";

// Lightbox state
let lbImages = [];
let lbIndex = 0;

pageTitle.textContent = c.title;
pageSubtitle.textContent = c.subtitle;
backBtn.textContent = c.back;

function titleFor(p) {
  return lang === "es" ? p.title_es : p.title_en;
}
function descFor(p) {
  return lang === "es" ? p.description_es : p.description_en;
}

// ---------- Video helpers ----------
function vimeoId(url) {
  if (!url) return null;
  const s = String(url);
  // tries to extract a long-ish numeric id
  const m = s.match(/(?:vimeo\.com\/(?:video\/)?|\/)(\d{6,12})(?:$|[?/])/);
  return m ? m[1] : null;
}

function youtubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(String(url));
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last || null;
  } catch {
    return null;
  }
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

// ---------- Lightbox ----------
function updateLightbox() {
  const total = lbImages.length;
  if (!total || !lightboxImg) return;

  if (lbIndex < 0) lbIndex = total - 1;
  if (lbIndex >= total) lbIndex = 0;

  lightboxImg.src = lbImages[lbIndex];
  if (lightboxCount) lightboxCount.textContent = `${lbIndex + 1} / ${total}`;
}

function openLightbox(images, index = 0) {
  if (!lightbox || !lightboxImg) return;
  lbImages = images || [];
  lbIndex = index || 0;

  lightbox.classList.remove("hidden");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updateLightbox();
}

function closeLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.classList.add("hidden");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

function prevLightbox() { lbIndex -= 1; updateLightbox(); }
function nextLightbox() { lbIndex += 1; updateLightbox(); }

if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
if (lightboxPrev) lightboxPrev.addEventListener("click", prevLightbox);
if (lightboxNext) lightboxNext.addEventListener("click", nextLightbox);

if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

window.addEventListener("keydown", (e) => {
  if (!lightbox || lightbox.classList.contains("hidden")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevLightbox();
  if (e.key === "ArrowRight") nextLightbox();
});

// ---------- UI ----------
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
  const list = filterMode === "featured"
    ? projects.filter((p) => p.featured)
    : projects;

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
  // reset
  detailSlug.textContent = slug ? `/${slug}` : "";
  detailTitle.textContent = "";
  detailSub.textContent = "";
  detailDesc.textContent = "";
  detailVideo.innerHTML = "";
  if (gallery) gallery.innerHTML = "";

  let project;
  try {
    project = await fetchProjectBySlug(slug);
  } catch (err) {
    console.error("fetchProjectBySlug failed", err);
    detailTitle.textContent = "Error loading project";
    detailDesc.textContent = String(err?.message || err);
    return;
  }

  if (!project) {
    detailTitle.textContent = c.notFoundTitle;
    detailDesc.textContent = c.notFoundDesc(slug);
    document.title = `${c.notFoundTitle} – ${c.title}`;
    return;
  }

  const t = titleFor(project);
  detailTitle.textContent = t;
  detailSub.textContent = [project.client, project.year].filter(Boolean).join(" • ");
  detailDesc.textContent = descFor(project) || "";
  document.title = `${t} – ${c.title}`;

  const embed = videoEmbedHTML(project.vimeo_url);
  detailVideo.innerHTML = embed
    ? embed
    : `<div style="padding:24px;opacity:.7">${c.invalidVideo}</div>`;

  // Gallery
  const imgs = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
  if (gallery && imgs.length) {
    gallery.innerHTML = imgs
      .map((url, idx) => `<img src="${url}" loading="lazy" alt="" data-idx="${idx}">`)
      .join("");

    gallery.querySelectorAll("img[data-idx]").forEach((img) => {
      img.addEventListener("click", () => {
        const idx = Number(img.getAttribute("data-idx") || 0);
        openLightbox(imgs, idx);
      });
    });
  } else if (gallery) {
    gallery.innerHTML = "";
  }
}

function showList() {
  detailView.classList.add("hidden");
  listView.classList.remove("hidden");
  document.title = c.title;
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

// Init
(async () => {
  try {
    renderFilters();
    projects = await fetchProjects();
    renderList();
    route();
  } catch (err) {
    console.error("Init failed", err);
    grid.innerHTML = `<div style="padding:20px;opacity:.7">Error loading projects.</div>`;
  }
})();
