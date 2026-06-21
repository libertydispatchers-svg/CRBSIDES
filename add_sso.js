const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

if (!code.includes('Facebook') && !code.includes('Apple')) {
  code = code.replace("} from 'lucide-react';", "  Facebook,\n  Apple\n} from 'lucide-react';");
}

const googlePattern = /onClick=\{\(\) \=\> handleSSOClick\('Google'((?:, '[^']+')?)\)\}[\s\S]*?<\/button>/g;

const facebookBtn = (roleParam) => `
                        <button
                          type="button"
                          onClick={() => handleSSOClick('Facebook'${roleParam})}
                          className="flex items-center justify-center gap-2 py-2.5 border border-[#1877F2]/30 rounded-xl bg-[#1877F2]/10 text-white font-extrabold text-[10px] uppercase hover:bg-[#1877F2] hover:text-white transition-all cursor-pointer font-heading"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                          Facebook
                        </button>`;

const appleBtn = (roleParam) => `
                        <button
                          type="button"
                          onClick={() => handleSSOClick('Apple'${roleParam})}
                          className="flex items-center justify-center gap-2 py-2.5 border border-white/20 rounded-xl bg-black text-white font-extrabold text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer font-heading"
                        >
                          <Apple className="w-3.5 h-3.5" />
                          Apple
                        </button>`;

let replacements = 0;
code = code.replace(googlePattern, (match, roleParam) => {
  replacements++;
  if (match.includes('Facebook')) return match;
  return match + facebookBtn(roleParam) + appleBtn(roleParam);
});

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Added SSO buttons in ' + replacements + ' places');
