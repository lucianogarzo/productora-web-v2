export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Allow the listing
  if (url.pathname === "/projects" || url.pathname === "/projects/") {
    return context.next();
  }

  // IMPORTANT: allow the template itself
  if (
    url.pathname === "/projects/project.html" ||
    url.pathname === "/projects/project" ||
    url.pathname === "/projects/project/"
  ) {
    return context.next();
  }

  // Rewrite any /projects/<slug> to the template HTML (no redirect)
  const rewriteUrl = new URL(context.request.url);
  rewriteUrl.pathname = "/projects/project.html";

  // Serve static asset via ASSETS binding
  const req = new Request(rewriteUrl.toString(), context.request);
  return context.env.ASSETS.fetch(req);
}
