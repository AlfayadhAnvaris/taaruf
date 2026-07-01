const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/components/dashboard/AdminMediateTab.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('pertanyaan') || line.toLowerCase().includes('panduan') || line.toLowerCase().includes('q&a') || line.toLowerCase().includes('template') || line.toLowerCase().includes('helper')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
