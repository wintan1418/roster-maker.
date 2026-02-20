/**
 * One-time setup script: creates storage policies for org-logos bucket.
 * Run with: node supabase/setup-storage.mjs
 */
import { createClient } from '@supabase/supabase-js';

// Production project
const PROD_URL = 'https://xhtcwugqkyvprrbbjznp.supabase.co';
const PROD_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGN3dWdxa3l2cHJyYmJqem5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUzMjk2NiwiZXhwIjoyMDg3MTA4OTY2fQ.9vcG4BFTIGzG8SJqxfKfGo3wgaYZhJ0Hz1Wi4Xf83A8';

const supabase = createClient(PROD_URL, PROD_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('Setting up storage policies for org-logos bucket...');

  // Test upload with service role to verify bucket is accessible
  const testBlob = new Blob(['test'], { type: 'text/plain' });
  const { error: uploadErr } = await supabase.storage
    .from('org-logos')
    .upload('test/test.txt', testBlob, { upsert: true });

  if (uploadErr) {
    console.error('Bucket upload test failed:', uploadErr.message);
    console.log('');
    console.log('Please run this SQL in the Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/xhtcwugqkyvprrbbjznp/sql/new');
    console.log('');
    console.log(`
-- Storage policies for org-logos
CREATE POLICY "Authenticated users can upload org logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'org-logos');

CREATE POLICY "Public can read org logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can update org logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can delete org logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'org-logos');
    `);
    return;
  }

  // Clean up test file
  await supabase.storage.from('org-logos').remove(['test/test.txt']);
  console.log('Bucket is working correctly with service role.');
  console.log('');
  console.log('IMPORTANT: You still need to add RLS policies so regular users can upload.');
  console.log('Run this SQL in the Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xhtcwugqkyvprrbbjznp/sql/new');
  console.log('');
  console.log(`
CREATE POLICY IF NOT EXISTS "Authenticated users can upload org logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'org-logos');

CREATE POLICY IF NOT EXISTS "Public can read org logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

CREATE POLICY IF NOT EXISTS "Authenticated users can update org logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'org-logos');

CREATE POLICY IF NOT EXISTS "Authenticated users can delete org logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'org-logos');
  `);
}

run().catch(console.error);
