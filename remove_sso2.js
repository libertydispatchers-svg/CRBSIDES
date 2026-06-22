const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const lines = code.split('\n');
let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("handleSSOClick('Facebook'") || lines[i].includes("handleSSOClick('Apple'")) {
    // go back to find <button
    while(newLines.length > 0 && !newLines[newLines.length - 1].includes('<button')) {
      newLines.pop();
    }
    newLines.pop(); // pop the <button line
    skip = true;
    continue;
  }
  
  if (skip && lines[i].includes('</button>')) {
    skip = false;
    continue;
  }
  
  if (!skip) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('frontend/src/App.jsx', newLines.join('\n'));
console.log('Removed Apple/Facebook buttons line by line.');
