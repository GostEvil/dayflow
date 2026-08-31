import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/features', function(filePath) {
  if (filePath.endsWith('Page.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove bg-void from the root div.
    // The root div usually starts right after the return ( statement.
    content = content.replace(/return \(\s*<div className="([^"]*)\bbg-void\b([^"]*)"/g, 'return (\n    <div className="$1$2"');
    content = content.replace(/return \(\s*<div className="([^"]*)\bbg-surface\b([^"]*)"/g, 'return (\n    <div className="$1$2"');
    
    // Cleanup double spaces
    content = content.replace(/  +/g, ' ');
    content = content.replace(/className=" /g, 'className="');

    // Increase page padding drastically
    content = content.replace(/px-[456]\s+sm:px-[68]\s+lg:px-10/g, 'px-6 sm:px-12 lg:px-16');
    content = content.replace(/py-[68]\s+sm:py-[1-9][0-9]?/g, 'py-10 sm:py-16');
    content = content.replace(/py-10\s+sm:py-12/g, 'py-12 sm:py-16');
    
    // Also catch simple p-5 sm:p-8 lg:p-10
    content = content.replace(/p-[45]\s+sm:p-[68]\s+lg:p-10/g, 'p-6 sm:p-12 lg:p-16');
    
    // Increase space-y and gap on the main wrappers
    content = content.replace(/space-y-8/g, 'space-y-12');
    content = content.replace(/space-y-10/g, 'space-y-16');
    
    // Increase grid gaps in main layouts
    content = content.replace(/gap-6/g, 'gap-8');
    content = content.replace(/gap-8 lg:gap-10/g, 'gap-12 lg:gap-16');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
