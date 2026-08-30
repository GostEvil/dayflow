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

    // Change h3 and h4 font-medium/semibold to font-bold
    content = content.replace(/<h3 className="font-medium/g, '<h3 className="font-bold');
    content = content.replace(/<h3 className="font-semibold/g, '<h3 className="font-bold');
    content = content.replace(/<h4 className="font-medium/g, '<h4 className="font-bold');
    content = content.replace(/<h4 className="font-semibold/g, '<h4 className="font-bold');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
