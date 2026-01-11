export async function onRequest(context) {
  const url = new URL(context.request.url);

  // allow /projects and /projects/ to work normally (grid page)
  if (url.pathname === "/projects" || url.pathname === "/projects/") {
    return context.next();
  }

  // rewrite any /projects/<anything> to /projects/project.html
  const templateUrl = new URL("/projects/project.html", url.origin);

  const res = await fetch(templateUrl.toString(), {
    headers: context.request.headers,
  });

  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}
