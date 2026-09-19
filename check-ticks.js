const fs = require("fs");
const path = require("path");
const txt = fs.readFileSync(path.join("src", "components", "grok-bot", "avatar-runtime.ts"), "utf8");
const start = txt.indexOf("const BROWSER_RUNTIME_SOURCE =");
const chunk = txt.substring(start, start + 25000); // the whole string
console.log("Has backtick?", chunk.includes("`"));
console.log("Starts with quote?", chunk.substring(0, 100).includes(`"`));
