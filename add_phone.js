const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const phoneBtn = (roleParam) => `
                        <button
                          type="button"
                          onClick={() => handleSSOClick('Phone'${roleParam})}
                          className="flex items-center justify-center gap-2 py-2.5 border border-[#34d399]/30 rounded-xl bg-[#34d399]/10 text-white font-extrabold text-[10px] uppercase hover:bg-[#34d399] hover:text-black transition-all cursor-pointer font-heading"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Phone
                        </button>`;

const appleFullPattern = /onClick=\{\(\) \=\> handleSSOClick\('Apple'((?:, '[^']+')?)\)\}[\s\S]*?<\/button>/g;

let replacements = 0;
code = code.replace(appleFullPattern, (match, roleParam) => {
  replacements++;
  if (match.includes("Phone")) return match;
  return match + phoneBtn(roleParam);
});

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Added Phone buttons in ' + replacements + ' places');
