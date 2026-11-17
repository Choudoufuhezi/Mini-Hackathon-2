# prjC4 Password Hackathon

This submission intentionally has two independently deployable folders: `frontend` and `backend`. No packages need installing; it uses Node's built-in `http` and `crypto` modules.

## Local run

In separate terminals run `node backend/server.js` and `node frontend/local-server.js`, then open `http://localhost:3000`. Log in as `admin` / `BCIT12`.

## Publish checklist

Deploy `frontend` and `backend` to **different HTTPS origins** whose URL or hostname includes `prjC4`. Before publishing, set the backend environment variables:

```
NODE_ENV=production
FRONTEND_ORIGIN=https://your-prjC4-frontend-host
JWT_SECRET=a-long-random-secret-value
ADMIN_PASSWORD=BCIT12
APP_SECRET=defaultSecret
TEAM=prjC4
```

Set `frontend/config.js` `API_ORIGIN` to the deployed API HTTPS origin. During phase 2, set `ADMIN_PASSWORD` (six characters or fewer) and `APP_SECRET` (fewer than 20 characters, no spaces), then perform the allowed restart.

The API only accepts credentialed CORS requests from `FRONTEND_ORIGIN`. It issues a manually signed HS256 JWT with a two-hour expiry in an HttpOnly cookie. Logout clears the browser's cookie and does not revoke issued JWTs.
