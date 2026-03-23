// CORS handler for Vercel serverless functions
function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// Parse request body (Vercel auto-parses, but just in case)
function parseBody(req) {
  return req.body || {};
}

// Validate required fields
function validateRequired(body, fields) {
  const missing = fields.filter(f => !body[f] && body[f] !== 0);
  if (missing.length > 0) {
    return `กรุณากรอก: ${missing.join(', ')}`;
  }
  return null;
}

module.exports = { cors, parseBody, validateRequired };
