const fs = require("fs");
const path = require("path");
const file = path.join("src", "components", "grok-bot", "avatar-runtime.ts");
const txt = fs.readFileSync(file, "utf8");

const start = txt.indexOf("const BROWSER_RUNTIME_SOURCE = `");
console.log(txt.substring(start, start + 300));
