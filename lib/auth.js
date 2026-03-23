const crypto = require('crypto');
const { supabaseAdmin } = require('./supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Simple JWT implementation (no external dependency)
function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

function createToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expected) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === test;
}

// Middleware: extract user from Authorization header
async function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, role, credit_balance, status, truemoney_phone')
    .eq('id', payload.sub)
    .single();

  return user;
}

// Require authentication — returns user or sends 401
async function requireAuth(req, res) {
  const user = await authenticate(req);
  if (!user) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    return null;
  }
  if (user.status === 'suspended') {
    res.status(403).json({ error: 'บัญชีถูกระงับ' });
    return null;
  }
  return user;
}

// Require specific role
async function requireRole(req, res, roles) {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (!roles.includes(user.role)) {
    res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
    return null;
  }
  return user;
}

module.exports = { createToken, verifyToken, hashPassword, verifyPassword, authenticate, requireAuth, requireRole };
