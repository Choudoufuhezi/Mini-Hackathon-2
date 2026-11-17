"use strict";

const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "change-this-development-secret-before-deployment";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "BCIT12";
const TEAM = process.env.TEAM || "prjC4";
const SECRET = process.env.APP_SECRET || "defaultSecret";
const TTL_SECONDS = 2 * 60 * 60;
const production = process.env.NODE_ENV === "production";

function b64url(value) { return Buffer.from(value).toString("base64url"); }
function sign(data) { return crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url"); }
function issueJwt(subject) {
  const now = Math.floor(Date.now() / 1000);
  const body = `${b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64url(JSON.stringify({ sub: subject, iat: now, exp: now + TTL_SECONDS }))}`;
  return `${body}.${sign(body)}`;
}
function verifyJwt(token) {
  const parts = token ? token.split(".") : [];
  if (parts.length !== 3 || !/^[A-Za-z0-9_-]+$/.test(parts.join(""))) return null;
  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`)); const supplied = Buffer.from(parts[2]);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;
  try { const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); return payload.sub === "admin" && Number.isInteger(payload.exp) && payload.exp > Date.now() / 1000 ? payload : null; } catch { return null; }
}
function cookies(header = "") { return Object.fromEntries(header.split(";").map(x => x.trim().split(/=(.*)/s)).filter(x => x[0]).map(([k, v]) => [k, decodeURIComponent(v || "")])); }
function cookie(value, maxAge = TTL_SECONDS) { return `session=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=${production ? "None" : "Lax"}${production ? "; Secure" : ""}`; }
function cors(req, res) { if (req.headers.origin === FRONTEND_ORIGIN) { res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN); res.setHeader("Access-Control-Allow-Credentials", "true"); res.setHeader("Vary", "Origin"); } }
function send(res, status, body, headers = {}) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers }); res.end(JSON.stringify(body)); }
function authenticated(req) { return verifyJwt(cookies(req.headers.cookie).session); }
function body(req) { return new Promise((resolve, reject) => { let data = ""; req.on("data", c => { data += c; if (data.length > 4096) reject(new Error("too large")); }); req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { reject(new Error("bad json")); } }); req.on("error", reject); }); }

http.createServer(async (req, res) => {
  cors(req, res);
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600" }); return res.end(); }
  if (req.method === "POST" && req.url === "/api/login") {
    try { const input = await body(req); if (input.username !== "admin" || typeof input.password !== "string" || !crypto.timingSafeEqual(Buffer.from(input.password.padEnd(64)), Buffer.from(ADMIN_PASSWORD.padEnd(64)))) return send(res, 401, { error: "Invalid credentials" }); return send(res, 200, { ok: true }, { "Set-Cookie": cookie(issueJwt("admin")) }); } catch { return send(res, 400, { error: "Invalid request" }); }
  }
  if (req.method === "POST" && req.url === "/api/logout") return send(res, 200, { ok: true }, { "Set-Cookie": cookie("", 0) });
  if (req.method === "GET" && req.url === "/api/me") { if (!authenticated(req)) return send(res, 401, { error: "Authentication required" }); return send(res, 200, { team: TEAM, secret: SECRET }); }
  return send(res, 404, { error: "Not found" });
}).listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
