const fs = require("fs");
const path = require("path");

const file = path.join("src", "components", "grok-bot", "avatar-runtime.ts");
let content = fs.readFileSync(file, "utf8");

// First, inject the module-level variables
content = content.replace(
  "let pausedBlinkDelay = 0;",
  "let pausedBlinkDelay = 0;\n  let lookTargetX = 0;\n  let lookTargetY = 0;"
);

// Then, update setLookAt to just set those variables
const oldSetLookAt = `
      setLookAt(x, y) {
        if (currentPose && currentPose.expression) {
          currentPose.expression.headX = x;
          currentPose.expression.headY = y;
          requestTick();
        }
        return api;
      },
`;

const newSetLookAt = `
      setLookAt(x, y) {
        lookTargetX = x;
        lookTargetY = y;
        requestTick();
        return api;
      },
`;

content = content.replace(oldSetLookAt, newSetLookAt);

// Finally, intercept the render function to copy the expression and apply the look target
const renderOld = `const render = (time = performance.now()) => {\\n    const eyeElapsed = time - eyeAmbientStartedAt;\\n    const bodyElapsed = time - bodyAmbientStartedAt;\\n    const expression = currentPose.expression.bodyMotion !== 'none'\\n      ? AvatarProceduralEngine.applyAmbientBodyMotion(currentPose.expression, bodyElapsed, ambientStrength)\\n      : currentPose.expression;\\n    const eyeOffset`;

const renderNew = `const render = (time = performance.now()) => {\\n    const eyeElapsed = time - eyeAmbientStartedAt;\\n    const bodyElapsed = time - bodyAmbientStartedAt;\\n    const expression = currentPose.expression.bodyMotion !== 'none'\\n      ? AvatarProceduralEngine.applyAmbientBodyMotion(currentPose.expression, bodyElapsed, ambientStrength)\\n      : { ...currentPose.expression };\\n    expression.headX += lookTargetX;\\n    expression.headY += lookTargetY;\\n    const eyeOffset`;

content = content.replace(renderOld, renderNew);

fs.writeFileSync(file, content);
console.log("Updated avatar runtime rendering logic");
