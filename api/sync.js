const db = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orders = [], accountId = 'acc_main', accountName } = req.body || {};

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: 'No orders provided' });
    }

    // Đảm bảo account tồn tại
    if (accountName) {
      await db.query(`
        INSERT INTO shopee_accounts (id, name, username, color)
        VALUES ($1, $2, $3, 'emerald')
        ON CONFLICT (id) DO NOTHING;
      `, [accountId, accountName, accountId]);
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const ord of orders) {
      const code = ord.orderCode || ord.id;
      if (!code) continue;

      const finalId = ord.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const isRefundOrCancel = ord.status === 'CANCELLED' || ord.status === 'REFUNDED' || ord.status === 'REFUNDING';
      const defaultRefundStatus = isRefundOrCancel ? 'SHOPEE_REFUNDED' : 'NOT_APPLICABLE';

      const upsertQuery = `
        INSERT INTO shopee_orders (
          id, order_code, account_id, shop_name, status, status_text,
          order_time, cancel_time, total_amount, refund_amount, payment_method,
          refund_status, refund_confirmed_at, cancel_reason, refund_reason, user_note, items, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
        )
        ON CONFLICT (order_code) DO UPDATE SET
          shop_name = COALESCE(EXCLUDED.shop_name, shopee_orders.shop_name),
          status = COALESCE(EXCLUDED.status, shopee_orders.status),
          status_text = COALESCE(EXCLUDED.status_text, shopee_orders.status_text),
          order_time = COALESCE(EXCLUDED.order_time, shopee_orders.order_time),
          cancel_time = COALESCE(EXCLUDED.cancel_time, shopee_orders.cancel_time),
          total_amount = COALESCE(EXCLUDED.total_amount, shopee_orders.total_amount),
          refund_amount = COALESCE(EXCLUDED.refund_amount, shopee_orders.refund_amount),
          payment_method = COALESCE(EXCLUDED.payment_method, shopee_orders.payment_method),
          items = COALESCE(EXCLUDED.items, shopee_orders.items),
          updated_at = NOW()
        RETURNING (xmax = 0) AS is_insert;
      `;

      const values = [
        finalId,
        String(code),
        ord.accountId || accountId || 'acc_main',
        ord.shopName || 'Shopee Shop',
        ord.status || 'COMPLETED',
        ord.statusText || 'Hoàn thành',
        ord.orderTime || new Date().toISOString(),
        ord.cancelTime || null,
        ord.totalAmount || 0,
        ord.refundAmount || 0,
        ord.paymentMethod || 'SHOPEEPAY',
        ord.refundStatus || defaultRefundStatus,
        ord.refundConfirmedAt || null,
        ord.cancelReason || '',
        ord.refundReason || '',
        ord.userNote || '',
        JSON.stringify(ord.items || []),
      ];

      const resInsert = await db.query(upsertQuery, values);
      if (resInsert.rows[0]?.is_insert) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      total: orders.length,
      inserted: insertedCount,
      updated: updatedCount,
    });
  } catch (err) {
    console.error('API Error in /api/sync:', err);
    return res.status(500).json({ error: err.message });
  }
};
