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

// --- dom
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

pageTitle.textContent = c.title;
pageSubtitle.textContent = c.subtitle;
backBtn.textContent = c.back;

// --- state
let projects = [];
let filterMode = "all"; // all | featured

function titleFor(p) {
  return lang === "es" ? p.title_es : p.title_en;
}

function descFor(p) {
  return lang === "es" ? p.description_es : p.description_en;
}

/* -----------------------------
   Video helpers (YouTube+Vimeo)
------------------------------ */
function vimeoId(url) {
  if (!url) return null;
  const m = String(url).match(/\b(\d{6,12})\b/);
  return m ? m[1] : null;
}

function youtubeId(url) {
  if (!url) return null;

  try {
    const u = new URL(url);

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }

    // youtube.com/watch?v=<id>
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v");
    }

    // youtube.com/embed/<id> or /shorts/<id>
    const parts = u.pathname.split("/");
    return parts.pop() || null;
  } catch (e) {
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

/* -----------------------------
   Render list
------------------------------ */
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

/* -----------------------------
   Render detail (Loader + fade)
------------------------------ */
function resetDetailAnimations() {
  detailTitle.classList.remove("fade-in");
  detailSub.classList.remove("fade-in");
  detailDesc.classList.remove("fade-in");
}

async function renderDetail(slug) {
  resetDetailAnimations();

  // reset detail content
  detailSlug.textContent = slug ? `/${slug}` : "";
  detailTitle.textContent = "";
  detailSub.textContent = "";
  detailDesc.textContent = "";

  // reset video area (restore loader)
  detailVideo.innerHTML = `<div class="video-loading" id="videoLoading">Loading…</div>`;

  const project = await fetchProjectBySlug(slug);

  if (!project) {
    detailTitle.textContent = c.notFoundTitle;
    detailVideo.innerHTML = "";
    detailDesc.textContent = c.notFoundDesc(slug);
    document.title = `${c.notFoundTitle} – ${c.title}`;

    detailTitle.classList.add("fade-in");
    detailDesc.classList.add("fade-in");
    return;
  }

  const t = titleFor(project);
  detailTitle.textContent = t;
  detailSub.textContent = [project.client, project.year].filter(Boolean).join(" • ");
  detailDesc.textContent = descFor(project) || "";
  document.title = `${t} – ${c.title}`;

  const embed = videoEmbedHTML(project.vimeo_url);

  if (embed) {
    detailVideo.insertAdjacentHTML("afterbegin", embed);
    const loader = document.getElementById("videoLoading");
    if (loader) loader.style.display = "none";
  } else {
    detailVideo.innerHTML = `<div style="padding:24px;opacity:.7">${c.invalidVideo}</div>`;
  }

  // fade-in text
  detailTitle.classList.add("fade-in");
  detailSub.classList.add("fade-in");
  detailDesc.classList.add("fade-in");
}

/* -----------------------------
   Views + router
------------------------------ */
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

/* -----------------------------
   Init
------------------------------ */
(async () => {
  renderFilters();
  projects = await fetchProjects();
  renderList();
  route();
})();
