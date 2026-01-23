# Calabria — Web + CMS Context

Este archivo resume el estado del proyecto para retomar cambios rápido sin tener que revisar todo el historial.

---

## 1) Proyecto / Deploy

- Sitio web: **https://www.bycalabria.com**
- Hosting: **Cloudflare Pages**
- Repo GitHub: **(completar URL del repo)**
- Rama principal: **main**
- Deploy automático: **sí (Cloudflare Pages conectado al repo)**

---

## 2) CMS / Contenido

### Sanity
- Studio online: **https://productora-calabria.sanity.studio/**
- Project ID: `u233mkcr`
- Dataset: `production`
- API version usada: `v2023-08-01`
- CORS: permitido para `https://www.bycalabria.com` y `https://productora-web-v2.pages.dev` (ver Sanity Manage)

### Schema: Project
Tipo: `_type == "project"`
Campos clave:
- `title_es` (string)
- `title_en` (string)
- `slug` (slug.current)
- `client` (string)
- `year` (string o number según schema)
- `vimeo_url` (string) → **se usa para URL de Youtube**
- `description_es` (text)
- `description_en` (text)
- `thumbnail` (image asset)
- `featured` (boolean)
- `order` (number)
- `gallery` (array de image assets) (si aplica)

---

## 3) Estructura del repo

Estructura esperada (alto nivel):

/index.html
/about.html
/contact.html
/css/style.css
/js/
  nav.js
  sanity.js
  site.js
/projects/
  index.html
  project.html
  projects.js
/assets/
  favicon.png
  og.jpg
  brands/
    (logos PNG)

Notas:
- Home = `index.html`
- Listado de proyectos = `/projects/`
- Detalle de proyecto = `/projects/#/<slug>` (hash routing)
- El “reel” está en **/assets/reel.mp4** (si aplica)

---

## 4) JS / Data

### `/js/sanity.js`
Responsable de:
- construir `sanityFetch(query, params)`
- funciones:
  - `fetchProjects()`
  - `fetchProjectBySlug(slug)`

Query típica detalle por slug:
```js
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
