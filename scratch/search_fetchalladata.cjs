const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/context/AppContext.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('fetchAllData')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
