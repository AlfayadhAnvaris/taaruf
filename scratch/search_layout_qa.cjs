const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/app/dashboard/layout.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('showQaTemplates') || line.includes('setShowQaTemplates')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
