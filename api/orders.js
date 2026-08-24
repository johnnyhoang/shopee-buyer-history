const db = require('./db');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await db.query(`
        SELECT 
          id,
          order_code AS "orderCode",
          account_id AS "accountId",
          shop_name AS "shopName",
          status,
          status_text AS "statusText",
          order_time AS "orderTime",
          cancel_time AS "cancelTime",
          total_amount AS "totalAmount",
          refund_amount AS "refundAmount",
          payment_method AS "paymentMethod",
          refund_status AS "refundStatus",
          refund_confirmed_at AS "refundConfirmedAt",
          cancel_reason AS "cancelReason",
          refund_reason AS "refundReason",
          user_note AS "userNote",
          items,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM shopee_orders
        ORDER BY order_time DESC NULLS LAST
      `);

      const formatted = result.rows.map(row => ({
        ...row,
        totalAmount: Number(row.totalAmount) || 0,
        refundAmount: Number(row.refundAmount) || 0,
        items: row.items || [],
      }));

      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const { 
        id, orderCode, accountId, shopName, status, statusText,
        orderTime, cancelTime, totalAmount, refundAmount, paymentMethod,
        refundStatus, refundConfirmedAt, cancelReason, refundReason, userNote, items 
      } = body;

      if (!orderCode) {
        return res.status(400).json({ error: 'Missing orderCode' });
      }

      const finalId = id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      const upsertQuery = `
        INSERT INTO shopee_orders (
          id, order_code, account_id, shop_name, status, status_text,
          order_time, cancel_time, total_amount, refund_amount, payment_method,
          refund_status, refund_confirmed_at, cancel_reason, refund_reason, user_note, items, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
        )
        ON CONFLICT (order_code) DO UPDATE SET
          account_id = COALESCE(EXCLUDED.account_id, shopee_orders.account_id),
          shop_name = COALESCE(EXCLUDED.shop_name, shopee_orders.shop_name),
          status = COALESCE(EXCLUDED.status, shopee_orders.status),
          status_text = COALESCE(EXCLUDED.status_text, shopee_orders.status_text),
          order_time = COALESCE(EXCLUDED.order_time, shopee_orders.order_time),
          cancel_time = COALESCE(EXCLUDED.cancel_time, shopee_orders.cancel_time),
          total_amount = COALESCE(EXCLUDED.total_amount, shopee_orders.total_amount),
          refund_amount = COALESCE(EXCLUDED.refund_amount, shopee_orders.refund_amount),
          payment_method = COALESCE(EXCLUDED.payment_method, shopee_orders.payment_method),
          refund_status = COALESCE(EXCLUDED.refund_status, shopee_orders.refund_status),
          refund_confirmed_at = COALESCE(EXCLUDED.refund_confirmed_at, shopee_orders.refund_confirmed_at),
          user_note = COALESCE(EXCLUDED.user_note, shopee_orders.user_note),
          items = COALESCE(EXCLUDED.items, shopee_orders.items),
          updated_at = NOW()
        RETURNING *;
      `;

      const values = [
        finalId,
        orderCode,
        accountId || 'acc_main',
        shopName || 'Shopee Shop',
        status || 'COMPLETED',
        statusText || 'Hoàn thành',
        orderTime || new Date().toISOString(),
        cancelTime || null,
        totalAmount || 0,
        refundAmount || 0,
        paymentMethod || 'SHOPEEPAY',
        refundStatus || 'SHOPEE_REFUNDED',
        refundConfirmedAt || null,
        cancelReason || '',
        refundReason || '',
        userNote || '',
        JSON.stringify(items || []),
      ];

      const result = await db.query(upsertQuery, values);
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id, orderCode, ids } = req.body || req.query;

      if (ids && Array.isArray(ids)) {
        await db.query(`DELETE FROM shopee_orders WHERE id = ANY($1::text[]) OR order_code = ANY($1::text[])`, [ids]);
        return res.status(200).json({ success: true, count: ids.length });
      }

      if (id || orderCode) {
        await db.query(`DELETE FROM shopee_orders WHERE id = $1 OR order_code = $1`, [id || orderCode]);
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Missing id or orderCode' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('API Error in /api/orders:', err);
    return res.status(500).json({ error: err.message });
  }
};
