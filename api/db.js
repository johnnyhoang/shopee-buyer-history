const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.msozshwatonyxnkaqjfs:H0angh0a1256@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
