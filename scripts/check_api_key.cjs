const { Client } = require('pg');

const connectionString = "postgresql://postgres.msozshwatonyxnkaqjfs:H0angh0a1256@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

async function getApiKey() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const res = await client.query(`
      SELECT key, value FROM (
        SELECT 'anon' as key, current_setting('request.jwt.claim.role', true) as value
      ) s;
    `);
    console.log("Config check:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

getApiKey();
