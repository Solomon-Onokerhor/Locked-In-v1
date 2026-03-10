const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// All patterns to replace with B&W equivalents
const replacements = [
    // Hardcoded blue rgba shadows/glows -> white equivalents
    { from: /rgba\(37,\s*99,\s*235,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(16,\s*185,\s*129,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(251,\s*191,\s*36,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(99,\s*102,\s*241,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(139,\s*92,\s*246,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(59,\s*130,\s*246,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(96,\s*165,\s*250,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(147,\s*51,\s*234,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },
    { from: /rgba\(168,\s*85,\s*247,\s*[\d.]+\)/g, to: 'rgba(255, 255, 255, 0.1)' },

    // Remaining Tailwind color classes
    { from: /\bbg-rose-\d{3}\b/g, to: 'bg-white/20' },
    { from: /\bbg-cyan-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-teal-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-sky-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-violet-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-pink-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-fuchsia-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-orange-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-yellow-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-green-\d{3}\b/g, to: 'bg-white/15' },
    { from: /\bbg-lime-\d{3}\b/g, to: 'bg-white/15' },

    { from: /\btext-rose-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-cyan-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-teal-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-sky-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-violet-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-pink-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-fuchsia-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-orange-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-yellow-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-green-\d{3}\b/g, to: 'text-gray-300' },
    { from: /\btext-lime-\d{3}\b/g, to: 'text-gray-300' },

    { from: /\bborder-rose-\d{3}\b/g, to: 'border-white/20' },
    { from: /\bborder-cyan-\d{3}\b/g, to: 'border-white/20' },
    { from: /\bborder-teal-\d{3}\b/g, to: 'border-white/20' },
    { from: /\bborder-sky-\d{3}\b/g, to: 'border-white/20' },

    // Focus ring brand-accent -> white
    { from: /focus:ring-brand-accent/g, to: 'focus:ring-white/30' },

    // Shadow brand-accent -> white shadow
    { from: /shadow-brand-accent\/\d+/g, to: 'shadow-white/10' },

    // Drop shadows with color
    { from: /drop-shadow-\[0_0_\d+px_rgba\([^)]+\)\]/g, to: 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' },
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
