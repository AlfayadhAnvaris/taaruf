const fs = require('fs');
try {
  const content = fs.readFileSync('d:/taaruf/.env.local', 'utf8');
  console.log(content);
} catch (e) {
  console.log('.env.local not found');
}
