const fs = require('fs');
const content = fs.readFileSync('d:/taaruf/src/index.css', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('.modal') || line.includes('modal-') || line.includes('.popup')) {
    console.log(`${i+1}: ${line.trim()}`);
  }
});
