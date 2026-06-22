const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const facebookPattern = /<button[^>]*onClick=\{\(\) \=\> handleSSOClick\('Facebook'[^>]*\s*>[^<]*<svg[^>]*Facebook[^<]*<\/button>/g;
const applePattern = /<button[^>]*onClick=\{\(\) \=\> handleSSOClick\('Apple'[^>]*\s*>[^<]*<svg[^>]*Apple[^<]*<\/button>/g;

// Since we added svgs and the word 'Facebook' or 'Apple', the regex might need to be more robust
// Actually, let's just find the buttons by onClick handler

const btnPattern = /<button[^>]*onClick=\{\(\) \=\> handleSSOClick\('(Facebook|Apple)'[^}]*\}\)[^>]*>[\s\S]*?<\/button>/g;

code = code.replace(btnPattern, '');

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Removed Apple/Facebook buttons.');
