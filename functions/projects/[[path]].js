export async function onRequest(context) {
  const url = new URL(context.request.url);

  // /projects => serve listing normally
  if (url.pathname === "/projects" || url.pathname === "/projects/") {
    return context.next();
  }

  // /projects/project.html should load as-is
  if (url.pathname === "/projects/project.html") {
    return context.next();
  }

  // Extract slug from /projects/<slug>
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts[1];

  // Rewrite to template URL (internal)
  const rewriteUrl = new URL(url.origin + "/projects/project.html");
  rewriteUrl.searchParams.set("slug", slug);

  return fetch(rewriteUrl.toString(), {
    headers: context.request.headers,
  });
}
