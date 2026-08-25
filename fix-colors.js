const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix tooltip contentStyle
  content = content.replace(/backgroundColor:\s*'hsl\(var\(--card\)\)'/g, `backgroundColor: 'var(--card)'`);
  content = content.replace(/color:\s*'hsl\(var\(--card-foreground\)\)'/g, `color: 'var(--foreground)'`);
  content = content.replace(/itemStyle=\{\{\s*color:\s*'hsl\(var\(--foreground\)\)'\s*\}\}/g, `itemStyle={{ color: 'var(--foreground)' }}`);

  // Fix XAxis, YAxis
  content = content.replace(/fill:\s*['"]hsl\(var\(--muted-foreground\)\)['"]/g, `fill: 'var(--muted-foreground)'`);

  // Fix CartesianGrid
  content = content.replace(/stroke=["']hsl\(var\(--muted-foreground\) \/ 0\.2\)["']/g, `stroke="var(--border)"`);
  content = content.replace(/stroke=["']hsl\(var\(--border\)\)["']/g, `stroke="var(--border)"`);

  // Fix primary
  content = content.replace(/stroke=["']hsl\(var\(--primary\)\)["']/g, `stroke="var(--primary)"`);
  content = content.replace(/stopColor=["']hsl\(var\(--primary\)\)["']/g, `stopColor="var(--primary)"`);
  content = content.replace(/fill="hsl\(var\(--primary\)\)"/g, `fill="var(--primary)"`);
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('src');
