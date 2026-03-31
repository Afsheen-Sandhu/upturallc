import jwt from "jsonwebtoken";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days (employees often stay logged in on one device)

export function getCrmAuthSecret() {
  const secret = process.env.CRM_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing CRM_AUTH_SECRET environment variable");
  }
  return secret;
}

export function signCrmToken({ userId, email, role }) {
  const secret = getCrmAuthSecret();
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: userId,
      email,
      role,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      aud: "uptura-crm",
      iss: "uptura",
    },
    secret
  );
}

export function requireCrmAuth(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (!header || typeof header !== "string") {
    return { ok: false, status: 401, message: "Missing Authorization header" };
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return { ok: false, status: 401, message: "Invalid Authorization header" };
  }

  try {
    const secret = getCrmAuthSecret();
    const payload = jwt.verify(token, secret, { audience: "uptura-crm", issuer: "uptura" });
    const userId = payload?.sub;
    const role = payload?.role;
    const email = payload?.email;
    if (!userId || !role || !email) {
      return { ok: false, status: 401, message: "Invalid token payload" };
    }
    return { ok: true, userId, role, email };
  } catch (e) {
    if (e?.name === "TokenExpiredError") {
      return { ok: false, status: 401, message: "Session expired — please sign in again" };
    }
    return { ok: false, status: 401, message: "Invalid or expired token" };
  }
}

export function requireRole(auth, allowedRoles) {
  if (!auth?.ok) return auth;
  if (!allowedRoles.includes(auth.role)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return auth;
}

