export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Dejar pasar el listado
  if (url.pathname === "/projects" || url.pathname === "/projects/") {
    return context.next();
  }

  // Reescribir a la plantilla (SIN fetch)
  url.pathname = "/projects/project.html";

  const newRequest = new Request(url.toString(), context.request);
  return context.env.ASSETS.fetch(newRequest);
}
