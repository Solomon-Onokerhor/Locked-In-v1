const fs = require("fs");
const path = require("path");
const file = path.join("src", "components", "grok-bot", "avatar-runtime.ts");
const txt = fs.readFileSync(file, "utf8");

const start = txt.indexOf("const BROWSER_RUNTIME_SOURCE = `");
const chunk = txt.substring(start, start + 30000);
const engineStart = chunk.indexOf("var AvatarProceduralEngine");
const engineEnd = chunk.indexOf("const SVG_NS");
console.log(chunk.substring(engineStart, engineEnd));
