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

    // Change w-10 h-10 rounded-2xl to rounded-xl
    content = content.replace(/w-10 h-10 rounded-2xl/g, 'w-10 h-10 rounded-xl bg-surface-2');
    content = content.replace(/w-10 h-10 rounded-xl bg-[a-z]+\/10/g, 'w-10 h-10 rounded-xl bg-surface-2');
    content = content.replace(/bg-glow\/10/g, 'bg-surface-2');
    content = content.replace(/bg-pulse\/10/g, 'bg-surface-2');
    content = content.replace(/bg-ember\/10/g, 'bg-surface-2');
    content = content.replace(/bg-success\/10/g, 'bg-surface-2');
    
    // Convert remaining border-white/5 to border-border
    content = content.replace(/border-white\/[0-9]+/g, 'border-border');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
