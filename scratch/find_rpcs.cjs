const fs = require('fs');
const envContent = fs.readFileSync('d:/taaruf/.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/?apikey=${env['NEXT_PUBLIC_SUPABASE_ANON_KEY']}`;

async function run() {
  const response = await fetch(url);
  const json = await response.json();
  console.log(json);
}
run();
