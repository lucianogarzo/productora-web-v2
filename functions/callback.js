export async function onRequest(context) {
  const url = new URL(context.request.url);
  // Send back to CMS; Decap will complete auth in-browser (PKCE)
  return Response.redirect(`${url.origin}/admin/`, 302);
}
