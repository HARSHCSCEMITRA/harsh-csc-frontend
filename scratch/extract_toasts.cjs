const fs = require('fs');
const content = fs.readFileSync('public/admin.html', 'utf8');
const lines = content.split('\n');

console.log('--- MESSAGE LINES ---');
lines.forEach((line, index) => {
  if (line.includes('showToast') || line.includes('showConfirm') || line.includes('confirm(')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
