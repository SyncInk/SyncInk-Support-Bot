const fs = require('fs');
let css = fs.readFileSync('D:/SyncInk Support/dashboard/src/app/dashboard/tickets/ticket-dashboard.css', 'utf8');

// Reduce font sizes to make it sleeker
css = css.replace(/font-size: 15px;/g, 'font-size: 14px;');
css = css.replace(/font-size: 14px;/g, 'font-size: 13px;');
css = css.replace(/font-size: 13px;/g, 'font-size: 12px;');
css = css.replace(/font-size: 12px;/g, 'font-size: 11px;');

// Keep the topbar slightly spacious
css = css.replace(/padding: 16px 24px;/g, 'padding: 12px 20px;');
css = css.replace(/min-height: 44px;/g, 'min-height: 40px;');

// Card radii
css = css.replace(/border-radius: 24px;/g, 'border-radius: 20px;');

// Darken the sidebar background slightly for pure black contrast
css = css.replace(/rgba\(10 12 24 \/ var\(--liquid-topbar-opacity\)\)/g, 'rgba(5 5 5 / var(--liquid-topbar-opacity))');
css = css.replace(/rgb\(5 7 15 \/ calc\(var\(--liquid-topbar-opacity\) \+ 0\.15\)\)/g, 'rgb(0 0 0 / calc(var(--liquid-topbar-opacity) + 0.15))');

// Deepen the blue/purple gradients used in panels to match the image
css = css.replace(/#69c3ff/g, '#6d28d9'); 
css = css.replace(/rgb\(105 195 255 \/ 0\.22\)/g, 'rgb(139 76 255 / 0.15)'); 
css = css.replace(/rgb\(105 195 255 \/ 0\.12\)/g, 'rgb(139 76 255 / 0.1)');
css = css.replace(/rgb\(105 195 255 \/ 0\.08\)/g, 'rgb(139 76 255 / 0.05)');

fs.writeFileSync('D:/SyncInk Support/dashboard/src/app/dashboard/tickets/ticket-dashboard.css', css, 'utf8');
console.log('CSS Font Sizes & Tweaks Updated!');
