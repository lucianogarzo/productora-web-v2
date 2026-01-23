// Projects/projects.js
import { getLang } from "/js/site.js";
import { sanityFetch, fetchProjects } from "/js/sanity.js";

/* ---------------------------
   Helpers
--------------------------- */
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleFor(p, lang) {
  return lang === "es" ? (p?.title_es || "") : (p?.title_en || "");
}
function descFor(p, lang) {
  return lang === "es" ? (p?.description_es || "") : (p?.description_en || "");
}

/* ---------------------------
   Copy
--------------------------- */
const COPY = {
  es: {
    listTitle: "Proyectos",
    detailKicker: "Proyecto",
    back: "Volver",
    loading: "Cargando…",
    errorProjects: "Error cargando proyectos.",
    noProjects: "Todavía no hay proyectos.",
    projectNotFound: "Proyecto no encontrado",
    errorProject: "Error cargando proyecto",
    videoNA: "Video no disponible",
  },
  en: {
    listTitle: "Nuestro trabajo",
    detailKicker: "Project",
    back: "Back",
    loading: "Loading…",
    errorProjects: "Error loading projects.",
    noProjects: "No projects yet.",
    projectNotFound: "Project not found",
    errorProject: "Error loading project",
    videoNA: "Video not available",
  },
};

/* ---------------------------
   Video embed helpers (YouTube only here)
--------------------------- */
function parseYouTube(url) {
  if (!url) return null;
  const u = String(url).trim();

  // vertical detection:
  // - youtube shorts
  // - or URL includes "vertical" anywhere (manual hint)
  const isVertical = /youtube\.com\/shorts\//i.test(u) || /\bvertical\b/i.test(u);

  let id = null;

  const m1 = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
  if (m1) id = m1[1];

  const m2 = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
  if (m2) id = m2[1];

  const m3 = u.match(/\/embed\/([a-zA-Z0-9_-]{6,})/i);
  if (m3) id = m3[1];

  const m4 = u.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/i);
  if (m4) id = m4[1];

  if (!id) return null;

  return {
    id,
    isVertical,
    embed: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`,
  };
}

function renderYouTube(el, url, c) {
  const yt = parseYouTube(url);

  if (!yt) {
    el.innerHTML = `<div style="padding:16px;opacity:.7">${c.videoNA}</div>`;
    return;
  }

  const ratio = yt.isVertical ? "9/16" : "16/9";
  const extraWrapStyle = yt.isVertical
    ? "max-height:80vh;margin:0 auto;"
    : "";

  el.innerHTML = `
    <div style="
      width:100%;
      background:#000;
      border-radius:18px;
      overflow:hidden;
      aspect-ratio:${ratio};
      ${extraWrapStyle}
    ">
      <iframe
        src="${yt.embed}"
        title="YouTube video"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        style="width:100%;height:100%;border:0;display:block"
      ></iframe>
    </div>
  `;
}

/* ---------------------------
   Fetch project by slug (NO params)
--------------------------- */
async function fetchProjectBySlugNoParams(slug) {
  const safeSlug = String(slug).replaceAll("\\", "\\\\").replaceAll('"', '\\"');

  const query = `
    *[_type == "project" && slug.current == "${safeSlug}"][0]{
      "slug": slug.current,
      title_es, title_en,
      client, year,
      vimeo_url,
      description_es, description_en,
      featured, order,
      "thumbnail": thumbnail.asset->url,
      "gallery": gallery[].asset->url
    }
  `;
  return sanityFetch(query);
}

/* ---------------------------
   Router
--------------------------- */
const lang = getLang();
const c = COPY[lang] || COPY.es;

function getHashSlug() {
  const h = window.location.hash || "";
  const m = h.match(/^#\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function mountLayout() {
  let page = document.getElementById("page");
  if (!page) {
    page = document.createElement("div");
    page.id = "page";
    page.className = "container";
    page.style.paddingTop = "22px";
    document.body.appendChild(page);
  }
  return page;
}

/* ---------------------------
   Grid
--------------------------- */
async function renderGrid(container) {
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;gap:18px">
      <h1 class="h2" style="margin:0">${c.listTitle}</h1>
    </div>
    <div style="height:14px"></div>
    <div class="grid" id="projectsGrid"><div style="padding:14px;opacity:.7">${c.loading}</div></div>
  `;

  const grid = document.getElementById("projectsGrid");

  try {
    const projects = await fetchProjects();

    if (!projects.length) {
      grid.innerHTML = `<div style="padding:14px;opacity:.7">${c.noProjects}</div>`;
      return;
    }

    grid.innerHTML = projects
      .map((p) => {
        const t = escapeHtml(titleFor(p, lang));
        const meta = escapeHtml([p.client, p.year].filter(Boolean).join(" • "));
        const img = p.thumbnail || "";
        const href = `/projects/#/${encodeURIComponent(p.slug)}`;

        return `
          <a class="card" href="${href}">
            <img src="${img}" alt="${t}" loading="lazy"/>
            <div class="meta">
              <h3>${t}</h3>
              <p>${meta}</p>
            </div>
          </a>
        `;
      })
      .join("");
  } catch (e) {
    console.error("Grid error:", e);
    grid.innerHTML = `<div style="padding:14px;opacity:.7">${c.errorProjects}</div>`;
  }
}

/* ---------------------------
   Detail
--------------------------- */
async function renderDetail(container, slug) {
  container.innerHTML = `
    <a href="/projects/" style="display:inline-block;margin:10px 0 14px;opacity:.85;text-decoration:none">
      ← ${c.back}
    </a>

    <div style="margin:0 0 10px; font-size:12px; letter-spacing:.22em; text-transform:uppercase; opacity:.55">
      ${c.detailKicker}
    </div>

    <div id="videoWrap"></div>

    <div style="height:16px"></div>

    <div style="display:flex;flex-direction:column;gap:10px">
      <h1 id="title" class="h1" style="margin:0"></h1>
      <div id="meta" style="opacity:.7"></div>
      <p id="desc" style="max-width:80ch;opacity:.85;margin:0"></p>
    </div>

    <div style="height:22px"></div>
    <div id="gallery" class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));"></div>
  `;

  try {
    const project = await fetchProjectBySlugNoParams(slug);

    if (!project) {
      container.innerHTML = `<div style="padding:18px;opacity:.7">${c.projectNotFound}</div>`;
      return;
    }

    document.getElementById("title").textContent = titleFor(project, lang);
    document.getElementById("meta").textContent = [project.client, project.year]
      .filter(Boolean)
      .join(" • ");
    document.getElementById("desc").textContent = descFor(project, lang);

    renderYouTube(document.getElementById("videoWrap"), project?.vimeo_url || "", c);

    const gal = document.getElementById("gallery");
    const imgs = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
    gal.innerHTML = imgs
      .map(
        (u) => `
        <img src="${u}" loading="lazy" alt=""
          style="width:100%;height:100%;aspect-ratio:16/10;object-fit:cover;border-radius:18px;border:1px solid rgba(0,0,0,.12)"/>
      `
      )
      .join("");
  } catch (e) {
    console.error("Detail error:", e);
    container.innerHTML = `<div style="padding:18px;opacity:.7">${c.errorProject}</div>`;
  }
}

/* ---------------------------
   Route
--------------------------- */
async function route() {
  const page = mountLayout();
  const slug = getHashSlug();
  if (slug) return renderDetail(page, slug);
  return renderGrid(page);
}

window.addEventListener("hashchange", route);
route();
