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

    // 1. Tạo bảng sp_accounts (với prefix sp_)
    console.log("📦 Đang tạo bảng sp_accounts...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS sp_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT,
        phone TEXT,
        color TEXT DEFAULT 'slate',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Tạo bảng sp_orders (với prefix sp_)
    console.log("📦 Đang tạo bảng sp_orders...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS sp_orders (
        id TEXT PRIMARY KEY,
        order_code TEXT NOT NULL UNIQUE,
        account_id TEXT REFERENCES sp_accounts(id) ON DELETE SET NULL,
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

    // Chuyển dữ liệu từ shopee_* sang sp_* nếu có
    try {
      await client.query(`
        INSERT INTO sp_accounts SELECT * FROM shopee_accounts ON CONFLICT (id) DO NOTHING;
      `);
      await client.query(`
        INSERT INTO sp_orders SELECT * FROM shopee_orders ON CONFLICT (order_code) DO NOTHING;
      `);
      // Xóa bảng cũ không có prefix sp_
      await client.query(`DROP TABLE IF EXISTS shopee_orders CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS shopee_accounts CASCADE;`);
      console.log("🧹 Đã dọn dẹp các bảng cũ và chuyển sang sp_accounts, sp_orders!");
    } catch (e) {}

    // Tự động chèn tài khoản mặc định
    await client.query(`
      INSERT INTO sp_accounts (id, name, username, color)
      VALUES ('acc_main', 'Tài khoản chính', 'shopee_user', 'slate')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Cấu hình Row Level Security (RLS)
    await client.query(`
      ALTER TABLE sp_accounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sp_orders ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public read sp_accounts" ON sp_accounts;
      DROP POLICY IF EXISTS "Allow public write sp_accounts" ON sp_accounts;
      DROP POLICY IF EXISTS "Allow public read sp_orders" ON sp_orders;
      DROP POLICY IF EXISTS "Allow public write sp_orders" ON sp_orders;

      CREATE POLICY "Allow public read sp_accounts" ON sp_accounts FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Allow public write sp_accounts" ON sp_accounts FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Allow public read sp_orders" ON sp_orders FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Allow public write sp_orders" ON sp_orders FOR ALL USING (true) WITH CHECK (true);
    `);

    // Bật Supabase Realtime
    try {
      await client.query(`
        ALTER PUBLICATION supabase_realtime ADD TABLE sp_accounts, sp_orders;
      `);
    } catch (realtimeErr) {}

    console.log("🎉 KHỞI TẠO BẢNG TIỀN TỐ sp_ THÀNH CÔNG RỰC RỠ!");
  } catch (err) {
    console.error("❌ Lỗi:", err);
  } finally {
    await client.end();
  }
}

setup();
