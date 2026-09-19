const fs = require('fs');
const txt = fs.readFileSync('src/components/grok-bot/avatar-runtime.ts', 'utf8');
const match = txt.match(/const BROWSER_RUNTIME_SOURCE\s*=\s*`([\s\S]*?)`;/);
if (match) {
  const code = match[1];
  console.log(code.substring(code.indexOf('const render ='), code.indexOf('const api =')));
} else {
  console.log("Not found");
}
