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

    // Fix tags/badges padding from px-2 py-0.5 or px-2.5 py-1 to px-3 py-1.5
    content = content.replace(/px-2(?:\.5)?\s+py-[0-9\.]+/g, 'px-3 py-1.5');
    content = content.replace(/px-[0-9\.]+\s+py-0\.5/g, 'px-3 py-1.5');

    // Fix task item / small card padding (min 16-20px)
    content = content.replace(/p-3(?![0-9\-])/g, 'p-4');
    content = content.replace(/p-2(?![0-9\-])/g, 'p-3');
    
    // Replace space-y-2 or space-y-3 with space-y-4 (min 16px)
    content = content.replace(/space-y-2(?![0-9\-])/g, 'space-y-4');
    content = content.replace(/space-y-3(?![0-9\-\.])/g, 'space-y-4');
    content = content.replace(/space-y-3\.5/g, 'space-y-4');
    
    // Replace gap-2, gap-3 with gap-4
    content = content.replace(/gap-2(?![0-9\-\.])/g, 'gap-4');
    content = content.replace(/gap-2\.5/g, 'gap-4');
    content = content.replace(/gap-3(?![0-9\-\.])/g, 'gap-4');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
