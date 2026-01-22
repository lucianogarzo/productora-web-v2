// js/sanity.js
// Sanity client for public reads (GROQ over HTTP)

const PROJECT_ID = "u233mkcr";
const DATASET = "production";
const API_VERSION = "2023-08-01";

const BASE_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

// Basic fetch helper
export async function sanityFetch(query, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("query", query);

  // Sanity expects params in $param style; we pass a JSON map via $params
  url.searchParams.set("$params", JSON.stringify(params));

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Sanity request failed (${res.status}): ${txt}`);
  }

  const json = await res.json();
  return json.result;
}

// --- Projects list ---
export async function fetchProjects() {
  const query = `
    *[_type == "project"] | order(order asc, year desc) {
      "slug": slug.current,
      title_es, title_en,
      client, year,
      vimeo_url,
      description_es, description_en,
      featured, order,
      "thumbnail": thumbnail.asset->url
    }
  `;
  return sanityFetch(query);
}

// --- Single project by slug ---
export async function fetchProjectBySlug(slug) {
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
  return sanityFetch(query, { slug });
}

// --- Site Settings (Brands, etc.) ---
export async function fetchSiteSettings() {
  const query = `
    *[_type == "siteSettings"][0]{
      brandsTitle_es,
      brandsTitle_en,
      "brands": brands[]{
        name,
        url,
        "logo": logo.asset->url
      }
    }
  `;
  return sanityFetch(query);
}
