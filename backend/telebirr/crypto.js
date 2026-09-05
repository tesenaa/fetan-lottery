import crypto from 'crypto';
import { telebirrConfig } from './config.js';

/**
 * Telebirr's Fabric Gateway signs requests by:
 *   1. Taking all non-empty fields except `sign` itself
 *   2. Sorting keys alphabetically
 *   3. Joining as key1=value1&key2=value2...
 *   4. Signing that string with SHA256withRSA using YOUR private key
 * Their servers verify your requests the same way with your public key
 * (which you upload to the portal), and you verify THEIR callbacks the
 * same way using the public key THEY give you.
 */
export function buildSignString(params) {
  return Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
}

export function signWithPrivateKey(params) {
  if (!telebirrConfig.privateKey) throw new Error('Telebirr private key not loaded');
  const str = buildSignString(params);
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(str, 'utf8');
  signer.end();
  return signer.sign(telebirrConfig.privateKey, 'base64');
}

export function verifyWithTelebirrPublicKey(params, signature) {
  if (!telebirrConfig.telebirrPublicKey) throw new Error('Telebirr public key not loaded');
  const str = buildSignString(params);
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(str, 'utf8');
  verifier.end();
  return verifier.verify(telebirrConfig.telebirrPublicKey, signature, 'base64');
}

export function randomNonce(len = 24) {
  return crypto.randomBytes(len).toString('hex').slice(0, len);
}
