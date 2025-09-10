// Script to set up Supabase Storage bucket for case study logos
// Run this with: node setup-storage-bucket.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://duzyicfcmuhbwypdtelz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBucket() {
  try {
    console.log('🔍 Checking existing buckets...');
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📦 Existing buckets:', buckets?.map(b => b.name));
    
    // Check if case-study-logos bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === 'case-study-logos');
    
    if (bucketExists) {
      console.log('✅ case-study-logos bucket already exists');
    } else {
      console.log('📦 Creating case-study-logos bucket...');
      
      const { data: bucket, error: createError } = await supabase.storage.createBucket('case-study-logos', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Bucket created successfully:', bucket);
    }
    
    // Test upload permissions
    console.log('🧪 Testing upload permissions...');
    const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('case-study-logos')
      .upload('test/test.png', testData, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test successful:', uploadData);
      
      // Clean up test file
      await supabase.storage
        .from('case-study-logos')
        .remove(['test/test.png']);
      console.log('🧹 Test file cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorageBucket();
