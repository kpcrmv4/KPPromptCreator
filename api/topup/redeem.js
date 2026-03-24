const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { notifyAdmins } = require('../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { amount } = req.body;

  // Validate amount
  const requestedAmount = parseInt(amount);
  if (!requestedAmount || requestedAmount < 1) {
    return res.status(400).json({ error: 'กรุณาระบุจำนวนเงินที่ต้องการเติม' });
  }
  if (requestedAmount > 10000) {
    return res.status(400).json({ error: 'เติมเครดิตได้สูงสุด ฿10,000 ต่อครั้ง' });
  }

  // Get PromptPay info from settings
  let promptpayNumber = '';
  let promptpayName = '';
  try {
    const { data: settings } = await supabaseAdmin.from('settings').select('key, value').in('key', ['promptpay_number', 'promptpay_name']);
    if (settings) {
      settings.forEach(s => {
        if (s.key === 'promptpay_number') promptpayNumber = s.value;
        if (s.key === 'promptpay_name') promptpayName = s.value;
      });
    }
  } catch {}

  if (!promptpayNumber) {
    return res.status(500).json({ error: 'ระบบยังไม่ได้ตั้งค่าหมายเลข PromptPay กรุณาติดต่อ Admin' });
  }

  // Generate unique amount with satang (for matching)
  const uniqueAmount = await generateUniqueAmount(requestedAmount);

  // Create pending topup record (no slip yet)
  const { data: topup, error: insertError } = await supabaseAdmin
    .from('pending_topups')
    .insert({
      user_id: user.id,
      requested_amount: requestedAmount,
      unique_amount: uniqueAmount,
      status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create pending topup:', insertError);
    return res.status(500).json({ error: 'ไม่สามารถสร้างรายการเติมเงินได้' });
  }

  // Notify all admins
  await notifyAdmins({
    type: 'topup_request',
    title: 'มีคำขอเติมเครดิตใหม่',
    message: `${user.display_name} ขอเติมเครดิต ฿${requestedAmount} (ยอดโอน ฿${uniqueAmount.toFixed(2)})`,
    ref_id: topup.id,
    ref_type: 'topup'
  });

  res.json({
    success: true,
    topup_id: topup.id,
    requested_amount: requestedAmount,
    unique_amount: uniqueAmount,
    promptpay_number: promptpayNumber,
    promptpay_name: promptpayName
  });
};

/**
 * Generate unique amount with random satang to avoid collision
 * Checks existing pending topups to avoid duplicate amounts within 30 minutes
 */
async function generateUniqueAmount(baseAmount) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Get existing pending amounts to avoid collision
  const { data: existing } = await supabaseAdmin
    .from('pending_topups')
    .select('unique_amount')
    .eq('status', 'pending')
    .gte('created_at', thirtyMinutesAgo);

  const usedAmounts = new Set((existing || []).map(t => parseFloat(t.unique_amount).toFixed(2)));

  // Try to generate a unique amount
  for (let i = 0; i < 99; i++) {
    const satang = Math.floor(Math.random() * 99) + 1; // 1-99
    const amount = baseAmount + satang / 100;
    const amountStr = amount.toFixed(2);

    if (!usedAmounts.has(amountStr)) {
      return amount;
    }
  }

  // Fallback: use timestamp-based satang
  const fallbackSatang = (Date.now() % 99) + 1;
  return baseAmount + fallbackSatang / 100;
}
