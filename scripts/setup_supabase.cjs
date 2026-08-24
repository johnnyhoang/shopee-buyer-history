const { Client } = require('pg');

const connectionString = "postgresql://postgres.msozshwatonyxnkaqjfs:H0angh0a1256@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

async function setup() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("🔌 Đang kết nối tới Supabase PostgreSQL...");
    await client.connect();
    console.log("✅ Kết nối Supabase thành công!");

    // Tạo bảng shopee_accounts
    console.log("📦 Đang tạo bảng shopee_accounts...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS shopee_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT,
        phone TEXT,
        color TEXT DEFAULT 'slate',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Tạo bảng shopee_orders
    console.log("📦 Đang tạo bảng shopee_orders...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS shopee_orders (
        id TEXT PRIMARY KEY,
        order_code TEXT NOT NULL UNIQUE,
        account_id TEXT REFERENCES shopee_accounts(id) ON DELETE SET NULL,
        shop_name TEXT,
        status TEXT,
        status_text TEXT,
        order_time TIMESTAMPTZ,
        cancel_time TIMESTAMPTZ,
        total_amount NUMERIC DEFAULT 0,
        refund_amount NUMERIC DEFAULT 0,
        payment_method TEXT,
        refund_status TEXT DEFAULT 'SHOPEE_REFUNDED',
        refund_confirmed_at TIMESTAMPTZ,
        cancel_reason TEXT,
        refund_reason TEXT,
        user_note TEXT,
        items JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Tự động chèn tài khoản mặc định nếu chưa có
    await client.query(`
      INSERT INTO shopee_accounts (id, name, username, color)
      VALUES ('acc_main', 'Tài khoản chính', 'shopee_user', 'slate')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Cấu hình Row Level Security (RLS) để cho phép client đọc/ghi công khai qua API
    await client.query(`
      ALTER TABLE shopee_accounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE shopee_orders ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public read accounts" ON shopee_accounts;
      DROP POLICY IF EXISTS "Allow public write accounts" ON shopee_accounts;
      DROP POLICY IF EXISTS "Allow public read orders" ON shopee_orders;
      DROP POLICY IF EXISTS "Allow public write orders" ON shopee_orders;

      CREATE POLICY "Allow public read accounts" ON shopee_accounts FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Allow public write accounts" ON shopee_accounts FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Allow public read orders" ON shopee_orders FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Allow public write orders" ON shopee_orders FOR ALL USING (true) WITH CHECK (true);
    `);

    // Bật Supabase Realtime cho các bảng
    try {
      await client.query(`
        ALTER PUBLICATION supabase_realtime ADD TABLE shopee_accounts, shopee_orders;
      `);
      console.log("⚡ Đã bật Realtime đồng bộ tức thì!");
    } catch (realtimeErr) {
      console.log("ℹ️ Realtime publication đã tồn tại hoặc cần bật qua dashboard.");
    }

    console.log("🎉 KHỞI TẠO CƠ SỞ DỮ LIỆU SUPABASE THÀNH CÔNG RỰC RỠ!");
  } catch (err) {
    console.error("❌ Lỗi khi khởi tạo Supabase:", err);
  } finally {
    await client.end();
  }
}

setup();
