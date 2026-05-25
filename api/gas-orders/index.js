const crypto = require('crypto');
const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { notifyOrderReceived } = require('../../lib/notify');

const FLOOR_PRICE = 499;

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method === 'GET')  return listOrders(req, res);
  if (req.method === 'POST') return createOrder(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

async function listOrders(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from('gas_orders')
    .select('id, order_number, project_name, template_code, mode, delivery_method, tier, price, status, created_at, paid_at')
    .eq('user_id', user.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ orders: data });
}

async function createOrder(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    template_code, mode, delivery_method, training_addon,
    addons, style, chat_log, price, tier,
    project_name, customer_name, customer_email, line_basic_id,
  } = req.body;

  // Validation
  if (!template_code) return res.status(400).json({ error: 'กรุณาเลือก template' });
  if (!mode || !['A', 'B'].includes(mode)) return res.status(400).json({ error: 'mode ไม่ถูกต้อง' });
  if (!delivery_method) return res.status(400).json({ error: 'กรุณาเลือกวิธีส่งมอบ' });
  if (!project_name) return res.status(400).json({ error: 'กรุณากรอกชื่อระบบ' });
  if (!customer_name || !customer_email) return res.status(400).json({ error: 'กรุณากรอกชื่อและ email' });

  // Verify template exists + price floor
  const { data: tpl, error: tplError } = await supabaseAdmin
    .from('gas_templates')
    .select('code, name, base_price_mode_a, base_price_mode_b, forced_mode')
    .eq('code', template_code)
    .single();

  if (tplError || !tpl) return res.status(400).json({ error: 'template ไม่ถูกต้อง' });
  if (tpl.forced_mode && tpl.forced_mode !== mode) {
    return res.status(400).json({ error: `template นี้ต้องใช้ Mode ${tpl.forced_mode}` });
  }

  // Server-side recalc (don't trust client)
  // (simple version — Phase 2 ทำ full recalc จาก addons catalog ฝั่ง server)
  const validatedPrice = Math.max(price || 0, FLOOR_PRICE);

  // Generate order_number
  const order_number = 'ORDER-' + crypto.randomBytes(3).toString('hex');

  const { data: order, error: insertError } = await supabaseAdmin
    .from('gas_orders')
    .insert({
      user_id: user.id,
      order_number,
      template_code,
      mode,
      delivery_method,
      training_addon: !!training_addon,
      addons: addons || [],
      style: style || {},
      chat_log: chat_log || [],
      project_name,
      prompt_content: JSON.stringify({ template: tpl.name, addons, style }),  // legacy field
      tier: mapTier(tier),
      price: validatedPrice,
      customer_name,
      customer_email,
      line_basic_id: line_basic_id || null,
      preferred_contact: 'line',
      status: 'submitted',
    })
    .select('id, order_number, status, created_at')
    .single();

  if (insertError) {
    console.error('[gas-orders create]', insertError);
    return res.status(500).json({ error: 'สร้างคำสั่งซื้อไม่สำเร็จ' });
  }

  // Generate initial spec.md (skeleton)
  const specMd = generateSpecMd({ order, template: tpl, mode, delivery_method, addons, style, project_name });
  await supabaseAdmin.from('gas_specs').insert({
    order_id: order.id,
    version: 1,
    content_md: specMd,
    spec_json: { template_code, mode, addons, style },
    generated_by: 'shop_wizard',
  });

  // Notify admin (LINE — fail silent if not configured)
  try {
    await notifyOrderReceived({
      ...order,
      customer_name, customer_email, line_basic_id,
      template_name: tpl.name,
      mode, delivery_method, price: validatedPrice,
    });
  } catch (e) {
    console.warn('[notify]', e.message);
  }

  res.status(201).json({ order });
}

function mapTier(tier) {
  // map starter/standard/pro → simple/moderate/complex (legacy enum)
  return tier === 'starter' ? 'simple' : tier === 'pro' ? 'complex' : 'moderate';
}

function generateSpecMd({ order, template, mode, delivery_method, addons, style, project_name }) {
  return `# Project: ${project_name}
# Order: ${order.order_number}
# Mode: ${mode}
# Delivery: ${delivery_method}

## Template
${template.code} — ${template.name}

## Add-ons
${(addons || []).map(a => '- ' + a).join('\n')}

## Style
- theme: ${style?.theme || 'default'}
- font: ${style?.font || 'default'}
- dark_mode: ${!!style?.dark_mode}

## Build constraints
- Mode ${mode}: ${mode === 'A' ? 'Pure GAS, no Vercel, HTMLService UI' : 'Hybrid (Vercel frontend + GAS backend)'}
- Delivery: ${delivery_method}

## Notes
TODO: เพิ่มจาก AI chat log (Phase 2) + admin edit
`;
}
