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
  return lang === "es" ? (p?.title_es || "") : (p?.title_en || "");
}
function descFor(p, lang) {
  return lang === "es" ? (p?.description_es || "") : (p?.description_en || "");
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

  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}

function renderYouTube(el, url) {
  const embed = toYouTubeEmbed(url);
  if (!embed) {
    el.innerHTML = `<div style="padding:16px;opacity:.7">Video no disponible</div>`;
    return;
  }

  el.innerHTML = `
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
  const res = await sanityFetch(query);
  return Array.isArray(res) ? res : [];
}

async function fetchProjectBySlug(slug) {
  // ✅ Clave: usamos @slug y lo interpolamos ya escapado, sin $params raros
  const safeSlug = String(slug).replaceAll('"', '\\"');

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
  return await sanityFetch(query);
}

/* ---------------------------
   Router
--------------------------- */
const lang = getLang();

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
      <h1 class="h2" style="margin:0">${lang === "es" ? "Proyectos" : "Projects"}</h1>
    </div>
    <div style="height:14px"></div>
    <div class="grid" id="projectsGrid"><div style="padding:14px;opacity:.7">Loading…</div></div>
  `;

  const grid = document.getElementById("projectsGrid");

  try {
    const projects = await fetchAllProjects();

    if (!projects.length) {
      grid.innerHTML = `<div style="padding:14px;opacity:.7">No projects yet.</div>`;
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
    grid.innerHTML = `<div style="padding:14px;opacity:.7">Error loading projects.</div>`;
  }
}

/* ---------------------------
   Detail
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

    document.getElementById("title").textContent = titleFor(project, lang);
    document.getElementById("meta").textContent = [project.client, project.year].filter(Boolean).join(" • ");
    document.getElementById("desc").textContent = descFor(project, lang);

    // ✅ VIDEO: YouTube desde vimeo_url (campo legacy)
    const videoWrap = document.getElementById("videoWrap");
    renderYouTube(videoWrap, project?.vimeo_url || "");

    // ✅ GALLERY
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
    container.innerHTML = `<div style="padding:18px;opacity:.7">Error loading project</div>`;
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
