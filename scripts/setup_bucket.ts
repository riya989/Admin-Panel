import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function setupBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Current buckets:', buckets?.map(b => b.name));

  const kycBucket = buckets?.find(b => b.name === 'kyc_documents');
  if (!kycBucket) {
    const { data, error } = await supabase.storage.createBucket('kyc_documents', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    });
    console.log('Created kyc_documents bucket:', data, error);
  } else {
    console.log('kyc_documents bucket already exists');
  }

  const { data: updatedBuckets } = await supabase.storage.listBuckets();
  console.log('Updated buckets:', updatedBuckets?.map(b => ({ name: b.name, public: b.public })));
}

setupBucket().catch(console.error);
