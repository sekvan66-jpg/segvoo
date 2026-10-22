const fs = require('fs');
const { chromium } = require('playwright');
const OUT = require('path').join(__dirname, '..', 'logo');

// M-Monogramm: geometrisches M, nach rechts geneigt (Dynamik), rechter Rennstreifen in Rot
const mark = (id) => `
  <defs>
    <linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#E9CD7E"/><stop offset="0.55" stop-color="#C9A04A"/><stop offset="1" stop-color="#A97E2A"/>
    </linearGradient>
  </defs>
  <g transform="skewX(-14)">
    <polygon fill="url(#g${id})" points="0,0 25,0 62,54 99,0 124,0 124,100 101,100 101,40 62,95 23,40 23,100 0,100"/>
    <rect x="133" y="0" width="13" height="100" fill="#D0142C"/>
    <rect x="152" y="0" width="6" height="100" fill="url(#g${id})"/>
  </g>`;

function full(ink, sub) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -6 538 132" width="538" height="132">
  <g transform="translate(20,10)">${mark('a')}</g>
  <rect x="198" y="8" width="2" height="104" fill="${sub}" opacity="0.35"/>
  <text x="226" y="74" font-family="Inter Display" font-weight="800" font-size="84" letter-spacing="4" fill="${ink}">MERZ</text>
  <rect x="229" y="88" width="20" height="4" fill="#D0142C"/>
  <rect x="255" y="88" width="223" height="4" fill="#C9A04A"/>
  <text x="229" y="117" font-family="Inter" font-weight="600" font-size="19" textLength="249" lengthAdjust="spacing" fill="${sub}">AUTOMOBILE</text>
</svg>`;
}
const markOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -12 210 124" width="210" height="124"><g transform="translate(5,0)">${mark('m')}</g></svg>`;

const variants = {
  'merz-logo-dunkel': full('#121417', '#9A7A34'),   // für helle Hintergründe
  'merz-logo-hell':   full('#FFFFFF', '#D9B866'),   // für dunkle Hintergründe
  'merz-monogramm':   markOnly,
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 4 });
  for (const [n, svg] of Object.entries(variants)) {
    fs.writeFileSync(`${OUT}/${n}.svg`, svg);
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await p.locator('svg').screenshot({ path: `${OUT}/${n}.png`, omitBackground: true });
  }
  // Vorschau beider Varianten
  await p.setContent(`<body style="margin:0;font-family:Inter">
   <div style="padding:30px;background:#fff">${variants['merz-logo-dunkel']}</div>
   <div style="padding:30px;background:#121417">${variants['merz-logo-hell']}</div>
   <div style="padding:30px;background:#F4F1EA">${markOnly}</div></body>`);
  await p.screenshot({ path: 'preview.png', fullPage: true });
  await b.close();
})();
