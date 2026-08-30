import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace glassmorphism with solid surface and standard border
    content = content.replace(/bg-surface\/[0-9]+\s+backdrop-blur-(?:xl|2xl|sm|md|lg)/g, 'bg-surface');
    content = content.replace(/bg-surface-2\/[0-9]+\s+backdrop-blur-(?:xl|2xl|sm|md|lg)/g, 'bg-surface-2');
    content = content.replace(/border-white\/[0-9]+/g, 'border-border');
    
    // Fix transparent backgrounds to standard surface backgrounds where applicable
    content = content.replace(/bg-surface\/[0-9]+/g, 'bg-surface');
    content = content.replace(/bg-surface-2\/[0-9]+/g, 'bg-surface-2');
    
    // Replace rounded-3xl with rounded-2xl (closer to 16px radius)
    content = content.replace(/rounded-3xl/g, 'rounded-2xl');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
