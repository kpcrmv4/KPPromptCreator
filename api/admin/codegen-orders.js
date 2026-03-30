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

// GET — list orders or download preview ZIP
async function listOrders(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  // Download preview ZIP
  if (req.query.action === 'download_preview' && req.query.orderId) {
    return downloadPreview(req, res, req.query.orderId);
  }

  const status = req.query.status || 'pending_payment';

  // Support multiple statuses (comma-separated)
  let query = supabaseAdmin
    .from('codegen_orders')
    .select('*, user:users!user_id(id, display_name, email)')
    .order('created_at', { ascending: false });

  if (status === 'all') {
    // No filter — return all
  } else if (status.includes(',')) {
    query = query.in('status', status.split(','));
  } else {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
  res.json({ orders: data });
}

// Download preview ZIP for admin review
async function downloadPreview(req, res, orderId) {
  const { data: order, error } = await supabaseAdmin
    .from('codegen_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error || !order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
  if (!order.zip_path) return res.status(404).json({ error: 'ไม่พบไฟล์ ZIP' });

  const { data: fileData, error: dlError } = await supabaseAdmin.storage
    .from('codegen')
    .download(order.zip_path);

  if (dlError || !fileData) return res.status(500).json({ error: 'ดาวน์โหลดไม่สำเร็จ' });

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const safeName = order.project_name.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_') || 'preview';
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="preview_${safeName}.zip"`);
  res.send(buffer);
}

// PUT — approve/reject/upload/generate_preview
async function processOrder(req, res) {
  const user = await requireRole(req, res, ['admin']);
  if (!user) return;

  const { orderId, action, adminNote } = req.body;
  const validActions = ['approve', 'reject', 'upload', 'generate_preview'];
  if (!orderId || !validActions.includes(action)) {
    return res.status(400).json({ error: `orderId and action (${validActions.join('/')}) required` });
  }

  // Fetch order
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('codegen_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });

  // === REJECT ===
  if (action === 'reject') {
    if (!['pending_payment', 'review'].includes(order.status)) {
      return res.status(400).json({ error: 'คำสั่งซื้อนี้ไม่สามารถปฏิเสธได้' });
    }
    await supabaseAdmin
      .from('codegen_orders')
      .update({ status: 'rejected', admin_note: adminNote || 'ปฏิเสธ', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    await notifyUser(order.user_id, 'codegen_rejected', 'คำสั่งซื้อถูกปฏิเสธ',
      `คำสั่งซื้อ "${order.project_name}" ถูกปฏิเสธ${adminNote ? ': ' + adminNote : ''}`, orderId);

    return res.json({ ok: true, status: 'rejected' });
  }

  // === UPLOAD: Admin uploads ZIP manually ===
  if (action === 'upload') {
    if (!['pending_payment', 'review'].includes(order.status)) {
      return res.status(400).json({ error: 'คำสั่งซื้อนี้ไม่สามารถอัปโหลดได้' });
    }

    const { zipBase64, zipFilename } = req.body;
    if (!zipBase64) {
      return res.status(400).json({ error: 'กรุณาแนบไฟล์ ZIP' });
    }

    try {
      // Decode base64 ZIP
      const base64Data = zipBase64.replace(/^data:.*?;base64,/, '');
      const zipBuffer = Buffer.from(base64Data, 'base64');

      // Upload to storage
      const safeName = order.project_name.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_');
      const zipPath = `zips/${order.user_id}/${order.id}/${safeName}.zip`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('codegen')
        .upload(zipPath, zipBuffer, { contentType: 'application/zip', upsert: true });

      if (uploadErr) throw new Error('Upload failed: ' + uploadErr.message);

      // Update order as completed
      await supabaseAdmin
        .from('codegen_orders')
        .update({
          status: 'completed',
          zip_path: zipPath,
          admin_note: adminNote || 'อัปโหลด ZIP โดย Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      // Notify user
      await notifyUser(order.user_id, 'codegen_completed', 'โค้ดพร้อมดาวน์โหลด!',
        `"${order.project_name}" สร้างเสร็จแล้ว — ดาวน์โหลดได้ที่หน้าคำสั่งซื้อ`, orderId);

      return res.json({ ok: true, status: 'completed' });

    } catch (err) {
      return res.status(500).json({ error: 'อัปโหลดไม่สำเร็จ: ' + err.message });
    }
  }

  // === GENERATE_PREVIEW: Auto-gen but don't deliver — admin reviews first ===
  if (action === 'generate_preview') {
    if (order.status !== 'pending_payment') {
      return res.status(400).json({ error: 'คำสั่งซื้อนี้ดำเนินการไปแล้ว' });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    await supabaseAdmin
      .from('codegen_orders')
      .update({ status: 'generating', admin_note: adminNote || null, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    try {
      const codegenPrompt = buildCodegenPrompt(order.prompt_content, order.project_name, {
        includeInstaller: order.include_installer
      });
      const claudeResponse = await callClaudeAPI(ANTHROPIC_API_KEY, codegenPrompt);
      const files = parseCodegenOutput(claudeResponse);
      const warnings = validateGasFiles(files);
      const zipBuffer = await buildGasZip(order.project_name, files, {
        includeInstaller: order.include_installer
      });

      // Upload preview ZIP (admin can download, test, then re-upload or approve)
      const safeName = order.project_name.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_');
      const previewPath = `zips/${order.user_id}/${order.id}/preview_${safeName}.zip`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('codegen')
        .upload(previewPath, zipBuffer, { contentType: 'application/zip', upsert: true });

      if (uploadErr) throw new Error('Upload preview failed: ' + uploadErr.message);

      // Set status to "review" — admin can download preview, test, then approve or upload fixed version
      await supabaseAdmin
        .from('codegen_orders')
        .update({
          status: 'review',
          zip_path: previewPath,
          file_count: files.length,
          admin_note: adminNote || 'AI สร้างแล้ว — รอ Admin ตรวจสอบ',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return res.json({ ok: true, status: 'review', fileCount: files.length, warnings, previewPath });

    } catch (err) {
      await supabaseAdmin
        .from('codegen_orders')
        .update({ status: 'pending_payment', admin_note: 'Generation failed: ' + err.message, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return res.status(500).json({ error: 'สร้างโค้ดไม่สำเร็จ: ' + err.message });
    }
  }

  // === APPROVE: Generate code and deliver directly (original flow) ===
  if (order.status === 'review') {
    // If already in review status with a preview ZIP, just mark as completed and deliver
    if (order.zip_path) {
      await supabaseAdmin
        .from('codegen_orders')
        .update({
          status: 'completed',
          admin_note: adminNote || 'อนุมัติจาก preview',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      await notifyUser(order.user_id, 'codegen_completed', 'โค้ดพร้อมดาวน์โหลด!',
        `"${order.project_name}" สร้างเสร็จแล้ว (${order.file_count || 0} ไฟล์) ดาวน์โหลดได้ที่หน้าคำสั่งซื้อ`, orderId);

      return res.json({ ok: true, status: 'completed', fileCount: order.file_count || 0 });
    }
  }

  if (order.status !== 'pending_payment') {
    return res.status(400).json({ error: 'คำสั่งซื้อนี้ดำเนินการไปแล้ว' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  await supabaseAdmin
    .from('codegen_orders')
    .update({ status: 'generating', admin_note: adminNote || null, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  try {
    const codegenPrompt = buildCodegenPrompt(order.prompt_content, order.project_name, {
      includeInstaller: order.include_installer
    });
    const claudeResponse = await callClaudeAPI(ANTHROPIC_API_KEY, codegenPrompt);
    const files = parseCodegenOutput(claudeResponse);
    const warnings = validateGasFiles(files);
    const zipBuffer = await buildGasZip(order.project_name, files, {
      includeInstaller: order.include_installer
    });

    const safeName = order.project_name.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_');
    const zipPath = `zips/${order.user_id}/${order.id}/${safeName}.zip`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('codegen')
      .upload(zipPath, zipBuffer, { contentType: 'application/zip', upsert: true });

    if (uploadErr) throw new Error('Upload ZIP failed: ' + uploadErr.message);

    await supabaseAdmin
      .from('codegen_orders')
      .update({
        status: 'completed',
        zip_path: zipPath,
        file_count: files.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    await notifyUser(order.user_id, 'codegen_completed', 'โค้ดพร้อมดาวน์โหลด!',
      `"${order.project_name}" สร้างเสร็จแล้ว (${files.length} ไฟล์) ดาวน์โหลดได้ที่หน้าคำสั่งซื้อ`, orderId);

    return res.json({ ok: true, status: 'completed', fileCount: files.length, warnings });

  } catch (err) {
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
