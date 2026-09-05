import { telebirrConfig } from './config.js';

/**
 * Automated withdrawal/disbursement is NOT part of Telebirr's self-service
 * Fabric API — it requires a separate "Bulk Payment" business agreement with
 * a trust-fund account, arranged directly with Ethio Telecom (not something
 * you activate with API keys alone). Until that's in place — or until you
 * have the real endpoint spec from them — this adapter deliberately does
 * NOT attempt a real transfer, and your existing manual admin-approval flow
 * (Telegram buttons) stays as the source of truth.
 *
 * Once you have the real Bulk Payment API details, implement the body of
 * disburseToPhone() to call it, and flip TELEBIRR_AUTO_DISBURSEMENT_ENABLED=true.
 * Everything upstream of this file — the withdraw-request route, the DB
 * ledger, idempotency — is designed to stay the same either way.
 */
export async function disburseToPhone({ phone, amount, reference }) {
  if (!telebirrConfig.autoDisbursementEnabled) {
    return { automated: false, reason: 'AUTO_DISBURSEMENT_DISABLED' };
  }

  if (!telebirrConfig.disbursementBaseUrl || !telebirrConfig.disbursementApiKey) {
    throw new Error('Auto disbursement is enabled but not configured (missing base URL / API key).');
  }

  // --- FILL THIS IN once Ethio Telecom provides the real Bulk Payment API spec ---
  //
  // const res = await fetch(`${telebirrConfig.disbursementBaseUrl}/<real-endpoint>`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${telebirrConfig.disbursementApiKey}`,
  //     'Idempotency-Key': reference, // always send an idempotency key for payouts
  //   },
  //   body: JSON.stringify({ phone, amount, reference }),
  // });
  // const data = await res.json();
  // if (!res.ok) throw new Error(`Disbursement failed: ${JSON.stringify(data)}`);
  // return { automated: true, providerRef: data.transactionId, raw: data };

  throw new Error('disburseToPhone() is a scaffold — implement it with the real Bulk Payment API before enabling.');
}
