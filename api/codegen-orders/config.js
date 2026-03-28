const { supabaseAdmin } = require('../../lib/supabase');
const { cors } = require('../../lib/helpers');

module.exports = async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Get PromptPay number from settings
  let promptpayNumber = process.env.PROMPTPAY_NUMBER || '';

  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'promptpay_number')
      .single();
    if (data?.value) promptpayNumber = data.value;
  } catch {}

  res.json({ promptpayNumber });
};
