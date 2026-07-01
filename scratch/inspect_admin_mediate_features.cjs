const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/components/dashboard/AdminMediateTab.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('<h1') || line.includes('<h2') || line.includes('<h3') || line.includes('<h4')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
