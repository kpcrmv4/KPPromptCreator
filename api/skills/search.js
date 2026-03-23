// Proxy search to skills.sh API
// Frontend calls: /api/skills/search?q=react&limit=10
// This avoids CORS issues since skills.sh doesn't allow browser-origin requests

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { q, limit = '10' } = req.query;
    if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Missing query parameter: q' });
    }

    try {
        const url = `https://skills.sh/api/search?q=${encodeURIComponent(q.trim())}&limit=${parseInt(limit) || 10}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'KPPromptCreator/1.0',
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(8000)
        });

        if (!response.ok) {
            throw new Error(`skills.sh returned ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        console.error('Skills search error:', err.message);
        res.status(502).json({ error: 'Failed to fetch from skills.sh', message: err.message });
    }
};
