const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distBrowserPath = path.join(__dirname, 'dist', 'browser');
const distRootPath = path.join(__dirname, 'dist');
const indexCsrPath = path.join(distBrowserPath, 'index.csr.html');
const indexHtmlBrowser = path.join(distBrowserPath, 'index.html');
const indexHtmlDist = path.join(distRootPath, 'index.html');

console.log('--- Running Postbuild Tasks ---');

// 1. Ensure index.html exists
if (fs.existsSync(indexCsrPath)) {
  fs.copyFileSync(indexCsrPath, indexHtmlBrowser);
  console.log('✓ Copied index.csr.html -> dist/browser/index.html');
  fs.copyFileSync(indexCsrPath, indexHtmlDist);
  console.log('✓ Copied index.csr.html -> dist/index.html');
} else if (fs.existsSync(indexHtmlBrowser)) {
  fs.copyFileSync(indexHtmlBrowser, indexHtmlDist);
  console.log('✓ Copied dist/browser/index.html -> dist/index.html');
} else {
  console.warn('⚠ Could not find index.csr.html or index.html in dist/browser');
}

// 2. Create updated zip files
try {
  const distZip = path.join(__dirname, 'dist.zip');
  const socialZip = path.join(__dirname, 'social-casino-deploy.zip');

  if (fs.existsSync(distZip)) fs.unlinkSync(distZip);
  if (fs.existsSync(socialZip)) fs.unlinkSync(socialZip);

  console.log('Compressing dist folder into dist.zip and social-casino-deploy.zip...');
  execSync(`powershell -Command "Compress-Archive -Path 'dist/*' -DestinationPath 'dist.zip' -Force"`, { stdio: 'inherit' });
  fs.copyFileSync(distZip, socialZip);
  console.log('✓ Created dist.zip and social-casino-deploy.zip successfully!');
} catch (err) {
  console.error('Error creating zip archives:', err.message);
}

console.log('--- Postbuild Complete ---');
