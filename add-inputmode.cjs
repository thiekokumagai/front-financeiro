const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

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

const files = walk(srcDir);
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // regex to match <Input ... /> or <input ... />
  // We want to add inputMode="numeric" if it is a phone or currency/value input.
  // We check if it has name="phone", id="phone", etc. or type="tel" or type="number".
  const regex = /<(?:Input|input)\b[^>]*>/gi;
  
  content = content.replace(regex, (match) => {
    if (match.includes('inputMode="numeric"') || match.includes("inputMode='numeric'")) {
      return match; // already has it
    }

    const needsNumeric = 
      /type=["']number["']/i.test(match) ||
      /type=["']tel["']/i.test(match) ||
      /(?:name|id)=["'](?:phone|telefone|price|costPrice|amount|tx-amount|valor|whatsapp)["']/i.test(match) ||
      /placeholder=["'][^"']*(?:R\$|telefone|whatsapp)[^"']*["']/i.test(match) ||
      /onChange=\{\(e\) => set(?:Phone|Telefone|Valor|Amount|Price|Cost)\(/i.test(match);

    if (needsNumeric) {
      // add inputMode="numeric" right before the closing /> or >
      if (match.endsWith('/>')) {
        return match.slice(0, -2) + ' inputMode="numeric" />';
      } else if (match.endsWith('>')) {
        return match.slice(0, -1) + ' inputMode="numeric">';
      }
    }

    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log(`Updated ${changedFiles} files.`);
