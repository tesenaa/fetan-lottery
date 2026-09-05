import express from 'express';
import { createDepositOrder } from './depositService.js';
import { verifyNotifyPayload } from './notifyHandler.js';
import { disburseToPhone } from './withdrawService.js';

/**
 * Mount with: app.use('/api/telebirr', telebirrRoutes({ Deposit, Transaction, User, notifyUserBalanceUpdate }))
 * Pass in your existing Mongoose models / helpers from server.js so this
 * plugs into your current data layer instead of duplicating it.
 */
export function telebirrRoutes({ Deposit, User, notifyUserBalanceUpdate }) {
  const router = express.Router();

  // 1. User taps "Deposit" in the WebApp with an amount → we create a
  //    PENDING Deposit record + a real Telebirr checkout URL, and redirect them.
  router.post('/deposit/create', async (req, res) => {
    const { userId, userName, amount } = req.body;
    const depAmount = Number(amount);
    if (!userId || !depAmount || depAmount <= 0) {
      return res.status(400).json({ success: false, message: 'እባክዎ ትክክለኛ የተጠቃሚ መረጃ እና መጠን ያስገቡ!' });
    }

    try {
      const deposit = await Deposit.create({
        userId: String(userId),
        userName: userName || `User_${userId}`,
        amount: depAmount,
        status: 'PENDING',
        method: 'TELEBIRR_AUTO',
      });

      const { checkoutUrl, prepayId } = await createDepositOrder({
        outTradeNo: String(deposit._id),
        amount: depAmount,
        subject: 'Fetan Lottery Deposit',
      });

      deposit.prepayId = prepayId;
      await deposit.save();

      return res.json({ success: true, checkoutUrl });
    } catch (err) {
      console.error('Telebirr deposit/create error:', err);
      return res.status(500).json({ success: false, message: 'የክፍያ ማስጀመሪያ ስህተት አጋጥሟል፣ እባክዎ እንደገና ይሞክሩ።' });
    }
  });

  // 2. Telebirr calls this URL when the payment finishes.
  router.post('/notify', async (req, res) => {
    try {
      const fields = await verifyNotifyPayload(req.body);
      const { merch_order_id: depositId, trade_status: status } = fields;

      const deposit = await Deposit.findById(depositId);
      if (!deposit) {
        console.error('Notify for unknown deposit id:', depositId);
        return res.status(200).json({ success: true }); // ack anyway; nothing to retry
      }

      // Idempotency: only ever credit a PENDING deposit once.
      if (deposit.status !== 'PENDING') {
        return res.status(200).json({ success: true });
      }

      if (status === 'SUCCESS' || status === 'PAID') {
        // TODO once confirmed: also call Telebirr's queryOrder here server-to-server
        // to double-confirm status before crediting, rather than trusting the
        // webhook body alone (defense in depth for a real-money system).
        deposit.status = 'APPROVED';
        await deposit.save();
        await User.updateOne({ userId: deposit.userId }, { $inc: { mainWallet: deposit.amount } });
        await notifyUserBalanceUpdate(deposit.userId);
      } else {
        deposit.status = 'FAILED';
        await deposit.save();
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Telebirr notify error:', err.message);
      // Do NOT credit anything on a verification failure. Still ack with 200 only
      // if your portal docs say retries on non-200 are unhelpful; otherwise return
      // a non-200 so Telebirr retries (confirm this behavior in your portal docs).
      return res.status(400).json({ success: false });
    }
  });

  // 3. Withdrawal stays on your existing manual-approval flow by default.
  //    This just gives you a single place to flip to automated payout later.
  router.post('/withdraw/attempt-auto', async (req, res) => {
    const { phone, amount, reference } = req.body;
    try {
      const result = await disburseToPhone({ phone, amount, reference });
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('Auto-disbursement not available, falling back to manual approval:', err.message);
      return res.json({ success: false, automated: false, reason: err.message });
    }
  });

  return router;
}
