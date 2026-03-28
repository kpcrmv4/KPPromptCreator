const { buildCodegenPrompt, parseCodegenOutput, validateGasFiles } = require('../../lib/gas-codegen');
const { buildGasZip } = require('../../lib/gas-zip-builder');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'AI code generation is not configured on this server' });
  }

  const { promptContent, projectName, includeInstaller } = req.body;

  if (!promptContent || !projectName) {
    return res.status(400).json({ error: 'promptContent and projectName are required' });
  }

  if (promptContent.length > 50000) {
    return res.status(400).json({ error: 'Prompt content too long (max 50,000 chars)' });
  }

  try {
    // 1. Build system prompt for Claude
    const codegenPrompt = buildCodegenPrompt(promptContent, projectName, { includeInstaller });

    // 2. Call Claude API
    const claudeResponse = await callClaudeAPI(ANTHROPIC_API_KEY, codegenPrompt);

    // 3. Parse output into files
    const files = parseCodegenOutput(claudeResponse);

    // 4. Validate
    const warnings = validateGasFiles(files);

    // 5. Build ZIP
    const zipBuffer = await buildGasZip(projectName, files, {
      includeInstaller: !!includeInstaller
    });

    // 6. Send ZIP as response
    const safeName = projectName.replace(/[^a-zA-Z0-9ก-๙\-_]/g, '_').substring(0, 40) || 'gas-project';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);
    res.setHeader('X-KP-Warnings', JSON.stringify(warnings));
    res.setHeader('X-KP-File-Count', files.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-KP-Warnings, X-KP-File-Count');
    res.send(zipBuffer);

  } catch (err) {
    console.error('GAS Codegen error:', err);
    res.status(500).json({ error: err.message || 'Code generation failed' });
  }
};

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
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Claude API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude API');

  return text;
}
