const fs = require('fs');
const path = require('path');

const dest = path.join(__dirname, 'www');
if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

// قائمة ملفات ومجلدات موقعك
const itemsToCopy = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icon.svg',
  'css',
  'js',
  'fonts'
];

itemsToCopy.forEach(item => {
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(dest, item);
  if (fs.existsSync(srcPath)) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  }
});

console.log('✓ تم تجهيز مجلد www وملفات التطبيق بنجاح!');
