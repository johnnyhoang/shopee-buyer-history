const db = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await db.query(`
        SELECT id, name, username, phone, color, created_at AS "createdAt"
        FROM shopee_accounts
        ORDER BY created_at ASC
      `);
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name, username, phone, color } = req.body || {};
      const finalId = id || `acc_${Date.now()}`;

      const result = await db.query(`
        INSERT INTO shopee_accounts (id, name, username, phone, color)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, shopee_accounts.name),
          username = COALESCE(EXCLUDED.username, shopee_accounts.username),
          phone = COALESCE(EXCLUDED.phone, shopee_accounts.phone),
          color = COALESCE(EXCLUDED.color, shopee_accounts.color)
        RETURNING id, name, username, phone, color, created_at AS "createdAt";
      `, [finalId, name || 'Tài khoản mới', username || '', phone || '', color || 'slate']);

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      await db.query(`DELETE FROM shopee_accounts WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('API Error in /api/accounts:', err);
    return res.status(500).json({ error: err.message });
  }
};
