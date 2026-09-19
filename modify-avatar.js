const fs = require("fs");
const path = require("path");

const file = path.join("src", "components", "grok-bot", "grok-bot.avatar.ts");
let content = fs.readFileSync(file, "utf8");

// add new expressions
const newExpr1 = `
    "expression-angry-center-1": {
      "id": "expression-angry-center-1",
      "headX": 0,
      "headY": 0,
      "headZ": 0,
      "widthLeft": 20.908203124999996,
      "widthRight": 20.908203124999996,
      "heightLeft": 40.40078125,
      "heightRight": 40.40078125,
      "spacing": 52.059765625,
      "positionXLeft": 0,
      "positionXRight": 0,
      "positionYLeft": 0,
      "positionYRight": 0,
      "leftAngle": -30.865625,
      "rightAngle": 28.781640625,
      "perspective": 1,
      "eyeMotion": "shake",
      "bodyMotion": "shake"
    },
    "expression-angry-center-2": {
      "id": "expression-angry-center-2",
      "headX": 0,
      "headY": 0,
      "headZ": 0,
      "widthLeft": 19.602343750000003,
      "widthRight": 19.602343750000003,
      "heightLeft": 48.63984375,
      "heightRight": 48.63984375,
      "spacing": 55.1,
      "positionXLeft": 0,
      "positionXRight": 0,
      "positionYLeft": 0,
      "positionYRight": 0,
      "leftAngle": -27.606640625,
      "rightAngle": 26.1484375,
      "perspective": 1,
      "eyeMotion": "shake",
      "bodyMotion": "shake"
    },
`;

content = content.replace(/"expressions":\s*\{/, '"expressions": {\n' + newExpr1);

// modify angry animation to use new expressions
content = content.replace(/"angry-step-0",\s*"expressionId":\s*"expression-07"/, '"angry-step-0",\n            "expressionId": "expression-angry-center-1"');
content = content.replace(/"angry-step-1",\s*"expressionId":\s*"expression-16"/, '"angry-step-1",\n            "expressionId": "expression-angry-center-2"');

fs.writeFileSync(file, content);
console.log("Updated avatar expressions");
