const crypto = require('crypto');

/**
 * ตรวจสอบว่า prompt content มี KP Fingerprint หรือไม่
 */
function verifyKPFingerprint(content) {
  if (!content) return { valid: false, reason: 'no_content' };

  // ค้นหา signature pattern
  const sigMatch = content.match(/<!-- KP-PROMPT-CREATOR-SIGNATURE -->/);
  const hashMatch = content.match(/<!-- Content-Hash:\s*([a-f0-9]+-[a-z0-9]+)\s*-->/);
  const signatureMatch = content.match(/<!-- Signature:\s*(KP-[a-f0-9]+-[a-z0-9]+)\s*-->/);
  const generatedMatch = content.match(/<!-- Generated:\s*(.+?)\s*-->/);

  if (!sigMatch) {
    return { valid: false, reason: 'no_signature', message: 'ไม่พบ KP Signature ในไฟล์ — อาจไม่ได้สร้างจาก KP Prompt Creator' };
  }

  if (!hashMatch || !signatureMatch) {
    return { valid: false, reason: 'incomplete_signature', message: 'Signature ไม่สมบูรณ์' };
  }

  return {
    valid: true,
    content_hash: hashMatch[1],
    signature: signatureMatch[1],
    generated_at: generatedMatch ? generatedMatch[1] : null
  };
}

/**
 * สร้าง content hash สำหรับเช็คซ้ำ (ตัดส่วน signature ออกก่อน hash)
 */
function generateContentHash(content) {
  // ตัดส่วน fingerprint ออกเพื่อ hash แค่เนื้อหาจริง
  const cleanContent = content
    .replace(/---\n<!-- KP-PROMPT-CREATOR-SIGNATURE -->[\s\S]*$/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' '); // normalize whitespace

  return crypto.createHash('sha256').update(cleanContent).digest('hex');
}

/**
 * เช็ค similarity ระหว่าง 2 texts (Jaccard similarity บน word-level)
 * คืนค่า 0-1 (1 = เหมือนกัน 100%)
 */
function calculateSimilarity(text1, text2) {
  const words1 = new Set(normalizeForComparison(text1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeForComparison(text2).split(' ').filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }

  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function normalizeForComparison(text) {
  return text
    .replace(/---\n<!-- KP-PROMPT-CREATOR-SIGNATURE -->[\s\S]*$/, '') // ตัด fingerprint
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s]/g, '') // เอาเฉพาะตัวอักษร + ตัวเลข + ไทย
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { verifyKPFingerprint, generateContentHash, calculateSimilarity };
