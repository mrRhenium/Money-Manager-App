const fs = require('fs');

let mainLayout = fs.readFileSync('src/components/layout/MainLayout.tsx', 'utf8');
mainLayout = mainLayout.replace(/hsl\(var\(--background\)\)/g, 'var(--background)');
fs.writeFileSync('src/components/layout/MainLayout.tsx', mainLayout);

let masterView = fs.readFileSync('src/components/layout/MasterView.tsx', 'utf8');
masterView = masterView.replace(/hsl\(var\(--border\) \/ 0\.4\)/g, 'hsl(var(--border-hsl) / 0.4)').replace(/hsl\(var\(--muted\) \/ 0\.3\)/g, 'hsl(var(--muted-hsl) / 0.3)');
// Since we don't have border-hsl, let's just use raw var(--border) and var(--muted) or transparent gradients.
masterView = masterView.replace(/1px solid hsl\(var\(--border\) \/ 0\.4\)/g, '1px solid var(--border)');
masterView = masterView.replace(/linear-gradient\(to bottom, hsl\(var\(--muted\) \/ 0\.3\), transparent\)/g, 'linear-gradient(to bottom, var(--muted), transparent)');
fs.writeFileSync('src/components/layout/MasterView.tsx', masterView);

// auth pages
['login', 'register', 'forgot-password'].forEach(page => {
  let file = `src/app/${page}/page.tsx`;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/hsl\(var\(--muted-foreground\)\)/g, 'var(--muted-foreground)');
  content = content.replace(/hsl\(var\(--primary\)\)/g, 'var(--primary)');
  content = content.replace(/hsl\(var\(--primary-foreground\)\)/g, 'var(--primary-foreground)');
  content = content.replace(/hsla\(var\(--primary\), 0\.2\)/g, 'var(--primary)');
  fs.writeFileSync(file, content);
});
console.log('Fixed auth and layouts');
