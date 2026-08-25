const fs = require('fs');
const path = require('path');

function parseSVGPathToCanvasSubPaths(d) {
  const tokenRegex = /([A-Za-z])|(-?\d+(?:\.\d+)?)/g;
  let match;
  const tokens = [];
  while ((match = tokenRegex.exec(d)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'cmd', val: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'num', val: parseFloat(match[2]) });
    }
  }

  let currXRaw = 0;
  let currYRaw = 0;
  let subPaths = [];
  
  let currCommands = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  const updateBBox = (x, y) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  const toCanvasX = (xRaw) => xRaw * 0.1;
  const toCanvasY = (yRaw) => 637 - yRaw * 0.1;

  const startNewSubPath = () => {
    if (currCommands.length > 0) {
      subPaths.push({
        d: currCommands.join(' '),
        bbox: { minX, maxX, minY, maxY }
      });
      currCommands = [];
      minX = Infinity;
      maxX = -Infinity;
      minY = Infinity;
      maxY = -Infinity;
    }
  };

  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type !== 'cmd') {
      i++;
      continue;
    }
    const cmd = tokens[i].val;
    i++;
    
    const args = [];
    while (i < tokens.length && tokens[i].type === 'num') {
      args.push(tokens[i].val);
      i++;
    }

    if (cmd === 'M' || cmd === 'm') {
      startNewSubPath();
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        const x = args[k];
        const y = args[k+1];
        if (cmd === 'm') {
          currXRaw += x;
          currYRaw += y;
        } else {
          currXRaw = x;
          currYRaw = y;
        }
        const cx = toCanvasX(currXRaw);
        const cy = toCanvasY(currYRaw);
        updateBBox(cx, cy);
        currCommands.push(`M ${cx.toFixed(2)} ${cy.toFixed(2)}`);
      }
    } else if (cmd === 'C' || cmd === 'c') {
      for (let k = 0; k < args.length; k += 6) {
        if (k + 5 >= args.length) break;
        const x1Raw = cmd === 'c' ? currXRaw + args[k] : args[k];
        const y1Raw = cmd === 'c' ? currYRaw + args[k+1] : args[k+1];
        const x2Raw = cmd === 'c' ? currXRaw + args[k+2] : args[k+2];
        const y2Raw = cmd === 'c' ? currYRaw + args[k+3] : args[k+3];
        const xRaw = cmd === 'c' ? currXRaw + args[k+4] : args[k+4];
        const yRaw = cmd === 'c' ? currYRaw + args[k+5] : args[k+5];
        
        currXRaw = xRaw;
        currYRaw = yRaw;

        const cx1 = toCanvasX(x1Raw);
        const cy1 = toCanvasY(y1Raw);
        const cx2 = toCanvasX(x2Raw);
        const cy2 = toCanvasY(y2Raw);
        const cx = toCanvasX(currXRaw);
        const cy = toCanvasY(currYRaw);

        updateBBox(cx1, cy1);
        updateBBox(cx2, cy2);
        updateBBox(cx, cy);

        currCommands.push(`C ${cx1.toFixed(2)} ${cy1.toFixed(2)}, ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${cx.toFixed(2)} ${cy.toFixed(2)}`);
      }
    } else if (cmd === 'L' || cmd === 'l') {
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        const x = args[k];
        const y = args[k+1];
        if (cmd === 'l') {
          currXRaw += x;
          currYRaw += y;
        } else {
          currXRaw = x;
          currYRaw = y;
        }
        const cx = toCanvasX(currXRaw);
        const cy = toCanvasY(currYRaw);
        updateBBox(cx, cy);
        currCommands.push(`L ${cx.toFixed(2)} ${cy.toFixed(2)}`);
      }
    } else if (cmd === 'H' || cmd === 'h') {
      for (let k = 0; k < args.length; k++) {
        const x = args[k];
        if (cmd === 'h') {
          currXRaw += x;
        } else {
          currXRaw = x;
        }
        const cx = toCanvasX(currXRaw);
        const cy = toCanvasY(currYRaw);
        updateBBox(cx, cy);
        currCommands.push(`L ${cx.toFixed(2)} ${cy.toFixed(2)}`);
      }
    } else if (cmd === 'V' || cmd === 'v') {
      for (let k = 0; k < args.length; k++) {
        const y = args[k];
        if (cmd === 'v') {
          currYRaw += y;
        } else {
          currYRaw = y;
        }
        const cx = toCanvasX(currXRaw);
        const cy = toCanvasY(currYRaw);
        updateBBox(cx, cy);
        currCommands.push(`L ${cx.toFixed(2)} ${cy.toFixed(2)}`);
      }
    } else if (cmd === 'S' || cmd === 's') {
      for (let k = 0; k < args.length; k += 4) {
        if (k + 3 >= args.length) break;
        const x2Raw = cmd === 's' ? currXRaw + args[k] : args[k];
        const y2Raw = cmd === 's' ? currYRaw + args[k+1] : args[k+1];
        const xRaw = cmd === 's' ? currXRaw + args[k+2] : args[k+2];
        const yRaw = cmd === 's' ? currYRaw + args[k+3] : args[k+3];
        
        currXRaw = xRaw;
        currYRaw = yRaw;

        const cx2 = toCanvasX(x2Raw);
        const cy2 = toCanvasY(y2Raw);
        const cx = toCanvasX(currXRaw);
        const cy = toCanvasY(currYRaw);

        updateBBox(cx2, cy2);
        updateBBox(cx, cy);

        currCommands.push(`S ${cx2.toFixed(2)} ${cy2.toFixed(2)}, ${cx.toFixed(2)} ${cy.toFixed(2)}`);
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      currCommands.push('Z');
    }
  }

  startNewSubPath();
  return subPaths;
}

