import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim()?.replace(/['"]/g, '');
const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)?.[1]?.trim()?.replace(/['"]/g, '');

if (!url || !key) {
  console.log('Error parsing env file');
  process.exit(1);
}

fetch(url + '/rest/v1/admin_settings?select=*', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(r => r.json())
.then(data => {
  console.log('SETTINGS:', JSON.stringify(data, null, 2));
})
.catch(e => {
  console.error('Fetch Error:', e.message);
});
