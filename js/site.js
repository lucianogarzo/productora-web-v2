export function getLang() {
  return localStorage.getItem("lang") || "es";
}
export function setLang(lang) {
  localStorage.setItem("lang", lang);
}
export function toggleLang() {
  const next = getLang() === "es" ? "en" : "es";
  setLang(next);
  return next;
}
