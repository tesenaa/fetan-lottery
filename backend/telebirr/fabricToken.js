import { telebirrConfig } from './config.js';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Gets a Fabric access token, cached until just before it expires.
 * NOTE: verify the exact request/response field names against the
 * "ApplyFabricToken" sample project in your own developer portal
 * dashboard — Ethio Telecom sometimes tweaks these between portal
 * versions, and your dashboard gives you a working sample tied to
 * your actual merchant account (Dashboard → "Get Full Project" /
 * "Postman collection").
 */
export async function getFabricToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) return cachedToken;

  const res = await fetch(`${telebirrConfig.baseUrl}/payment/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': telebirrConfig.fabricAppId,
    },
    body: JSON.stringify({ appSecret: telebirrConfig.appSecret }),
  });

  const data = await res.json();

  if (!res.ok || !data?.token) {
    throw new Error(`Failed to obtain Fabric token: ${JSON.stringify(data)}`);
  }

  cachedToken = data.token;
  // Refresh 5 minutes early rather than waiting for the exact expiry.
  tokenExpiresAt = now + 55 * 60 * 1000;
  return cachedToken;
}

export function clearCachedToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
}
