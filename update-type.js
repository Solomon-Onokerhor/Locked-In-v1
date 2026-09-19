const fs = require("fs");
const path = require("path");

const file = path.join("src", "components", "grok-bot", "avatar-runtime.ts");
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "destroy: () => void",
  "destroy: () => void\n  setLookAt: (x: number, y: number) => RuntimeAvatar<AnimationName>"
);

fs.writeFileSync(file, content);
console.log("Updated RuntimeAvatar type");
