"use strict";
const api = window.APP_CONFIG.API_ORIGIN;
const content = document.querySelector("#content");
async function requireSession() {
  try {
    const result = await fetch(`${api}/api/me`, { credentials: "include" });
    if (!result.ok) return window.location.replace("index.html");
    const user = await result.json();
    if (location.pathname.endsWith("admin.html")) content.textContent = `Welcome to Team ${user.team}, Secret: "${user.secret}", Time: ${new Date().toString()}`;
    else content.textContent = location.pathname.endsWith("page1.html") ? "Page 1" : "Page 2";
  } catch { window.location.replace("index.html"); }
}
document.querySelector("#logout").addEventListener("click", async () => { await fetch(`${api}/api/logout`, { method: "POST", credentials: "include" }); window.location.replace("index.html"); });
requireSession();
