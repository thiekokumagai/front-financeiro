const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Fix the broken arrow functions
  content = content.replace(/=\s*inputMode="[^"]+"\s*>/g, '=>');

  // 2. Properly add inputMode to specific inputs by injecting it right after <Input or <input
  // But wait, they might already have it because some didn't have onChange and were replaced correctly.
  // We'll strip ALL existing inputModes to be safe.
  content = content.replace(/\s+inputMode="[^"]+"/g, '');

  // Now, inject carefully.
  // Phone/Telefone
  content = content.replace(/(<Input\b(?=[\s\S]*?(?:id|name)=["'](?:phone|telefone)["'][\s\S]*?(?:\/?>)))/gi, '$1 inputMode="numeric"');
  // Valor/Price/Amount
  content = content.replace(/(<Input\b(?=[\s\S]*?(?:id|name)=["'](?:valor|price|costPrice|amount|tx-amount)["'][\s\S]*?(?:\/?>)))/gi, '$1 inputMode="decimal"');
  // Type number/tel
  content = content.replace(/(<(?:Input|input)\b(?=[\s\S]*?type=["'](?:number|tel)["'][\s\S]*?(?:\/?>)))/gi, '$1 inputMode="numeric"');

  // Remove duplicates just in case
  content = content.replace(/inputMode="decimal"\s+inputMode="numeric"/g, 'inputMode="decimal"');
  content = content.replace(/inputMode="numeric"\s+inputMode="decimal"/g, 'inputMode="decimal"');
  content = content.replace(/inputMode="numeric"\s+inputMode="numeric"/g, 'inputMode="numeric"');
  content = content.replace(/inputMode="decimal"\s+inputMode="decimal"/g, 'inputMode="decimal"');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});
