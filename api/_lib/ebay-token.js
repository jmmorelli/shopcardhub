// eBay OAuth app-token helper (client-credentials grant).
//
// Swaps EBAY_CLIENT_ID + EBAY_CERT_ID for an application access token used by
// the Buy/Browse API. No user login involved — this is app-level auth only.
//
// Tokens last ~2 hours. We cache in module scope so a warm serverless instance
// reuses the token instead of re-authing on every request. A cold start just
// fetches a fresh one (~200ms, once).
//
// Required Vercel env vars:
//   EBAY_CLIENT_ID  -> App ID (Client ID) from developer.ebay.com/my/keys
//   EBAY_CERT_ID    -> Cert ID (Client Secret) — sensitive

const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SCOPE = "https://api.ebay.com/oauth/api_scope"; // public-data scope; covers Browse API

let cached = { token: null, expiresAt: 0 };

export async function getAppToken() {
  const now = Date.now();
  // Refresh 5 minutes before actual expiry to avoid using a dying token.
  if (cached.token && now < cached.expiresAt - 5 * 60 * 1000) {
    return cached.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!clientId || !certId) {
    throw new Error("Server is missing EBAY_CLIENT_ID / EBAY_CERT_ID env vars.");
  }

  const basic = Buffer.from(`${clientId}:${certId}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: SCOPE,
  });

  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`eBay token exchange failed (${r.status}): ${detail.slice(0, 300)}`);
  }

  const data = await r.json();
  cached = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 7200) * 1000,
  };
  return cached.token;
}
