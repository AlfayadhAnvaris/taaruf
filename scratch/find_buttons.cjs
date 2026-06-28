const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/components/dashboard/MyCvTab.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('<button') || line.includes('onClick')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
