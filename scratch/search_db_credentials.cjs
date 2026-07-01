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

const files = walk('d:/taaruf');
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('postgres://') || content.includes('postgresql://') || content.includes('DATABASE_URL')) {
      console.log('Found database connection string in:', file);
    }
  } catch (e) {}
});
