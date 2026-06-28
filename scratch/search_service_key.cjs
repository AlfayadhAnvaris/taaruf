const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('.git')) {
          results = results.concat(walk(file));
        }
      } else {
        results.push(file);
      }
    });
  } catch (e) {}
  return results;
}

const files = walk('d:/taaruf');
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhaG1mZm5hZnV3b3Z3enlzenp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9')) {
      console.log('Found service key in:', file);
    }
  } catch (e) {}
});
