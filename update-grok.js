const fs = require("fs");
const path = require("path");

const file = path.join("src", "components", "grok-bot", "GrokBot.tsx");
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  "stop: () => void",
  "stop: () => void\n  setLookAt: (x: number, y: number) => void"
);

content = content.replace(
  "stop() { controller.current?.stop() },",
  "stop() { controller.current?.stop() },\n    setLookAt(x, y) { controller.current?.setLookAt(x, y) },"
);

// We need to replace the animate function inside the useEffect
const animateFuncOld = `    const animate = () => {
      // Lerp for butter-smooth movement
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12

      if (host.current) {
        host.current.style.transform = \`perspective(1000px) rotateX(\${currentX}deg) rotateY(\${currentY}deg)\`
      }
      rafId = requestAnimationFrame(animate)
    }`;

const animateFuncNew = `    const animate = () => {
      // Lerp for butter-smooth movement
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12

      // Apply to internal avatar state instead of CSS transform!
      // targetX correlates to vertical mouse position, targetY to horizontal
      // The avatar's headX maps to horizontal, headY to vertical (inverted).
      controller.current?.setLookAt(currentY, currentX);

      rafId = requestAnimationFrame(animate)
    }`;

content = content.replace(animateFuncOld, animateFuncNew);

// Also remove the CSS reset from the error block:
const errorResetOld = `    if (theme === 'error' || animation === 'angry') {
      // Snap to look straight ahead
      host.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'`;

const errorResetNew = `    if (theme === 'error' || animation === 'angry') {
      // Snap to look straight ahead
      controller.current?.setLookAt(0, 0);`;

content = content.replace(errorResetOld, errorResetNew);

fs.writeFileSync(file, content);
console.log("Updated GrokBot tracking logic");
