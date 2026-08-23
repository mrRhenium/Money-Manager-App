const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/actions');
const files = fs.readdirSync(dir);
files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('{ new: true }')) {
      content = content.replace(/\{ new: true \}/g, "{ returnDocument: 'after' }");
      fs.writeFileSync(filePath, content);
      console.log('Fixed', file);
    }
  }
});
