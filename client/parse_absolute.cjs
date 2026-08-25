const fs = require('fs');
const path = require('path');

function parsePath(d) {
  // Regex to tokenize the path
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

  let currX = 0;
  let currY = 0;
  let subPaths = [];
  let currSubPath = [];

  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type !== 'cmd') {
      i++;
      continue;
    }
    const cmd = tokens[i].val;
    i++;
    
    // Read numbers until the next command
    const args = [];
    while (i < tokens.length && tokens[i].type === 'num') {
      args.push(tokens[i].val);
      i++;
    }

    if (cmd === 'M' || cmd === 'm') {
      if (currSubPath.length > 0) {
        subPaths.push(currSubPath);
        currSubPath = [];
      }
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        const x = args[k];
        const y = args[k+1];
        if (cmd === 'm' && k > 0) {
          currX += x;
          currY += y;
        } else if (cmd === 'm' && k === 0) {
          currX += x;
          currY += y;
        } else {
          currX = x;
          currY = y;
        }
        currSubPath.push({ x: currX, y: currY });
      }
    } else if (cmd === 'C' || cmd === 'c') {
      for (let k = 0; k < args.length; k += 6) {
        if (k + 5 >= args.length) break;
        // x1, y1, x2, y2, x, y
        const x = args[k+4];
        const y = args[k+5];
        if (cmd === 'c') {
          currX += x;
          currY += y;
        } else {
          currX = x;
          currY = y;
        }
        currSubPath.push({ x: currX, y: currY });
      }
    } else if (cmd === 'L' || cmd === 'l') {
      for (let k = 0; k < args.length; k += 2) {
        if (k + 1 >= args.length) break;
        const x = args[k];
        const y = args[k+1];
        if (cmd === 'l') {
          currX += x;
          currY += y;
        } else {
          currX = x;
          currY = y;
        }
        currSubPath.push({ x: currX, y: currY });
      }
    } else if (cmd === 'H' || cmd === 'h') {
      for (let k = 0; k < args.length; k++) {
        const x = args[k];
        if (cmd === 'h') {
          currX += x;
        } else {
          currX = x;
        }
        currSubPath.push({ x: currX, y: currY });
      }
    } else if (cmd === 'V' || cmd === 'v') {
      for (let k = 0; k < args.length; k++) {
        const y = args[k];
        if (cmd === 'v') {
          currY += y;
        } else {
          currY = y;
        }
        currSubPath.push({ x: currX, y: currY });
      }
    } else if (cmd === 'S' || cmd === 's') {
      for (let k = 0; k < args.length; k += 4) {
        if (k + 3 >= args.length) break;
        const x = args[k+2];
        const y = args[k+3];
        if (cmd === 's') {
          currX += x;
          currY += y;
        } else {
          currX = x;
          currY = y;
        }
        currSubPath.push({ x: currX, y: currY });
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      // Close path
    }
  }

  if (currSubPath.length > 0) {
    subPaths.push(currSubPath);
  }

  return subPaths;
}

function processSVG(filename) {
  const filePath = path.join('c:\\Users\\velpe\\OneDrive\\Documentos\\ANTIGRAVITY\\Innova\\client\\public', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const pathRegex = /<path\s+[^>]*d="([^"]+)"/g;
  let match;
  let allSubPaths = [];

  while ((match = pathRegex.exec(content)) !== null) {
    const d = match[1];
    const subPaths = parsePath(d);
    allSubPaths = allSubPaths.concat(subPaths);
  }

  console.log(`\nProcessed ${filename}: Found ${allSubPaths.length} sub-paths`);
  
  // Convert sub-paths coordinates according to transform translate(0, 637) scale(0.1, -0.1)
  const converted = allSubPaths.map((sub, idx) => {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    const pts = sub.map(pt => {
      const x = pt.x * 0.1;
      const y = 637 - pt.y * 0.1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return { x, y };
    });
    return {
      index: idx,
      bbox: { minX, maxX, minY, maxY },
      points: pts
    };
  });

  // Sort by minY
  converted.sort((a, b) => a.bbox.minY - b.bbox.minY);

  console.log("Top 30 sub-paths by minY (true SVG space):");
  converted.slice(0, 30).forEach(p => {
    console.log(`Idx: ${p.index}, Pts: ${p.points.length}, BBox: [X: ${p.bbox.minX.toFixed(1)} to ${p.bbox.maxX.toFixed(1)}, Y: ${p.bbox.minY.toFixed(1)} to ${p.bbox.maxY.toFixed(1)}]`);
  });

  // Let's filter paths by where they are on the body:
  console.log("\nDetecting main body outline...");
  const largest = converted.reduce((max, p) => p.points.length > max.points.length ? p : max, converted[0]);
  console.log(`Largest path (likely main outline): Idx ${largest.index}, Points: ${largest.points.length}, BBox: [X: ${largest.bbox.minX.toFixed(1)} to ${largest.bbox.maxX.toFixed(1)}, Y: ${largest.bbox.minY.toFixed(1)} to ${largest.bbox.maxY.toFixed(1)}]`);
}

console.log("--- FRONT BODY ---");
processSVG('athletic_body.svg');
console.log("--- BACK BODY ---");
processSVG('athletic_body_back.svg');
