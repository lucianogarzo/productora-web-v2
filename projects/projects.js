// Projects/projects.js
import { getLang } from "/js/site.js";
import { sanityFetch } from "/js/sanity.js";

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
  return lang === "es" ? (p.title_es || "") : (p.title_en || "");
}
function descFor(p, lang) {
  return lang === "es" ? (p.description_es || "") : (p.description_en || "");
}

/* ---------------------------
   YouTube embed
--------------------------- */
function toYouTubeEmbed(url) {
  if (!url) return null;
  const u = String(url).trim();

  let id = null;

  // youtu.be/ID
  const m1 = u.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if (m1) id = m1[1];

  // watch?v=ID
  const m2 = u.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if (m2) id = m2[1];

  // /embed/ID
  const m3 = u.match(/\/embed\/([a-zA-Z0-9_-]{6,})/);
  if (m3) id = m3[1];

  // /shorts/ID
  const m4 = u.match(/\/shorts\/([a-zA-Z0-9_-]{6,})/);
  if (m4) id = m4[1];

  if (!id) return null;

  // Autoplay: mejor NO forzarlo en página de proyecto (evita bloqueos de navegador)
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

function renderYouTube(videoEl, url) {
  const embed = toYouTubeEmbed(url);
  if (!embed) {
    videoEl.innerHTML = `<div class="muted" style="padding:16px">Video no disponible</div>`;
    return;
  }

  videoEl.innerHTML = `
    <div style="position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:18px;overflow:hidden">
      <iframe
        src="${embed}"
        title="YouTube video"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        style="position:absolute;inset:0;width:100%;height:100%;border:0"
      ></iframe>
    </div>
  `;
}

/* ---------------------------
   Sanity queries
--------------------------- */
async function fetchAllProjects() {
  const query = `
    *[_type == "project"] | order(order asc, _createdAt desc){
      "slug": slug.current,
      title_es, title_en,
      client, year,
      featured, order,
      vimeo_url,
      "thumbnail": thumbnail.asset->url
    }
  `;
  const data = await sanityFetch(query, {});
  return Array.isArray(data) ? data : [];
}

async function fetchProjectBySlug(slug) {
  const query = `
    *[_type == "project" && slug.current == $slug][0]{
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
  return await sanityFetch(query, { slug });
}

/* ---------------------------
   Page modes
   - /projects/  -> grid
   - /projects/#/slug -> detail
--------------------------- */
const lang = getLang();
const root = document.getElementById("root") || document.body;

function getHashSlug() {
  // expects "#/slug"
  const h = window.location.hash || "";
  const m = h.match(/^#\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function mountLayout() {
  // Projects index.html ya debe tener nav externo,
  // pero si no tiene un wrapper, lo creamos igual.
  if (!document.getElementById("page")) {
    const wrap = document.createElement("div");
    wrap.id = "page";
    wrap.className = "container";
    wrap.style.paddingTop = "22px";
    root.appendChild(wrap);
  }
  return document.getElementById("page");
}

/* ---------------------------
   Render: Grid
--------------------------- */
async function renderGrid(container) {
  container.innerHTML = `
    <div class="sec-head" style="display:flex;justify-content:space-between;align-items:baseline;gap:18px">
      <h1 class="h2" style="margin:0">${lang === "es" ? "Proyectos" : "Projects"}</h1>
    </div>
    <div style="height:14px"></div>
    <div class="grid" id="projectsGrid"><div class="muted" style="padding:14px;opacity:.7">Loading…</div></div>
  `;

  const grid = document.getElementById("projectsGrid");
  try {
    const projects = await fetchAllProjects();

    if (!projects.length) {
      grid.innerHTML = `<div class="muted" style="padding:14px;opacity:.7">No projects yet.</div>`;
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
    grid.innerHTML = `<div class="muted" style="padding:14px;opacity:.7">Error loading projects.</div>`;
  }
}

/* ---------------------------
   Render: Detail
--------------------------- */
async function renderDetail(container, slug) {
  container.innerHTML = `
    <a href="/projects/" style="display:inline-block;margin:10px 0 14px;opacity:.8;text-decoration:none">
      ← ${lang === "es" ? "Volver" : "Back"}
    </a>

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
    const project = await fetchProjectBySlug(slug);

    if (!project) {
      container.innerHTML = `<div style="padding:18px;opacity:.7">Project not found</div>`;
      return;
    }

    const title = titleFor(project, lang);
    const desc = descFor(project, lang);
    const meta = [project.client, project.year].filter(Boolean).join(" • ");

    document.getElementById("title").textContent = title || "";
    document.getElementById("meta").textContent = meta || "";
    document.getElementById("desc").textContent = desc || "";

    // VIDEO
    const videoWrap = document.getElementById("videoWrap");
    const url = project?.vimeo_url || "";
    renderYouTube(videoWrap, url);

    // GALLERY
    const gal = document.getElementById("gallery");
    const imgs = Array.isArray(project.gallery) ? project.gallery.filter(Boolean) : [];
    if (imgs.length) {
      gal.innerHTML = imgs
        .map((u) => `<img src="${u}" loading="lazy" alt="" style="width:100%;height:100%;aspect-ratio:16/10;object-fit:cover;border-radius:18px;border:1px solid rgba(0,0,0,.12)"/>`)
        .join("");
    } else {
      gal.innerHTML = "";
    }
  } catch (e) {
    console.error("Detail error:", e);
    container.innerHTML = `<div style="padding:18px;opacity:.7">Error loading project</div>`;
  }
}

/* ---------------------------
   Router
--------------------------- */
async function route() {
  const page = mountLayout();
  const slug = getHashSlug();
  if (slug) return renderDetail(page, slug);
  return renderGrid(page);
}

window.addEventListener("hashchange", route);
route();
