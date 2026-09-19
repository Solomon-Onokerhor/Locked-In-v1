const fs = require("fs");
const path = require("path");
const file = path.join("src", "components", "grok-bot", "avatar-runtime.ts");
let txt = fs.readFileSync(file, "utf8");

// We find the declaration: const BROWSER_RUNTIME_SOURCE = "\nconst...
// It ends with: return api;\n}\n"

txt = txt.replace('const BROWSER_RUNTIME_SOURCE = "\\nconst SVG_NS', 'const BROWSER_RUNTIME_SOURCE = `\\nconst SVG_NS');
txt = txt.replace('return api;\\n}\\n"', 'return api;\\n}\\n`');

fs.writeFileSync(file, txt);
console.log("Fixed quotes");
