const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/components/dashboard/UserDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('showQaTemplates')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
