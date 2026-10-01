const fs = require('fs');
let css = fs.readFileSync('D:/SyncInk Support/dashboard/src/app/dashboard/tickets/ticket-dashboard.css', 'utf8');

// Replace imports
css = css.replace(
  /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap'\);/g,
  `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');`
);

// Replace variables
css = css.replace(/--bg: #070912;/g, '--bg: #000000;');
css = css.replace(/--bg-elevated: #0d1120;/g, '--bg-elevated: #040404;');
css = css.replace(/--bg-panel: rgba\(14, 18, 34, 0\.84\);/g, '--bg-panel: rgba(8, 8, 8, 0.7);');
css = css.replace(/--bg-panel-strong: #12182b;/g, '--bg-panel-strong: #0a0a0a;');
css = css.replace(/--bg-soft: #161d34;/g, '--bg-soft: #111111;');
css = css.replace(/--bg-hover: rgba\(165, 136, 255, 0\.12\);/g, '--bg-hover: rgba(139, 76, 255, 0.15);');
css = css.replace(/--text: #f7f9ff;/g, '--text: #f4f4f5;');
css = css.replace(/--text-soft: #bac3df;/g, '--text-soft: #a1a1aa;');
css = css.replace(/--text-muted: #7f89aa;/g, '--text-muted: #71717a;');
css = css.replace(/--border: rgba\(255, 255, 255, 0\.08\);/g, '--border: rgba(255, 255, 255, 0.05);');
css = css.replace(/--border-strong: rgba\(165, 136, 255, 0\.24\);/g, '--border-strong: rgba(139, 76, 255, 0.25);');
css = css.replace(/--accent: #a588ff;/g, '--accent: #8b4cff;');
css = css.replace(/--accent-strong: #8e6fff;/g, '--accent-strong: #6c2bd9;');
css = css.replace(/--accent-2: #69c3ff;/g, '--accent-2: #5b21b6;');
css = css.replace(/--radius-xl: 28px;/g, '--radius-xl: 20px;');
css = css.replace(/--radius-lg: 22px;/g, '--radius-lg: 16px;');
css = css.replace(/--radius-md: 18px;/g, '--radius-md: 14px;');
css = css.replace(/--radius-sm: 14px;/g, '--radius-sm: 10px;');
css = css.replace(/--accent-rgb: 165 136 255;/g, '--accent-rgb: 139 76 255;');
css = css.replace(/--accent-ring: rgb\(165 136 255 \/ 0\.2\);/g, '--accent-ring: rgb(139 76 255 / 0.2);');

// Replace body background
const newBodyBg = `background:
    radial-gradient(ellipse at 15% -5%, rgba(139, 76, 255, 0.15), transparent 45%),
    radial-gradient(ellipse at 85% 105%, rgba(91, 33, 182, 0.12), transparent 45%),
    linear-gradient(180deg, #000000 0%, #030303 100%);`;
css = css.replace(/background:[\s\S]*?linear-gradient\(180deg, #060811 0%, #090d19 34%, #05070f 100%\);/g, newBodyBg);

// Replace fonts
css = css.replace(/'Manrope'/g, "'Plus Jakarta Sans'");
css = css.replace(/'Sora'/g, "'Outfit'");

fs.writeFileSync('D:/SyncInk Support/dashboard/src/app/dashboard/tickets/ticket-dashboard.css', css, 'utf8');
console.log('CSS Updated!');
