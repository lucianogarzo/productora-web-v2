export const SANITY_PROJECT_ID = "u233mkcr";
export const SANITY_DATASET = "production";
export const SANITY_API_VERSION = "2023-08-01";

const BASE = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`;

async function sanityFetch(query, params = {}) {
  const url = new URL(BASE);
  url.searchParams.set("query", query);

  // Sanity params (strings must be JSON encoded -> quoted)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  }

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    throw new Error(`Sanity request failed (${res.status})`);
  }

  return data.result;
}

export async function fetchProjects() {
  const query = `
    *[_type == "project"] | order(order asc, year desc) {
      "slug": slug.current,
      title_es, title_en,
      client, year,
      vimeo_url,
      featured, order,
      "thumbnail": thumbnail.asset->url
    }
  `;
  return sanityFetch(query);
}

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
