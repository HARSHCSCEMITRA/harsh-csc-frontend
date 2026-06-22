import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const url = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim()?.replace(/['"]/g, '');
const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.*)/)?.[1]?.trim()?.replace(/['"]/g, '');

console.log('URL:', url);

if (!url || !key) {
  console.log('Error parsing env file');
  process.exit(1);
}

fetch(url + '/rest/v1/software_licenses?select=*&limit=5', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(r => r.json())
.then(data => {
  console.log('LICENSES:', JSON.stringify(data, null, 2));
})
.catch(e => {
  console.error('Fetch Error:', e.message);
});
