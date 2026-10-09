import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function inspect() {
  console.log('--- Inspecting Supabase Database ---');
  
  // 1. Check storage buckets
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  console.log('\n--- Storage Buckets ---');
  if (bucketError) console.error('Bucket error:', bucketError);
  else console.log(JSON.stringify(buckets, null, 2));

  // 2. Test common tables
  const candidateTables = [
    'profiles', 'users', 'shops', 'owners', 'customers',
    'orders', 'order_items', 'menu_items', 'categories',
    'notifications', 'reports', 'issues', 'complaints',
    'admin_audit_logs', 'audit_logs', 'shop_verification_requests',
    'shop_verification_documents', 'documents', 'kyc', 'verifications'
  ];

  console.log('\n--- Checking Candidate Tables ---');
  for (const table of candidateTables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') {
        // relation does not exist
      } else {
        console.log(`Table '${table}': Error -> ${error.message} (${error.code})`);
      }
    } else {
      console.log(`Table '${table}': EXISTS! Count: ${count}`);
      // Get one sample row to see columns
      const { data: sample } = await supabase.from(table).select('*').limit(1);
      if (sample && sample.length > 0) {
        console.log(`  Columns for '${table}':`, Object.keys(sample[0]));
        console.log(`  Sample row:`, JSON.stringify(sample[0], null, 2));
      } else {
        console.log(`  (Table is empty, fetching empty schema column names if possible)`);
        const { data: emptyCols } = await supabase.from(table).select().limit(0);
      }
    }
  }

  // 3. Inspect PostgreSQL schema via PostgREST / RPC or OpenAPI definition
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceRoleKey}`);
    if (res.ok) {
      const openapi = await res.json();
      console.log('\n--- All OpenAPI definitions (Tables & Views) ---');
      console.log(Object.keys(openapi.definitions || {}));
      for (const [name, def] of Object.entries<any>(openapi.definitions || {})) {
        console.log(`\nTable Schema: ${name}`);
        console.log('Properties:', Object.keys(def.properties || {}));
        console.log('Required:', def.required || []);
      }
    }
  } catch (err: any) {
    console.error('Error fetching OpenAPI schema:', err.message);
  }
}

inspect().catch(console.error);
