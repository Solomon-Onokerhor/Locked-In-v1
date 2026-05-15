const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Blue-tinted hex codes -> pure black/gray equivalents
const replacements = [
    { from: /#0a0b14/gi, to: '#000000' },
    { from: /#0f1123/gi, to: '#111111' },
    { from: /#151830/gi, to: '#1a1a1a' },
];

let totalChanges = 0;

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            for (const { from, to } of replacements) {
                const newContent = content.replace(from, to);
                if (newContent !== content) {
                    content = newContent;
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                totalChanges++;
                console.log(`Updated: ${path.relative(__dirname, fullPath)}`);
            }
        }
    }
}

walkDir(srcDir);
console.log(`\nDone! Updated ${totalChanges} files.`);
