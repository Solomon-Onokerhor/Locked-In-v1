const fs = require("fs");
const raw = fs.readFileSync('C:\\Users\\pc\\.gemini\\antigravity\\brain\\36a06389-afef-492d-afd4-1d436355a6a4\\.system_generated\\steps\\482\\output.txt', 'utf8');
const match = raw.match(/\[\{[\s\S]*\}\]/);
if (match) {
  const jsonStr = match[0];
  try {
    const data = JSON.parse(jsonStr);
    console.log("Found", data.length, "users");
    fs.writeFileSync('supabase-passwords.json', JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("Parse error:", e.message);
  }
}
