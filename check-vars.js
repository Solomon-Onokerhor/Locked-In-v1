const fs = require("fs");
const path = require("path");
const txt = fs.readFileSync(path.join("src", "components", "grok-bot", "avatar-runtime.ts"), "utf8");
const start = txt.indexOf("const BROWSER_RUNTIME_SOURCE =");
const chunk = txt.substring(start, start + 25000); 
console.log("Has template string variables?", chunk.includes("$" + "{"));
