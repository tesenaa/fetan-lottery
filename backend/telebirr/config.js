import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

function readKeyFile(path, label) {
  if (!path) {
    console.warn(`⚠️ ${label} path not set in .env — Telebirr deposit will not work until it is.`);
    return null;
  }
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.warn(`⚠️ Could not read ${label} at "${path}": ${err.message}`);
    return null;
  }
}

export const telebirrConfig = {
  baseUrl: process.env.FABRIC_BASE_URL || 'https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway',
  fabricAppId: process.env.FABRIC_APP_ID,
  appSecret: process.env.FABRIC_APP_SECRET,
  merchantAppId: process.env.MERCHANT_APP_ID,
  merchantCode: process.env.MERCHANT_CODE,
  privateKey: readKeyFile(process.env.TELEBIRR_PRIVATE_KEY_PATH, 'TELEBIRR_PRIVATE_KEY_PATH'),
  // Telebirr's OWN public key — used only to verify the signature on their
  // notify/webhook callbacks. Get this from the developer portal, NOT your own keypair.
  telebirrPublicKey: readKeyFile(process.env.TELEBIRR_PUBLIC_KEY_PATH, 'TELEBIRR_PUBLIC_KEY_PATH'),
  notifyUrl: process.env.TELEBIRR_NOTIFY_URL,
  returnUrl: process.env.TELEBIRR_RETURN_URL,

  // Disbursement / withdrawal — see withdrawService.js. Disabled by default;
  // only real once you have a Bulk Payment agreement with Ethio Telecom.
  autoDisbursementEnabled: String(process.env.TELEBIRR_AUTO_DISBURSEMENT_ENABLED).toLowerCase() === 'true',
  disbursementBaseUrl: process.env.TELEBIRR_DISBURSEMENT_BASE_URL,
  disbursementApiKey: process.env.TELEBIRR_DISBURSEMENT_API_KEY,
};

export function assertDepositConfigured() {
  const missing = ['fabricAppId', 'appSecret', 'merchantAppId', 'merchantCode', 'privateKey', 'telebirrPublicKey']
    .filter((key) => !telebirrConfig[key]);
  if (missing.length) {
    throw new Error(`Telebirr deposit is not fully configured. Missing: ${missing.join(', ')}`);
  }
}
