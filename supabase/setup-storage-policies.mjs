/**
 * Creates storage policies for org-logos bucket using the Supabase Admin API.
 * Run with: node supabase/setup-storage-policies.mjs
 *
 * This script uses the pg-meta API endpoint that Supabase exposes for admin use.
 */

const PROD_URL = 'https://xhtcwugqkyvprrbbjznp.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGN3dWdxa3l2cHJyYmJqem5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUzMjk2NiwiZXhwIjoyMDg3MTA4OTY2fQ.9vcG4BFTIGzG8SJqxfKfGo3wgaYZhJ0Hz1Wi4Xf83A8';

// Try pg-meta query endpoint (used by Supabase Studio internally)
async function execSQL(sql) {
  const res = await fetch(`${PROD_URL}/pg-meta/v1/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

const policies = [
  `CREATE POLICY IF NOT EXISTS "Authenticated users can upload org logos"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'org-logos')`,

  `CREATE POLICY IF NOT EXISTS "Public can read org logos"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'org-logos')`,

  `CREATE POLICY IF NOT EXISTS "Authenticated users can update org logos"
   ON storage.objects FOR UPDATE TO authenticated
   USING (bucket_id = 'org-logos')`,

  `CREATE POLICY IF NOT EXISTS "Authenticated users can delete org logos"
   ON storage.objects FOR DELETE TO authenticated
   USING (bucket_id = 'org-logos')`,
];

async function run() {
  console.log('Attempting to create storage policies...\n');

  for (const sql of policies) {
    const { status, body } = await execSQL(sql);
    if (status === 200) {
      console.log('✓', sql.split('\n')[0].trim());
    } else {
      console.log('✗ Failed:', sql.split('\n')[0].trim());
      console.log('  Response:', body.slice(0, 200));
    }
  }

  console.log('\nIf policies failed, run this SQL manually in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xhtcwugqkyvprrbbjznp/sql/new\n');
  console.log(policies.map(p => p.trim() + ';').join('\n\n'));
}

run().catch(console.error);
