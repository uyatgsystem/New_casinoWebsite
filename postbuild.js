const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distBrowserPath = path.join(__dirname, 'dist', 'browser');
const distRootPath = path.join(__dirname, 'dist');
const indexCsrPath = path.join(distBrowserPath, 'index.csr.html');
const indexHtmlBrowser = path.join(distBrowserPath, 'index.html');
const indexHtmlDist = path.join(distRootPath, 'index.html');

console.log('--- Running Postbuild Tasks ---');

// 1. Ensure index.html exists in dist/browser and dist root
if (fs.existsSync(indexCsrPath)) {
  fs.copyFileSync(indexCsrPath, indexHtmlBrowser);
  console.log('✓ Copied index.csr.html -> dist/browser/index.html');
} else if (!fs.existsSync(indexHtmlBrowser)) {
  console.warn('⚠ Could not find index.csr.html or index.html in dist/browser');
}

// 2. Add .htaccess for Angular SPA routing on Apache/cPanel
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;
fs.writeFileSync(path.join(distBrowserPath, '.htaccess'), htaccessContent, 'utf-8');
console.log('✓ Created .htaccess for Apache / cPanel / LiteSpeed static hosting');

// 3. Copy all client files from dist/browser into dist/ root as fallback
try {
  const browserFiles = fs.readdirSync(distBrowserPath);
  for (const file of browserFiles) {
    const srcFile = path.join(distBrowserPath, file);
    const destFile = path.join(distRootPath, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
    }
  }
  console.log('✓ Copied client bundle files to dist root');
} catch (e) {
  console.warn('Note on copying files to root:', e.message);
}

// 4. Ensure Font Awesome webfonts are present in dist/browser/webfonts & dist/webfonts
try {
  const fontawesomeSrc = path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts');
  const browserWebfonts = path.join(distBrowserPath, 'webfonts');
  const distWebfonts = path.join(distRootPath, 'webfonts');

  if (fs.existsSync(fontawesomeSrc)) {
    if (!fs.existsSync(browserWebfonts)) fs.mkdirSync(browserWebfonts, { recursive: true });
    if (!fs.existsSync(distWebfonts)) fs.mkdirSync(distWebfonts, { recursive: true });

    const fontFiles = fs.readdirSync(fontawesomeSrc);
    for (const font of fontFiles) {
      fs.copyFileSync(path.join(fontawesomeSrc, font), path.join(browserWebfonts, font));
      fs.copyFileSync(path.join(fontawesomeSrc, font), path.join(distWebfonts, font));
    }
    console.log('✓ Ensured Font Awesome webfonts copied to dist/browser/webfonts & dist/webfonts');
  }
} catch (e) {
  console.warn('Note on webfonts:', e.message);
}

// 5. Create deployable zip archives containing client files at the root of the zip
try {
  const buildZip = path.join(__dirname, 'build.zip');
  const distZip = path.join(__dirname, 'dist.zip');
  const socialZip = path.join(__dirname, 'social-casino-deploy.zip');

  if (fs.existsSync(buildZip)) fs.unlinkSync(buildZip);
  if (fs.existsSync(distZip)) fs.unlinkSync(distZip);
  if (fs.existsSync(socialZip)) fs.unlinkSync(socialZip);

  console.log('Compressing dist/browser files into build.zip and dist.zip...');
  // Compress contents of dist/browser directly into the root of the zip
  execSync(`powershell -Command "Compress-Archive -Path 'dist/browser/*' -DestinationPath 'build.zip' -Force"`, { stdio: 'inherit' });
  fs.copyFileSync(buildZip, distZip);
  fs.copyFileSync(buildZip, socialZip);
  console.log('✓ Created build.zip, dist.zip and social-casino-deploy.zip with root index.html & bundles!');
} catch (err) {
  console.error('Error creating zip archives:', err.message);
}

console.log('--- Postbuild Complete ---');
