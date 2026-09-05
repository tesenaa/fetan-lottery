import { verifyWithTelebirrPublicKey } from './crypto.js';

/**
 * ⚠️ IMPORTANT — READ BEFORE GOING LIVE ⚠️
 *
 * Telebirr's notify/callback payload format (plain signed fields vs. an
 * AES-encrypted envelope) is something you must confirm from the
 * "Notify/Callback" page of YOUR developer portal (Dashboard → Documentation),
 * since it's tied to your specific app configuration. I'm deliberately NOT
 * guessing an encryption/decryption scheme here — a wrong guess in code that
 * decides whether to credit real money is worse than no code at all.
 *
 * What IS safe and correct regardless of that detail:
 *   1. Verify the signature on whatever payload arrives, using
 *      verifyWithTelebirrPublicKey() below, before trusting ANY field in it.
 *   2. Never credit a wallet based on the webhook alone — independently
 *      confirm the order status server-to-server (a "queryOrder" call) before
 *      crediting. This protects you even if a webhook were ever spoofed.
 *   3. Make the handler idempotent — Telebirr may retry the same notify
 *      multiple times; crediting twice for one payment must be impossible.
 *   4. Always respond quickly with whatever "success" acknowledgement format
 *      Telebirr expects, or they will keep retrying.
 *
 * Fill in `payload` extraction below once you've confirmed the exact shape
 * from your portal docs.
 */
export async function verifyNotifyPayload(rawBody) {
  // Example shape for a plain signed-fields notify (adjust to match your portal docs):
  //   { merch_order_id, trade_no, total_amount, trade_status, sign, ...otherFields }
  const { sign, ...fields } = rawBody;
  if (!sign) throw new Error('Notify payload missing signature');

  const isValid = verifyWithTelebirrPublicKey(fields, sign);
  if (!isValid) throw new Error('Notify payload signature verification FAILED — do not trust this payload');

  return fields;
}
