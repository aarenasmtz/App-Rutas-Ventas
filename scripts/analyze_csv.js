const fs = require('fs');

const content = fs.readFileSync('ProductosMiguel.csv', 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

let emptyNameCount = 0;
let invalidPriceCount = 0;
let zeroPriceCount = 0;
let zeroCostCount = 0;

function parseCustomNumber(val) {
  if (!val || val === '') return 0;
  let clean = val.replace(/\s+/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

for (let i = 1; i < lines.length; i++) {
  const cols = parseCSVLine(lines[i]);
  const [codigo, nombre, categoria, unidFrac, stockAct, stockMin, costo, precio] = cols;
  if (!nombre) {
    emptyNameCount++;
    console.log('Row', i + 1, 'empty name!');
  }
  const p = parseCustomNumber(precio);
  const c = parseCustomNumber(costo);
  if (p === null) {
    invalidPriceCount++;
    console.log('Row', i + 1, 'invalid price:', precio);
  } else if (p === 0) {
    zeroPriceCount++;
    console.log('Row with price 0:', i + 1, nombre, 'costo:', costo, 'precio:', precio);
  }
  if (c === 0) {
    zeroCostCount++;
    console.log('Row with cost 0:', i + 1, nombre, 'costo:', costo, 'precio:', precio);
  }
}

console.log('Total lines:', lines.length - 1);
console.log('Empty names:', emptyNameCount);
console.log('Invalid prices:', invalidPriceCount);
console.log('Zero prices:', zeroPriceCount);
console.log('Zero costs:', zeroCostCount);
