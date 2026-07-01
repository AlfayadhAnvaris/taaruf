const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('d:/taaruf/src');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('Pertanyaan') || line.includes('pertanyaan') || line.includes('Template') || line.includes('template')) {
      if (!file.includes('StatusTab.jsx') && !file.includes('UserDashboard.jsx')) {
        console.log(`${file}:${i+1}: ${line.trim()}`);
      }
    }
  });
});
