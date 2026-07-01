const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/components/dashboard/UserDashboard.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('fixed') || line.includes('absolute') || line.includes('z-index') || line.includes('zIndex') || line.includes('rgba') || line.includes('overlay')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
