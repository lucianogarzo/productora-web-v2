export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If user is visiting /projects (directory listing page), let it serve /projects/index.html
  if (url.pathname === "/projects" || url.pathname === "/projects/") {
    return context.next();
  }

  // For ANY /projects/<anything> → serve the template file
  const templateUrl = new URL("/projects/project.html", url.origin);

  // Fetch the template from the same site
  const res = await fetch(templateUrl.toString(), {
    headers: context.request.headers,
  });

  // Return HTML with status 200 (rewrite)
  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      // keep caching mild
      "cache-control": "no-store",
    },
  });
}
