export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Allow listing
  if (url.pathname === "/projects" || url.pathname === "/projects/") {
    return context.next();
  }

  // Allow template direct
  if (
    url.pathname === "/projects/project.html" ||
    url.pathname === "/projects/project" ||
    url.pathname === "/projects/project/"
  ) {
    return context.next();
  }

  // Extract slug from /projects/<slug>
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts[1]; // ["projects", "<slug>"]

  // Serve template but attach slug so JS can read it safely
  const rewriteUrl = new URL(context.request.url);
  rewriteUrl.pathname = "/projects/project.html";
  rewriteUrl.searchParams.set("slug", slug);

  const req = new Request(rewriteUrl.toString(), context.request);
  return context.env.ASSETS.fetch(req);
}
