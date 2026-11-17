"use strict";

const { API_ORIGIN } = window.APP_CONFIG;
const error = document.querySelector("#error");

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  const form = new FormData(event.currentTarget);
  try {
    const response = await fetch(`${API_ORIGIN}/api/login`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
    });
    if (!response.ok) throw new Error("Invalid username or password.");
    window.location.assign("admin.html");
  } catch (cause) { error.textContent = cause.message === "Invalid username or password." ? cause.message : "Could not reach the authentication server."; }
});
