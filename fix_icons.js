const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Remove the imports
code = code.replace(/,\s*Facebook,\s*Apple/g, '');

// 2. Replace <Facebook ... /> with an SVG
const fbSvg = `<svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
code = code.replace(/<Facebook className="w-3\.5 h-3\.5" \/>/g, fbSvg);

// 3. Replace <Apple ... /> with an SVG
const appleSvg = `<svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 20.444c-1.396 0-2.827-.615-4.06-1.745-1.536-1.41-3.13-3.612-3.13-6.505 0-2.887 1.405-4.992 3.195-6.223C9.42 4.996 11.026 4.672 12 4.672c1.4 0 2.973.498 4.316 1.644 1.258 1.074 2.584 2.946 2.584 5.879 0 3.018-1.523 5.305-3.181 6.78-1.378 1.226-2.614 1.469-3.719 1.469zm-1.636-16.14c.143-1.895 1.574-3.52 3.418-3.923.332 2.079-1.22 4.02-3.418 3.923z"/></svg>`;
code = code.replace(/<Apple className="w-3\.5 h-3\.5" \/>/g, appleSvg);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Fixed imports and SVGs');
