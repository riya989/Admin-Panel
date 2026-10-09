import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function detailInspect() {
  console.log('--- Storage Buckets ---');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets, bErr);

  console.log('\n--- Existing Users Count & Samples ---');
  const { data: users, error: uErr } = await supabase.from('users').select('id, phone, email, full_name, role, shop_id, is_active, created_at').limit(10);
  console.log('Users sample:', users, uErr);

  console.log('\n--- Users Role Distribution ---');
  const { data: allUsers } = await supabase.from('users').select('role');
  const roleCounts: Record<string, number> = {};
  allUsers?.forEach(u => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });
  console.log('Role counts in users table:', roleCounts);

  console.log('\n--- Existing Shops Samples ---');
  const { data: shops, error: sErr } = await supabase.from('shops').select('id, owner_id, name, stall_type, is_mobile_stall, is_open, is_active, city, area, pincode, created_at').limit(10);
  console.log('Shops count sample:', shops?.length, shops, sErr);

  console.log('\n--- Existing Orders Count & Samples ---');
  const { data: orders, count: orderCount } = await supabase.from('orders').select('id, token_number, shop_name, order_status, total, created_at', { count: 'exact' }).limit(5);
  console.log(`Orders total: ${orderCount}`, orders);

  console.log('\n--- Existing Customers Count & Samples ---');
  const { data: customers, count: custCount } = await supabase.from('customers').select('id, full_name, phone, email, is_active, created_at', { count: 'exact' }).limit(5);
  console.log(`Customers total: ${custCount}`, customers);
}

detailInspect().catch(console.error);
