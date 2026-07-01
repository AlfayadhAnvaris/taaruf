const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/components/dashboard/AdminMediateTab.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('templates') || line.includes('Template') || line.includes('panduan') || line.includes('Panduan')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
