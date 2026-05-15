const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

const replacements = [
    // Backgrounds
    { regex: /bg-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}\/\d+/g, replace: 'bg-white/10' },
    { regex: /bg-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}/g, replace: 'bg-white/10' },
    { regex: /bg-gradient-to-(br|r|b|t|l|tr|tl|bl) from-(blue|purple|indigo|emerald|amber|red)-[0-9]{3} to-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}/g, replace: 'bg-white/10' },

    // Text colors
    { regex: /text-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}\/\d+/g, replace: 'text-gray-300' },
    { regex: /text-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}/g, replace: 'text-gray-300' },

    // Borders
    { regex: /border-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}\/\d+/g, replace: 'border-white/20' },
    { regex: /border-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}/g, replace: 'border-white/20' },

    // Rings
    { regex: /ring-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}\/\d+/g, replace: 'ring-white/20' },
    { regex: /ring-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}/g, replace: 'ring-white/20' },

    // Shadows
    { regex: /shadow-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}\/\d+/g, replace: 'shadow-white/10' },
    { regex: /shadow-(blue|purple|indigo|emerald|amber|red)-[0-9]{3}/g, replace: 'shadow-white/10' }
];

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            for (const { regex, replace } of replacements) {
                if (regex.test(content)) {
                    content = content.replace(regex, replace);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

walkDir(directory);
console.log('Theme conversion complete.');
