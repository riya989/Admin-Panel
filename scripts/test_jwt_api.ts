import dotenv from 'dotenv';
dotenv.config();

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const projectRef = 'aftmqdmiwvpbpsdmsfbu';

async function testJwtOnApi() {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('Status with service_role:', res.status, await res.text());
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}

testJwtOnApi().catch(console.error);
