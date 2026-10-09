import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAuth() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  console.log('--- Auth Users ---');
  if (error) console.error('Error listing auth users:', error);
  else {
    console.log(`Found ${users.length} auth users:`);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}, Metadata:`, u.user_metadata);
    });
  }
}

checkAuth().catch(console.error);
