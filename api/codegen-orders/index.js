const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method === 'GET') return listOrders(req, res);
  if (req.method === 'POST') return createOrder(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

// GET /api/codegen-orders — list user's codegen orders
async function listOrders(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from('codegen_orders')
    .select('id, project_name, tier, price, status, file_count, download_token, slip_image_url, admin_note, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ orders: data });
}

// POST /api/codegen-orders — create new order + upload slip
async function createOrder(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { projectName, promptContent, tier, price, includeInstaller, slipImageBase64, slipFilename, uiStyle, darkMode } = req.body;

  if (!projectName || !promptContent || !tier || !price) {
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
  }

  // Skip strict price validation on backend as pricing is dynamic based on prompt analysis
  const validTiers = ['simple', 'moderate', 'complex'];
  if (!validTiers.includes(tier)) {
    return res.status(400).json({ error: 'Tier ไม่ถูกต้อง' });
  }

  if (!slipImageBase64 || !slipFilename) {
    return res.status(400).json({ error: 'กรุณาแนบสลิปโอนเงิน' });
  }

  // Upload slip image
  const slipBase64 = slipImageBase64.replace(/^data:image\/\w+;base64,/, '');
  const slipBuffer = Buffer.from(slipBase64, 'base64');
  if (slipBuffer.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'สลิปต้องมีขนาดไม่เกิน 5MB' });
  }

  const ext = slipFilename.split('.').pop().toLowerCase();
  const slipPath = `slips/${user.id}/${Date.now()}_${slipFilename}`;
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('codegen')
    .upload(slipPath, slipBuffer, { contentType, upsert: false });

  if (uploadError) {
    return res.status(500).json({ error: 'อัปโหลดสลิปไม่สำเร็จ' });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('codegen')
    .getPublicUrl(slipPath);

  const downloadToken = crypto.randomBytes(24).toString('hex');

  const { data, error } = await supabaseAdmin
    .from('codegen_orders')
    .insert({
      user_id: user.id,
      project_name: projectName,
      prompt_content: promptContent,
      tier,
      price,
      ui_style: uiStyle,
      dark_mode: darkMode === true || darkMode === 'true',
      include_installer: includeInstaller !== false,
      slip_image_url: urlData.publicUrl,
      download_token: downloadToken,
      status: 'pending_payment'
    })
    .select('id, status, download_token, created_at')
    .single();

  if (error) {
    return res.status(500).json({ error: 'สร้างคำสั่งซื้อไม่สำเร็จ' });
  }

  // Notify admins
  try {
    const { createNotification } = require('../../lib/notify');
    if (typeof createNotification === 'function') {
      await createNotification({
        type: 'codegen_order',
        title: 'คำสั่งซื้อ Code Gen ใหม่',
        message: `${user.display_name || user.email} สั่งซื้อ "${projectName}" (฿${price})`,
        ref_id: data.id,
        target_role: 'admin'
      });
    }
  } catch {}

  res.status(201).json({ order: data });
}
