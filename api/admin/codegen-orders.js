const { supabaseAdmin } = require('../../lib/supabase');
const { requireRole } = require('../../lib/auth');
const { cors } = require('../../lib/helpers');
const { buildCodegenPrompt, parseCodegenOutput, validateGasFiles } = require('../../lib/gas-codegen');
const { buildGasZip } = require('../../lib/gas-zip-builder');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method === 'GET') return listOrders(req, res);
  if (req.method === 'PUT') return processOrder(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
};

// GET — list all codegen orders for admin
async function listOrders(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const status = req.query.status || 'pending_payment';

  const { data, error } = await supabaseAdmin
    .from('codegen_orders')
    .select('*, user:users!user_id(id, display_name, email)')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ orders: data });
}

// PUT — approve (trigger AI) or reject
async function processOrder(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { orderId, action, adminNote } = req.body;
  if (!orderId || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'orderId and action (approve/reject) required' });
  }

  // Fetch order
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('codegen_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
  if (order.status !== 'pending_payment') {
    return res.status(400).json({ error: 'คำสั่งซื้อนี้ดำเนินการไปแล้ว' });
  }

  if (action === 'reject') {
    await supabaseAdmin
      .from('codegen_orders')
      .update({ status: 'rejected', admin_note: adminNote || 'ปฏิเสธ', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    // Notify user
    await notifyUser(order.user_id, 'codegen_rejected', 'คำสั่งซื้อถูกปฏิเสธ',
      `คำสั่งซื้อ "${order.project_name}" ถูกปฏิเสธ${adminNote ? ': ' + adminNote : ''}`, orderId);

    return res.json({ ok: true, status: 'rejected' });
  }

  // === APPROVE: Generate code with AI ===
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Update status to generating
  await supabaseAdmin
    .from('codegen_orders')
    .update({ status: 'generating', admin_note: adminNote || null, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  try {
    // 1. Build prompt
    const codegenPrompt = buildCodegenPrompt(order.prompt_content, order.project_name, {
      includeInstaller: order.include_installer
    });

    // 2. Call Claude API
    const claudeResponse = await callClaudeAPI(ANTHROPIC_API_KEY, codegenPrompt);

    // 3. Parse files
    const files = parseCodegenOutput(claudeResponse);
    const warnings = validateGasFiles(files);

    // 4. Build ZIP
    const zipBuffer = await buildGasZip(order.project_name, files, {
      includeInstaller: order.include_installer
    });

    // 5. Upload ZIP to storage
    const zipPath = `zips/${order.user_id}/${order.id}/${order.project_name.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_')}.zip`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('codegen')
      .upload(zipPath, zipBuffer, { contentType: 'application/zip', upsert: true });

    if (uploadErr) throw new Error('Upload ZIP failed: ' + uploadErr.message);

    // 6. Update order as completed
    await supabaseAdmin
      .from('codegen_orders')
      .update({
        status: 'completed',
        zip_path: zipPath,
        file_count: files.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    // 7. Notify user
    await notifyUser(order.user_id, 'codegen_completed', 'โค้ดพร้อมดาวน์โหลด!',
      `"${order.project_name}" สร้างเสร็จแล้ว (${files.length} ไฟล์) ดาวน์โหลดได้ที่หน้าคำสั่งซื้อ`, orderId);

    return res.json({ ok: true, status: 'completed', fileCount: files.length, warnings });

  } catch (err) {
    // Revert to pending if generation fails
    await supabaseAdmin
      .from('codegen_orders')
      .update({ status: 'pending_payment', admin_note: 'Generation failed: ' + err.message, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    return res.status(500).json({ error: 'สร้างโค้ดไม่สำเร็จ: ' + err.message });
  }
}

async function notifyUser(userId, type, title, message, refId) {
  try {
    const { createNotification } = require('../../lib/notify');
    if (typeof createNotification === 'function') {
      await createNotification({ type, title, message, ref_id: refId, user_id: userId });
    }
  } catch {}
}

async function callClaudeAPI(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data?.content?.[0]?.text || '';
}
