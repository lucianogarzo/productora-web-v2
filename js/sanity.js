// Sanity config
const SANITY_PROJECT_ID = "u233mkcr";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "v2023-08-01";

function sanityQueryUrl(groq) {
  const encoded = encodeURIComponent(groq);
  return `https://${SANITY_PROJECT_ID}.api.sanity.io/${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encoded}`;
}

export async function fetchProjects() {
  const groq = `*[_type == "project"] | order(order asc, year desc) {
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
    "thumbnail": thumbnail.asset->url
  }`;

  const res = await fetch(sanityQueryUrl(groq));
  if (!res.ok) throw new Error("Sanity fetch error");
  const data = await res.json();
  return data.result || [];
}

export async function fetchProjectBySlug(slug) {
  const groq = `*[_type == "project" && slug.current == "${slug}"][0]{
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
    "thumbnail": thumbnail.asset->url
    "gallery": gallery[].asset->url
  }`;

  const res = await fetch(sanityQueryUrl(groq));
  if (!res.ok) throw new Error("Sanity fetch error");
  const data = await res.json();
  return data.result || null;
}
