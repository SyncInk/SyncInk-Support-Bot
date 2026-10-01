const fs = require('fs');
let tsx = fs.readFileSync('D:/SyncInk Support/dashboard/src/app/dashboard/tickets/page.tsx', 'utf8');

// Replace dark blueish backgrounds with neutral black/dark gray backgrounds
tsx = tsx.replace(/rgba\(11, 15, 27, 0\.96\)/g, 'rgba(8, 8, 8, 0.96)');
tsx = tsx.replace(/rgba\(11, 15, 27, 0\.8\)/g, 'rgba(5, 5, 5, 0.8)');
tsx = tsx.replace(/rgba\(11, 15, 27, 0\.95\)/g, 'rgba(5, 5, 5, 0.95)');
tsx = tsx.replace(/rgba\(15, 20, 38, 0\.8\)/g, 'rgba(10, 10, 10, 0.8)');
tsx = tsx.replace(/rgba\(15, 20, 38, 0\.95\)/g, 'rgba(10, 10, 10, 0.95)');

// Replace the older accent color (165, 136, 255) with the new deeper accent color (139, 76, 255)
tsx = tsx.replace(/rgba\(165, 136, 255,/g, 'rgba(139, 76, 255,');

fs.writeFileSync('D:/SyncInk Support/dashboard/src/app/dashboard/tickets/page.tsx', tsx, 'utf8');
console.log('TSX Inline Styles Updated!');
