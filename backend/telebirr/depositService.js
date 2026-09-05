import { telebirrConfig, assertDepositConfigured } from './config.js';
import { getFabricToken } from './fabricToken.js';
import { signWithPrivateKey, randomNonce } from './crypto.js';

/**
 * Creates a Telebirr C2B pre-order and returns the URL to redirect the
 * user to (the H5 checkout page). `outTradeNo` MUST be unique per attempt
 * — use your own Deposit document's _id or a generated order code, and
 * store it so you can match the notify callback back to this request.
 *
 * NOTE ON EXACT FIELD NAMES: the biz-content field names below match the
 * commonly published Fabric Gateway "preOrder" contract, but Ethio Telecom
 * has been known to adjust minor field names between portal versions.
 * Cross-check this against the sample project / Postman collection in
 * YOUR developer portal dashboard before going live, and adjust if needed.
 */
export async function createDepositOrder({ outTradeNo, amount, subject }) {
  assertDepositConfigured();
  const token = await getFabricToken();

  const bizContent = {
    notifyUrl: telebirrConfig.notifyUrl,
    redirectUrl: telebirrConfig.returnUrl,
    appid: telebirrConfig.merchantAppId,
    merch_code: telebirrConfig.merchantCode,
    merch_order_id: outTradeNo,
    trade_type: 'Checkout',
    title: subject || 'Fetan Lottery Deposit',
    total_amount: String(amount),
    trans_currency: 'ETB',
    timeout_express: '120m',
    business_type: 'BuyGoods',
    payee_identifier: telebirrConfig.merchantCode,
    payee_identifier_type: '04',
    payee_type: '5000',
  };

  const sign = signWithPrivateKey(bizContent);

  const res = await fetch(`${telebirrConfig.baseUrl}/payment/v1/merchant/preOrder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-APP-Key': telebirrConfig.fabricAppId,
      Authorization: token,
    },
    body: JSON.stringify({ ...bizContent, sign, sign_type: 'SHA256WithRSA' }),
  });

  const data = await res.json();
  const prepayId = data?.biz_content?.prepay_id;

  if (!res.ok || !prepayId) {
    throw new Error(`createOrder failed: ${JSON.stringify(data)}`);
  }

  const checkoutParams = {
    appid: telebirrConfig.merchantAppId,
    merch_code: telebirrConfig.merchantCode,
    nonce_str: randomNonce(),
    prepay_id: prepayId,
    timestamp: String(Date.now()),
    sign_type: 'SHA256WithRSA',
  };
  checkoutParams.sign = signWithPrivateKey(checkoutParams);

  const query = Object.entries(checkoutParams)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const checkoutUrl = `https://developerportal.ethiotelebirr.et:38443/payment/web/paygate?${query}`;

  return { prepayId, checkoutUrl };
}