function classifyMuscle(bbox, view) {
  const { minX, maxX, minY, maxY } = bbox;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const height = maxY - minY;
  const width = maxX - minX;

  if (view === 'front') {
    // 1. Outline check: covers the entire body outline
    if (minY < 20 && maxY > 600 && width > 250) {
      return 'outline';
    }

    // 2. Head & Neck
    if (maxY < 115) {
      return 'head_neck';
    }

    // 3. Chest (Pectorals)
    // Chest lines are in Y: 100 to 165, X: 105 to 200
    if (minY >= 100 && maxY <= 170 && minX >= 105 && maxX <= 200) {
      // Exclude shoulders if they are far to the sides
      if (maxX < 125 || minX > 180) {
        return 'shoulders';
      }
      return 'chest';
    }

    // 4. shoulders (Deltoids)
    if (minY >= 100 && maxY <= 175 && (maxX <= 118 || minX >= 186)) {
      return 'shoulders';
    }

    // 5. Arms (Biceps & Forearms & Hands)
    if (centerY >= 130 && centerY <= 400 && (centerX < 110 || centerX > 194)) {
      return 'arms';
    }

    // 6. Core (Abs / Obliques)
    if (minY >= 165 && maxY <= 265 && minX >= 95 && maxX <= 209) {
      // Obliques or abs
      return 'core';
    }

    // 7. Legs (Quads)
    if (centerY >= 240 && centerY <= 410 && minX >= 90 && maxX <= 214) {
      return 'legs_quads';
    }

    // 8. Calves / Shins
    if (centerY > 410) {
      return 'legs_calves';
    }

    // Fallbacks
    if (centerY < 115) return 'head_neck';
    if (centerY < 165) {
      if (centerX < 110 || centerX > 194) return 'shoulders';
      return 'chest';
    }
    if (centerY < 255) {
      if (centerX < 105 || centerX > 199) return 'arms';
      return 'core';
    }
    if (centerY < 410) return 'legs_quads';
    return 'legs_calves';
  } else {
    // BACK view
    if (minY < 20 && maxY > 600 && width > 250) {
      return 'outline';
    }

    // Head & Neck
    if (maxY < 115) {
      return 'head_neck';
    }

    // shoulders
    if (minY >= 100 && maxY <= 175 && (maxX <= 118 || minX >= 186)) {
      return 'shoulders';
    }

    // Upper Back (Traps & Lats)
    if (minY >= 90 && maxY <= 185 && minX >= 90 && maxX <= 214) {
      if (centerX < 110 || centerX > 194) return 'shoulders';
      return 'back_upper';
    }

    // Lower Back
    if (minY >= 170 && maxY <= 260 && minX >= 90 && maxX <= 214) {
      return 'back_lower';
    }

    // Arms
    if (centerY >= 130 && centerY <= 400 && (centerX < 110 || centerX > 194)) {
      return 'arms';
    }

    // Glutes
    if (centerY >= 240 && centerY <= 310 && minX >= 95 && maxX <= 209) {
      return 'legs_glutes';
    }

    // Hamstrings
    if (centerY >= 290 && centerY <= 420 && minX >= 90 && maxX <= 214) {
      return 'legs_hamstrings';
    }

    // Calves
    if (centerY > 410) {
      return 'legs_calves';
    }

    // Fallbacks
    if (centerY < 115) return 'head_neck';
    if (centerY < 175) {
      if (centerX < 110 || centerX > 194) return 'shoulders';
      return 'back_upper';
    }
    if (centerY < 245) {
      if (centerX < 105 || centerX > 199) return 'arms';
      return 'back_lower';
    }
    if (centerY < 310) return 'legs_glutes';
    if (centerY < 410) return 'legs_hamstrings';
    return 'legs_calves';
  }
}

