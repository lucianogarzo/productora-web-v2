// js/sanity.js
// Stable Sanity fetch helpers (Projects + Gallery)

export const SANITY_PROJECT_ID = "u233mkcr";
export const SANITY_DATASET = "production";
export const SANITY_API_VERSION = "2023-08-01";

// IMPORTANT: CDN endpoint is best for public, cacheable reads
const BASE = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

// Small helper
async function sanityFetch(query, params = {}) {
  const url = new URL(BASE);
  url.searchParams.set("query", query);
  if (params && Object.keys(params).length) {
    url.searchParams.set("$params", JSON.stringify(params)); // fallback (not used)
  }

  // Sanity expects params as separate $key entries
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, typeof v === "string" ? v : JSON.stringify(v));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Accept": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sanity request failed (${res.status}): ${text.slice(0, 160)}`);
  }

  const data = await res.json();
  return data.result;
}

// -------- Public API --------

export async function fetchProjects() {
  const query = `
    *[_type == "project"] | order(order asc, year desc) {
      "slug": slug.current,
      title_es,
      title_en,
      client,
      year,
      vimeo_url,
      featured,
      order,
      "thumbnail": thumbnail.asset->url
    }
  `;
  return await sanityFetch(query);
}

export async function fetchProjectBySlug(slug) {
  if (!slug) return null;

  const query = `
    *[_type == "project" && slug.current == $slug][0]{
      "slug": slug.current,
      title_es,
      title_en,
      client,
      year,
      vimeo_url,
      description_es,
      description_en,
      featured,
      order,
      "thumbnail": thumbnail.asset->url,
      "gallery": gallery[].asset->url
    }
  `;

  return await sanityFetch(query, { slug });
}
