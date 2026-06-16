const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('URL:', url);
if (!url || !key) {
  console.log('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in the environment.');
  process.exit(1);
}
fetch(url + '/rest/v1/software_trials?select=*', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
})
.then(r => {
  if (!r.ok) {
    return r.text().then(t => { throw new Error(t); });
  }
  return r.json();
})
.then(data => {
  console.log('TRIALS_COUNT:', data.length);
  console.log('TRIALS:', JSON.stringify(data, null, 2));
})
.catch(e => {
  console.error('Fetch Error:', e.message);
});