function processSVGFile(filename, view) {
  const filePath = path.join('c:\\Users\\velpe\\OneDrive\\Documentos\\ANTIGRAVITY\\Innova\\client\\public', filename);
  const content = fs.readFileSync(filePath, 'utf8');

  // Regex to extract all path elements
  const pathRegex = /<path\s+[^>]*d="([^"]+)"/g;
  let match;
  let allSubPaths = [];

  let pathIdx = 0;
  while ((match = pathRegex.exec(content)) !== null) {
    const d = match[1];
    const subPaths = parseSVGPathToCanvasSubPaths(d);
    
    subPaths.forEach(sub => {
      // Ignore empty paths
      if (sub.bbox.minX === Infinity || sub.bbox.minY === Infinity) return;
      
      const muscle = classifyMuscle(sub.bbox, view);
      allSubPaths.push({
        id: `${view}_path_${pathIdx++}`,
        d: sub.d,
        muscle,
        bbox: sub.bbox
      });
    });
  }

  return allSubPaths;
}

const frontPaths = processSVGFile('athletic_body.svg', 'front');
const backPaths = processSVGFile('athletic_body_back.svg', 'back');

// Output statistical summary
console.log(`\nFRONT PATHS: ${frontPaths.length}`);
const frontCounts = {};
frontPaths.forEach(p => frontCounts[p.muscle] = (frontCounts[p.muscle] || 0) + 1);
console.log(frontCounts);

console.log(`\nBACK PATHS: ${backPaths.length}`);
const backCounts = {};
backPaths.forEach(p => backCounts[p.muscle] = (backCounts[p.muscle] || 0) + 1);
console.log(backCounts);

// Generate bodyPaths.js
const codeContent = `// Pre-baked vector paths for Innova body visualizer.
// Dimensions: 304 x 637
// Generated automatically from athletic_body.svg and athletic_body_back.svg.

export const bodyPathsFront = ${JSON.stringify(frontPaths, null, 2)};

export const bodyPathsBack = ${JSON.stringify(backPaths, null, 2)};
`;

fs.writeFileSync('c:\\Users\\velpe\\OneDrive\\Documentos\\ANTIGRAVITY\\Innova\\client\\src\\components\\bodyPaths.js', codeContent, 'utf8');
console.log('\nSUCCESS: Generated bodyPaths.js inside client/src/components/bodyPaths.js!');
