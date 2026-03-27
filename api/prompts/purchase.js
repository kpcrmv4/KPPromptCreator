const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { sendNotification } = require('../../lib/notify');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { prompt_id } = req.body;
  if (!prompt_id) return res.status(400).json({ error: 'กรุณาระบุ prompt_id' });

  const { data: prompt } = await supabaseAdmin
    .from('prompts')
    .select('id, title, price, status, seller_id, purchase_count')
    .eq('id', prompt_id)
    .single();

  if (!prompt || prompt.status !== 'approved') {
    return res.status(404).json({ error: 'ไม่พบ prompt หรือยังไม่ได้อนุมัติ' });
  }
  if (prompt.seller_id === user.id) {
    return res.status(400).json({ error: 'ไม่สามารถซื้อ prompt ของตัวเองได้' });
  }

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('prompt_id', prompt_id)
    .single();

  if (existingOrder) {
    return res.status(409).json({ error: 'คุณซื้อ prompt นี้แล้ว' });
  }

  if (Number(prompt.price) === 0) {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: user.id,
        prompt_id,
        seller_id: prompt.seller_id,
        amount: 0,
        commission: 0,
        seller_amount: 0,
        status: 'completed'
      })
      .select('id')
      .single();

    if (orderError) {
      const msg = orderError.message || '';
      if (msg.includes('duplicate') || msg.includes('unique')) {
        return res.status(409).json({ error: 'คุณซื้อ prompt นี้แล้ว' });
      }
    }

    if (orderError || !order) {
      return res.status(500).json({ error: 'รับ Prompt ฟรีไม่สำเร็จ' });
    }

    await supabaseAdmin
      .from('prompts')
      .update({ purchase_count: (prompt.purchase_count || 0) + 1 })
      .eq('id', prompt_id);

    await sendNotification({
      user_id: prompt.seller_id,
      type: 'new_sale',
      title: 'มีคนรับ Prompt ฟรีของคุณ!',
      message: `"${prompt.title}" ถูกกดรับฟรีแล้ว`,
      ref_id: order.id,
      ref_type: 'order'
    });

    return res.json({
      success: true,
      order: { id: order.id, amount: 0 },
      new_balance: parseFloat(user.credit_balance || 0),
      message: `รับ "${prompt.title}" ฟรีสำเร็จ`
    });
  }

  // ดึง commission rate
  const { data: setting } = await supabaseAdmin
    .from('settings').select('value').eq('key', 'commission_rate').single();
  const commissionRate = parseFloat(setting?.value || 10) / 100;

  // Atomic purchase via DB function (ป้องกัน race condition)
  const { data, error } = await supabaseAdmin.rpc('purchase_prompt', {
    p_buyer_id: user.id,
    p_prompt_id: prompt_id,
    p_commission_rate: commissionRate
  });

  if (error) {
    const msg = error.message || '';
    if (msg.includes('buyer_not_found')) return res.status(404).json({ error: 'ไม่พบผู้ซื้อ' });
    if (msg.includes('prompt_not_found')) return res.status(404).json({ error: 'ไม่พบ prompt หรือยังไม่ได้อนุมัติ' });
    if (msg.includes('cannot_buy_own')) return res.status(400).json({ error: 'ไม่สามารถซื้อ prompt ของตัวเองได้' });
    if (msg.includes('already_purchased')) return res.status(409).json({ error: 'คุณซื้อ prompt นี้แล้ว' });
    if (msg.includes('insufficient_balance')) {
      return res.status(400).json({ error: 'เครดิตไม่เพียงพอ', need_topup: true });
    }
    return res.status(500).json({ error: 'ซื้อไม่สำเร็จ' });
  }

  // แจ้ง seller ว่ามีคนซื้อ
  await sendNotification({
    user_id: data.seller_id,
    type: 'new_sale',
    title: 'มีคนซื้อ Prompt ของคุณ!',
    message: `"${data.prompt_title}" ขายได้ ฿${data.seller_amount} (หลังหักค่าคอม)`,
    ref_id: data.order_id,
    ref_type: 'order'
  });

  res.json({
    success: true,
    order: { id: data.order_id, amount: data.amount },
    new_balance: data.new_buyer_balance,
    message: `ซื้อ "${data.prompt_title}" สำเร็จ`
  });
};
