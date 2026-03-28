const { supabaseAdmin } = require('../../lib/supabase');
const { requireAuth } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token required' });

  // Find order by download token
  const { data: order, error } = await supabaseAdmin
    .from('codegen_orders')
    .select('*')
    .eq('download_token', token)
    .eq('user_id', user.id)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
  }

  if (order.status !== 'completed') {
    return res.status(403).json({ error: 'คำสั่งซื้อยังไม่พร้อมดาวน์โหลด', status: order.status });
  }

  if (!order.zip_path) {
    return res.status(404).json({ error: 'ไม่พบไฟล์ ZIP' });
  }

  // Download from storage
  const { data: fileData, error: dlError } = await supabaseAdmin.storage
    .from('codegen')
    .download(order.zip_path);

  if (dlError || !fileData) {
    return res.status(500).json({ error: 'ดาวน์โหลดไม่สำเร็จ' });
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  // Update download count
  await supabaseAdmin
    .from('codegen_orders')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', order.id);

  const safeName = order.project_name.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_') || 'gas-project';
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);
  res.send(buffer);
};
