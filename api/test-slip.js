// Slip2Go test endpoint — admin only
// Verify a QR-code string against Slip2Go API + run our local validation.

const { requireRole } = require('../lib/auth');
const { cors } = require('../lib/helpers');
const { verifySlipByQR, validateForPurchase, errorMessageTH } = require('../lib/slip2go');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { qrCode, expectedAmount, receiverName, checkDuplicate } = req.body || {};
  if (!qrCode || typeof qrCode !== 'string') {
    return res.status(400).json({ error: 'กรุณาระบุ qrCode' });
  }

  const opts = {};
  const checkCondition = {};
  if (checkDuplicate) checkCondition.checkDuplicate = true;
  if (receiverName) {
    checkCondition.checkReceiver = [{ accountNameTH: receiverName }];
  }
  if (Object.keys(checkCondition).length) opts.checkCondition = checkCondition;

  const startedAt = Date.now();
  const slipResult = await verifySlipByQR(qrCode, opts);
  const elapsedMs = Date.now() - startedAt;

  if (!slipResult.ok) {
    return res.json({
      ok: false,
      stage: 'slip2go',
      error: slipResult.error,
      message: errorMessageTH(slipResult.error),
      slip2go_message: slipResult.message || null,
      elapsedMs,
      raw: slipResult.raw || null,
    });
  }

  // Local validation (optional — only if expectedAmount provided)
  let validation = null;
  if (expectedAmount != null) {
    const err = validateForPurchase(slipResult.data, {
      amount: Number(expectedAmount),
      receiverName: receiverName || undefined,
    });
    validation = err
      ? { ok: false, error: err, message: errorMessageTH(err) }
      : { ok: true };
  }

  return res.json({
    ok: true,
    stage: 'verified',
    elapsedMs,
    validation,
    data: slipResult.data,
    raw: slipResult.raw,
  });
};
