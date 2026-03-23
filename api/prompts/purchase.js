const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { prompt_id } = req.body;
  if (!prompt_id) return res.status(400).json({ error: 'กรุณาระบุ prompt_id' });

  // 1. ดึงข้อมูล prompt
  const { data: prompt } = await supabaseAdmin
    .from('prompts')
    .select('id, title, price, seller_id, status')
    .eq('id', prompt_id)
    .single();

  if (!prompt) return res.status(404).json({ error: 'ไม่พบ prompt' });
  if (prompt.status !== 'approved') return res.status(400).json({ error: 'prompt นี้ยังไม่ได้รับอนุมัติ' });
  if (prompt.seller_id === user.id) return res.status(400).json({ error: 'ไม่สามารถซื้อ prompt ของตัวเองได้' });

  // 2. เช็คว่าซื้อแล้วหรือยัง
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('buyer_id', user.id)
    .eq('prompt_id', prompt_id)
    .single();

  if (existingOrder) return res.status(409).json({ error: 'คุณซื้อ prompt นี้แล้ว' });

  // 3. ดึงยอดเครดิตล่าสุด
  const { data: freshUser } = await supabaseAdmin
    .from('users').select('credit_balance').eq('id', user.id).single();
  const balance = parseFloat(freshUser.credit_balance);

  if (balance < prompt.price) {
    return res.status(400).json({
      error: `เครดิตไม่พอ (มี ฿${balance}, ต้องการ ฿${prompt.price})`,
      need_topup: true,
      shortfall: prompt.price - balance
    });
  }

  // 4. ดึง commission rate
  const { data: setting } = await supabaseAdmin
    .from('settings').select('value').eq('key', 'commission_rate').single();
  const commissionRate = parseFloat(setting?.value || 10) / 100;
  const commission = Math.round(prompt.price * commissionRate * 100) / 100;
  const sellerAmount = prompt.price - commission;

  // 5. หักเครดิตผู้ซื้อ
  const newBuyerBalance = balance - prompt.price;
  await supabaseAdmin
    .from('users')
    .update({ credit_balance: newBuyerBalance })
    .eq('id', user.id);

  // 6. เพิ่มเครดิต seller
  const { data: seller } = await supabaseAdmin
    .from('users').select('credit_balance').eq('id', prompt.seller_id).single();
  const newSellerBalance = parseFloat(seller.credit_balance) + sellerAmount;
  await supabaseAdmin
    .from('users')
    .update({ credit_balance: newSellerBalance })
    .eq('id', prompt.seller_id);

  // 7. สร้าง order
  const { data: order } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: user.id,
      prompt_id,
      seller_id: prompt.seller_id,
      amount: prompt.price,
      commission,
      seller_amount: sellerAmount,
      status: 'completed'
    })
    .select('id, amount, created_at')
    .single();

  // 8. บันทึก transactions ทั้ง 2 ฝั่ง
  await supabaseAdmin.from('transactions').insert([
    {
      user_id: user.id,
      type: 'purchase',
      amount: -prompt.price,
      balance_after: newBuyerBalance,
      ref_id: order.id,
      description: `ซื้อ "${prompt.title}"`
    },
    {
      user_id: prompt.seller_id,
      type: 'sale',
      amount: sellerAmount,
      balance_after: newSellerBalance,
      ref_id: order.id,
      description: `ขาย "${prompt.title}" (หักค่าคอม ฿${commission})`
    }
  ]);

  // 9. อัปเดต purchase_count
  await supabaseAdmin.rpc('increment_field', {
    table_name: 'prompts', row_id: prompt_id, field_name: 'purchase_count'
  }).catch(() => {
    // Fallback if RPC not available
    supabaseAdmin.from('prompts')
      .update({ purchase_count: (prompt.purchase_count || 0) + 1 })
      .eq('id', prompt_id);
  });

  res.json({
    success: true,
    order,
    new_balance: newBuyerBalance,
    message: `ซื้อ "${prompt.title}" สำเร็จ`
  });
};
