const fs = require('fs');
const content = fs.readFileSync('ProductosMiguel.csv', 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
let nonThree = 0;
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  for (let c = 0; c < parts.length; c++) {
    const val = parts[c].replace(/"/g, '').trim();
    if (val.includes('.') && !val.includes(',')) {
      const dotParts = val.split('.');
      if (dotParts[dotParts.length - 1].length !== 3) {
        console.log(`Row ${i} col ${c}: "${val}"`);
        nonThree++;
      }
    }
  }
}
console.log(`Finished. Non-3-digit dot numbers: ${nonThree}`);
