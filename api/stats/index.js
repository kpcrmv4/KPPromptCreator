const { supabaseAdmin } = require('../../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — fetch global stats
  if (req.method === 'GET') {
    try {
      // Total prompts
      const { count: totalPrompts } = await supabaseAdmin
        .from('prompt_stats')
        .select('*', { count: 'exact', head: true });

      // Platform breakdown
      const { data: platformRows } = await supabaseAdmin
        .rpc('get_platform_stats');

      // Mode breakdown
      const { data: modeRows } = await supabaseAdmin
        .rpc('get_mode_stats');

      // Feature votes count
      const { count: voteCount } = await supabaseAdmin
        .from('feature_votes')
        .select('*', { count: 'exact', head: true })
        .eq('feature_name', 'ai-code-gen');

      return res.status(200).json({
        totalPrompts: totalPrompts || 0,
        platforms: platformRows || [],
        modes: modeRows || [],
        aiCodeGenVotes: voteCount || 0
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST — track a prompt generation or vote
  if (req.method === 'POST') {
    const { type, platform, mode, visitorId } = req.body;

    try {
      if (type === 'prompt') {
        if (!platform || !mode) {
          return res.status(400).json({ error: 'platform and mode required' });
        }
        await supabaseAdmin
          .from('prompt_stats')
          .insert({ platform, mode });

      } else if (type === 'vote') {
        if (!visitorId) {
          return res.status(400).json({ error: 'visitorId required' });
        }
        const { error } = await supabaseAdmin
          .from('feature_votes')
          .upsert(
            { feature_name: 'ai-code-gen', visitor_id: visitorId },
            { onConflict: 'feature_name,visitor_id' }
          );
        if (error && error.code !== '23505') throw error;
      } else {
        return res.status(400).json({ error: 'type must be prompt or vote' });
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
