const fs = require("fs");
const path = require("path");

const file = path.join("src", "components", "grok-bot", "avatar-runtime.ts");
let content = fs.readFileSync(file, "utf8");

const replacement = `
    setLookAt(x, y) {
      if (currentPose && currentPose.expression) {
        currentPose.expression.headX = x;
        currentPose.expression.headY = y;
        requestTick();
      }
      return api;
    },
    destroy() {
`;

content = content.replace("destroy() {", replacement);

fs.writeFileSync(file, content);
console.log("Injected setLookAt");
